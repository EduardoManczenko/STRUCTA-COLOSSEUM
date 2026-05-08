//! # STRUCTA — Tokenized Real Estate Protocol (Anchor Program)
//!
//! One on-chain `Project` is created per real-estate development. Each project
//! mints its own SPL token (the "cota"), and owns three USDC vaults:
//!
//! * `vault_principal` — receives USDC from investors when they buy cotas.
//! * `vault_yield`     — receives USDC deposits the admin distributes to holders.
//! * `vault_burn`      — receives the principal pool when refund/burn is unlocked.
//!
//! The wallet that initialised the project is the sole on-chain authority for
//! all administrative actions (sale toggles, yield distribution, withdrawals,
//! burn unlock, etc.). A future upgrade can swap this for a multisig signer.
//!
//! ## Yield distribution
//!
//! We use the classic "cumulative yield per token" pattern:
//!
//! * `distribute_yield(amount)` → increments
//!   `cumulative_yield_per_token += amount * SCALE / cotas_minted`.
//! * Holders later call `claim_yield`, receiving:
//!     `(cumulative - last_claimed) * cota_balance / SCALE` USDC,
//!   then their `last_claimed_per_token` snapshot is bumped.
//!
//! This avoids unbounded loops in any single instruction and scales to an
//! arbitrary number of holders. A backend crank can also trigger
//! `claim_yield_for(holder)` on behalf of every holder if desired.
//!
//! ## Cota transfer model
//!
//! Cotas are non-transferable for the v1 protocol. After every `mint_to`
//! the program freezes the holder's token account using the mint's
//! freeze authority (which is the Project Authority PDA). Burns require
//! `unlock_burn` to be set: the program thaws the account, burns, then
//! re-freezes it if any balance remains.

use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{
    self, Burn, FreezeAccount, Mint, MintTo, ThawAccount, Token, TokenAccount, Transfer,
};

declare_id!("2vEvLqNyMKPx7B6nz1yaKJgNBMV7DeXv17dTYR8T5SSf");

/// Scaling factor for `cumulative_yield_per_token` fixed-point math.
/// 1e12 gives sub-microcent precision for USDC distributions.
pub const YIELD_SCALE: u128 = 1_000_000_000_000;

/// Maximum supply we accept per project (sanity check, ~10 billion cotas).
pub const MAX_TOKEN_SUPPLY: u64 = 10_000_000_000;

#[program]
pub mod structa {
    use super::*;

    /// Initialise a new development project.
    ///
    /// Creates:
    /// * the [`ProjectState`] PDA,
    /// * the cota SPL [`Mint`] (mint + freeze authority = Project Authority PDA),
    /// * three USDC token-account vaults (principal, yield, burn) owned by
    ///   the Project Authority PDA.
    ///
    /// `project_seed` is an arbitrary 32-byte identifier (e.g. the first
    /// 32 bytes of the development UUID). This lets us derive deterministic
    /// PDAs without holding a global counter.
    pub fn initialize_project(
        ctx: Context<InitializeProject>,
        project_seed: [u8; 32],
        token_decimals: u8,
        total_supply: u64,
        token_price_usdc: u64,
    ) -> Result<()> {
        require!(total_supply > 0, StructaError::InvalidTotalSupply);
        require!(
            total_supply <= MAX_TOKEN_SUPPLY,
            StructaError::InvalidTotalSupply
        );
        require!(token_price_usdc > 0, StructaError::InvalidTokenPrice);
        require!(token_decimals <= 9, StructaError::InvalidTokenDecimals);

        let project = &mut ctx.accounts.project;
        project.authority = ctx.accounts.authority.key();
        project.project_seed = project_seed;
        project.cota_mint = ctx.accounts.cota_mint.key();
        project.usdc_mint = ctx.accounts.usdc_mint.key();
        project.vault_principal = ctx.accounts.vault_principal.key();
        project.vault_yield = ctx.accounts.vault_yield.key();
        project.vault_burn = ctx.accounts.vault_burn.key();
        project.token_price_usdc = token_price_usdc;
        project.total_supply = total_supply;
        project.cotas_minted = 0;
        project.cumulative_yield_per_token = 0;
        project.total_yield_distributed = 0;
        project.total_yield_claimed = 0;
        project.token_decimals = token_decimals;
        project.sale_open = false;
        project.burn_unlocked = false;
        project.bump = ctx.bumps.project;
        project.authority_bump = ctx.bumps.project_authority;

        emit!(ProjectInitialized {
            project: project.key(),
            authority: project.authority,
            cota_mint: project.cota_mint,
            total_supply,
            token_price_usdc,
        });

        Ok(())
    }

    /// Open the cota sale (only authority).
    pub fn open_sale(ctx: Context<UpdateProject>) -> Result<()> {
        let project = &mut ctx.accounts.project;
        require!(!project.sale_open, StructaError::SaleAlreadyOpen);
        project.sale_open = true;
        emit!(SaleStateChanged { project: project.key(), open: true });
        Ok(())
    }

    /// Close the cota sale (only authority).
    pub fn close_sale(ctx: Context<UpdateProject>) -> Result<()> {
        let project = &mut ctx.accounts.project;
        require!(project.sale_open, StructaError::SaleAlreadyClosed);
        project.sale_open = false;
        emit!(SaleStateChanged { project: project.key(), open: false });
        Ok(())
    }

    /// Buy `amount` cotas. Investor pays `amount * token_price_usdc` in USDC
    /// to `vault_principal` and receives `amount` freshly-minted SPL tokens.
    ///
    /// If the holder is buying for the first time, a [`HolderState`] PDA is
    /// initialised and their `last_claimed_per_token` is set to the current
    /// `cumulative_yield_per_token`, so they don't earn retroactive yield.
    /// Subsequent buys auto-settle any pending yield first to keep the math
    /// clean (single snapshot per holder).
    pub fn buy_cotas(ctx: Context<BuyCotas>, amount: u64) -> Result<()> {
        require!(amount > 0, StructaError::InvalidAmount);

        let project_key = ctx.accounts.project.key();
        let authority_bump = ctx.accounts.project.authority_bump;

        // ── Read-only project state ────────────────────────────────────
        require!(
            ctx.accounts.project.sale_open,
            StructaError::SaleClosed
        );
        require!(
            ctx.accounts.project.cotas_minted.checked_add(amount).ok_or(StructaError::MathOverflow)?
                <= ctx.accounts.project.total_supply,
            StructaError::SoldOut
        );
        let usdc_amount = (amount as u128)
            .checked_mul(ctx.accounts.project.token_price_usdc as u128)
            .ok_or(StructaError::MathOverflow)?;
        require!(usdc_amount <= u64::MAX as u128, StructaError::MathOverflow);
        let usdc_amount = usdc_amount as u64;

        // ── 1. Transfer USDC from buyer → vault_principal ───────────────
        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.buyer_usdc_ata.to_account_info(),
                to: ctx.accounts.vault_principal.to_account_info(),
                authority: ctx.accounts.buyer.to_account_info(),
            },
        );
        token::transfer(cpi_ctx, usdc_amount)?;

        // ── 2. Settle pending yield BEFORE balance change ──────────────
        let holder = &mut ctx.accounts.holder;
        let cumulative = ctx.accounts.project.cumulative_yield_per_token;
        let was_initialized = holder.cota_balance > 0 || holder.holder == ctx.accounts.buyer.key();

        if was_initialized && holder.cota_balance > 0 {
            let pending = pending_yield(holder.cota_balance, cumulative, holder.last_claimed_per_token)?;
            if pending > 0 {
                let signer_seeds: &[&[&[u8]]] = &[&[
                    PROJECT_AUTHORITY_SEED,
                    project_key.as_ref(),
                    &[authority_bump],
                ]];
                let cpi = CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.vault_yield.to_account_info(),
                        to: ctx.accounts.buyer_usdc_ata.to_account_info(),
                        authority: ctx.accounts.project_authority.to_account_info(),
                    },
                    signer_seeds,
                );
                token::transfer(cpi, pending)?;
                ctx.accounts.project.total_yield_claimed = ctx
                    .accounts
                    .project
                    .total_yield_claimed
                    .checked_add(pending)
                    .ok_or(StructaError::MathOverflow)?;
                emit!(YieldClaimed {
                    project: project_key,
                    holder: ctx.accounts.buyer.key(),
                    amount: pending,
                });
            }
        }

        holder.project = project_key;
        holder.holder = ctx.accounts.buyer.key();
        holder.bump = ctx.bumps.holder;
        holder.last_claimed_per_token = cumulative;
        holder.cota_balance = holder
            .cota_balance
            .checked_add(amount)
            .ok_or(StructaError::MathOverflow)?;

        // ── 3. Thaw buyer's cota ATA (if frozen), mint, then re-freeze ─
        let signer_seeds: &[&[&[u8]]] = &[&[
            PROJECT_AUTHORITY_SEED,
            project_key.as_ref(),
            &[authority_bump],
        ]];

        if ctx.accounts.buyer_cota_ata.is_frozen() {
            let cpi = CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                ThawAccount {
                    account: ctx.accounts.buyer_cota_ata.to_account_info(),
                    mint: ctx.accounts.cota_mint.to_account_info(),
                    authority: ctx.accounts.project_authority.to_account_info(),
                },
                signer_seeds,
            );
            token::thaw_account(cpi)?;
        }

        let cpi = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.cota_mint.to_account_info(),
                to: ctx.accounts.buyer_cota_ata.to_account_info(),
                authority: ctx.accounts.project_authority.to_account_info(),
            },
            signer_seeds,
        );
        token::mint_to(cpi, amount)?;

        let cpi = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            FreezeAccount {
                account: ctx.accounts.buyer_cota_ata.to_account_info(),
                mint: ctx.accounts.cota_mint.to_account_info(),
                authority: ctx.accounts.project_authority.to_account_info(),
            },
            signer_seeds,
        );
        token::freeze_account(cpi)?;

        // ── 4. Update project counters ─────────────────────────────────
        ctx.accounts.project.cotas_minted = ctx
            .accounts
            .project
            .cotas_minted
            .checked_add(amount)
            .ok_or(StructaError::MathOverflow)?;

        emit!(CotasPurchased {
            project: project_key,
            buyer: ctx.accounts.buyer.key(),
            amount,
            usdc_paid: usdc_amount,
        });
        Ok(())
    }

    /// Distribute `amount` of USDC pro-rata over current cota holders.
    ///
    /// The USDC must already be sitting in `vault_yield`. The instruction
    /// is a pure on-chain bookkeeping update: it increments
    /// `cumulative_yield_per_token` by `amount * SCALE / cotas_minted`. The
    /// USDC stays in the vault until each holder calls `claim_yield`.
    pub fn distribute_yield(ctx: Context<DistributeYield>, amount: u64) -> Result<()> {
        require!(amount > 0, StructaError::InvalidAmount);
        let project = &mut ctx.accounts.project;
        require!(project.cotas_minted > 0, StructaError::NoHolders);

        let outstanding = project
            .total_yield_distributed
            .checked_sub(project.total_yield_claimed)
            .ok_or(StructaError::MathOverflow)?;
        let needed = outstanding.checked_add(amount).ok_or(StructaError::MathOverflow)?;
        require!(
            ctx.accounts.vault_yield.amount >= needed,
            StructaError::InsufficientYieldVault
        );

        let increment = (amount as u128)
            .checked_mul(YIELD_SCALE)
            .ok_or(StructaError::MathOverflow)?
            .checked_div(project.cotas_minted as u128)
            .ok_or(StructaError::MathOverflow)?;
        project.cumulative_yield_per_token = project
            .cumulative_yield_per_token
            .checked_add(increment)
            .ok_or(StructaError::MathOverflow)?;
        project.total_yield_distributed = project
            .total_yield_distributed
            .checked_add(amount)
            .ok_or(StructaError::MathOverflow)?;

        emit!(YieldDistributed {
            project: project.key(),
            amount,
            cumulative_yield_per_token: project.cumulative_yield_per_token,
            cotas_minted: project.cotas_minted,
        });
        Ok(())
    }

    /// Holder pulls their pending yield from `vault_yield`.
    pub fn claim_yield(ctx: Context<ClaimYield>) -> Result<()> {
        let project_key = ctx.accounts.project.key();
        let authority_bump = ctx.accounts.project.authority_bump;
        let cumulative = ctx.accounts.project.cumulative_yield_per_token;

        let holder = &mut ctx.accounts.holder;
        require!(holder.cota_balance > 0, StructaError::NoCotaBalance);

        let pending = pending_yield(holder.cota_balance, cumulative, holder.last_claimed_per_token)?;
        require!(pending > 0, StructaError::NothingToClaim);

        let signer_seeds: &[&[&[u8]]] = &[&[
            PROJECT_AUTHORITY_SEED,
            project_key.as_ref(),
            &[authority_bump],
        ]];

        let cpi = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.vault_yield.to_account_info(),
                to: ctx.accounts.holder_usdc_ata.to_account_info(),
                authority: ctx.accounts.project_authority.to_account_info(),
            },
            signer_seeds,
        );
        token::transfer(cpi, pending)?;

        holder.last_claimed_per_token = cumulative;
        ctx.accounts.project.total_yield_claimed = ctx
            .accounts
            .project
            .total_yield_claimed
            .checked_add(pending)
            .ok_or(StructaError::MathOverflow)?;

        emit!(YieldClaimed {
            project: project_key,
            holder: holder.holder,
            amount: pending,
        });
        Ok(())
    }

    /// Authority withdraws `amount` of USDC from `vault_principal` to a
    /// destination ATA (e.g. the incorporadora's USDC account).
    pub fn withdraw_principal(ctx: Context<WithdrawPrincipal>, amount: u64) -> Result<()> {
        require!(amount > 0, StructaError::InvalidAmount);
        require!(
            ctx.accounts.vault_principal.amount >= amount,
            StructaError::InsufficientPrincipalVault
        );

        let project_key = ctx.accounts.project.key();
        let authority_bump = ctx.accounts.project.authority_bump;
        let signer_seeds: &[&[&[u8]]] = &[&[
            PROJECT_AUTHORITY_SEED,
            project_key.as_ref(),
            &[authority_bump],
        ]];

        let cpi = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.vault_principal.to_account_info(),
                to: ctx.accounts.destination.to_account_info(),
                authority: ctx.accounts.project_authority.to_account_info(),
            },
            signer_seeds,
        );
        token::transfer(cpi, amount)?;

        emit!(PrincipalWithdrawn {
            project: project_key,
            amount,
            destination: ctx.accounts.destination.key(),
        });
        Ok(())
    }

    /// Move all remaining USDC from `vault_principal` to `vault_burn` and
    /// flag the project as `burn_unlocked = true`. Holders can then
    /// `burn_cotas` to redeem their principal at the original
    /// `token_price_usdc`.
    pub fn unlock_burn(ctx: Context<UnlockBurn>) -> Result<()> {
        let project_key = ctx.accounts.project.key();
        let authority_bump = ctx.accounts.project.authority_bump;
        let principal_balance = ctx.accounts.vault_principal.amount;

        if principal_balance > 0 {
            let signer_seeds: &[&[&[u8]]] = &[&[
                PROJECT_AUTHORITY_SEED,
                project_key.as_ref(),
                &[authority_bump],
            ]];
            let cpi = CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.vault_principal.to_account_info(),
                    to: ctx.accounts.vault_burn.to_account_info(),
                    authority: ctx.accounts.project_authority.to_account_info(),
                },
                signer_seeds,
            );
            token::transfer(cpi, principal_balance)?;
        }

        let project = &mut ctx.accounts.project;
        project.burn_unlocked = true;
        // Closing the sale once burn is unlocked avoids accepting new buyers.
        project.sale_open = false;

        emit!(BurnUnlocked {
            project: project_key,
            principal_moved: principal_balance,
        });
        Ok(())
    }

    /// Re-lock the burn pool. Doesn't move USDC back; just toggles the flag.
    pub fn lock_burn(ctx: Context<UpdateProject>) -> Result<()> {
        let project = &mut ctx.accounts.project;
        require!(project.burn_unlocked, StructaError::BurnAlreadyLocked);
        project.burn_unlocked = false;
        emit!(BurnLocked { project: project.key() });
        Ok(())
    }

    /// Holder burns `amount` of cotas in exchange for
    /// `amount * token_price_usdc` USDC from `vault_burn`.
    /// The holder's pending yield is auto-settled before the burn.
    pub fn burn_cotas(ctx: Context<BurnCotas>, amount: u64) -> Result<()> {
        require!(amount > 0, StructaError::InvalidAmount);

        let project_key = ctx.accounts.project.key();
        let authority_bump = ctx.accounts.project.authority_bump;
        let cumulative = ctx.accounts.project.cumulative_yield_per_token;
        let token_price = ctx.accounts.project.token_price_usdc;

        require!(
            ctx.accounts.project.burn_unlocked,
            StructaError::BurnNotUnlocked
        );

        let holder = &mut ctx.accounts.holder;
        require!(holder.cota_balance >= amount, StructaError::InsufficientCotas);

        let signer_seeds: &[&[&[u8]]] = &[&[
            PROJECT_AUTHORITY_SEED,
            project_key.as_ref(),
            &[authority_bump],
        ]];

        // ── 1. Settle pending yield first ──────────────────────────────
        let pending = pending_yield(holder.cota_balance, cumulative, holder.last_claimed_per_token)?;
        if pending > 0 {
            let cpi = CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.vault_yield.to_account_info(),
                    to: ctx.accounts.holder_usdc_ata.to_account_info(),
                    authority: ctx.accounts.project_authority.to_account_info(),
                },
                signer_seeds,
            );
            token::transfer(cpi, pending)?;
            ctx.accounts.project.total_yield_claimed = ctx
                .accounts
                .project
                .total_yield_claimed
                .checked_add(pending)
                .ok_or(StructaError::MathOverflow)?;
            emit!(YieldClaimed {
                project: project_key,
                holder: holder.holder,
                amount: pending,
            });
        }
        holder.last_claimed_per_token = cumulative;

        // ── 2. Pay holder principal from vault_burn ────────────────────
        let payout = (amount as u128)
            .checked_mul(token_price as u128)
            .ok_or(StructaError::MathOverflow)?;
        require!(payout <= u64::MAX as u128, StructaError::MathOverflow);
        let payout = payout as u64;
        require!(
            ctx.accounts.vault_burn.amount >= payout,
            StructaError::InsufficientBurnVault
        );

        let cpi = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.vault_burn.to_account_info(),
                to: ctx.accounts.holder_usdc_ata.to_account_info(),
                authority: ctx.accounts.project_authority.to_account_info(),
            },
            signer_seeds,
        );
        token::transfer(cpi, payout)?;

        // ── 3. Thaw → burn → (optionally) re-freeze ────────────────────
        if ctx.accounts.holder_cota_ata.is_frozen() {
            let cpi = CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                ThawAccount {
                    account: ctx.accounts.holder_cota_ata.to_account_info(),
                    mint: ctx.accounts.cota_mint.to_account_info(),
                    authority: ctx.accounts.project_authority.to_account_info(),
                },
                signer_seeds,
            );
            token::thaw_account(cpi)?;
        }

        let cpi = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Burn {
                mint: ctx.accounts.cota_mint.to_account_info(),
                from: ctx.accounts.holder_cota_ata.to_account_info(),
                authority: ctx.accounts.holder_signer.to_account_info(),
            },
        );
        token::burn(cpi, amount)?;

        holder.cota_balance = holder
            .cota_balance
            .checked_sub(amount)
            .ok_or(StructaError::MathOverflow)?;

        // Re-freeze if any balance remains, to keep cotas non-transferable.
        if holder.cota_balance > 0 {
            let cpi = CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                FreezeAccount {
                    account: ctx.accounts.holder_cota_ata.to_account_info(),
                    mint: ctx.accounts.cota_mint.to_account_info(),
                    authority: ctx.accounts.project_authority.to_account_info(),
                },
                signer_seeds,
            );
            token::freeze_account(cpi)?;
        }

        ctx.accounts.project.cotas_minted = ctx
            .accounts
            .project
            .cotas_minted
            .checked_sub(amount)
            .ok_or(StructaError::MathOverflow)?;

        emit!(CotasBurned {
            project: project_key,
            holder: holder.holder,
            amount,
            usdc_returned: payout,
        });
        Ok(())
    }

    /// Authority transfers control to a new wallet. Useful for moving from
    /// a single-signer admin to a multisig in the future.
    pub fn transfer_authority(ctx: Context<TransferAuthority>, new_authority: Pubkey) -> Result<()> {
        require!(new_authority != Pubkey::default(), StructaError::InvalidAuthority);
        let project = &mut ctx.accounts.project;
        let old = project.authority;
        project.authority = new_authority;
        emit!(AuthorityTransferred {
            project: project.key(),
            old_authority: old,
            new_authority,
        });
        Ok(())
    }
}

/// Compute pending yield in raw USDC units for a holder.
fn pending_yield(balance: u64, cumulative: u128, last_claimed: u128) -> Result<u64> {
    let delta = cumulative
        .checked_sub(last_claimed)
        .ok_or(StructaError::MathOverflow)?;
    let raw = (balance as u128)
        .checked_mul(delta)
        .ok_or(StructaError::MathOverflow)?
        .checked_div(YIELD_SCALE)
        .ok_or(StructaError::MathOverflow)?;
    require!(raw <= u64::MAX as u128, StructaError::MathOverflow);
    Ok(raw as u64)
}

// ─── PDA seeds ──────────────────────────────────────────────────────────
pub const PROJECT_SEED: &[u8] = b"project";
pub const PROJECT_AUTHORITY_SEED: &[u8] = b"authority";
pub const VAULT_PRINCIPAL_SEED: &[u8] = b"vault_principal";
pub const VAULT_YIELD_SEED: &[u8] = b"vault_yield";
pub const VAULT_BURN_SEED: &[u8] = b"vault_burn";
pub const COTA_MINT_SEED: &[u8] = b"cota_mint";
pub const HOLDER_SEED: &[u8] = b"holder";

// ─── Accounts ───────────────────────────────────────────────────────────

#[derive(Accounts)]
#[instruction(project_seed: [u8; 32], token_decimals: u8)]
pub struct InitializeProject<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = ProjectState::SIZE,
        seeds = [PROJECT_SEED, project_seed.as_ref()],
        bump,
    )]
    pub project: Account<'info, ProjectState>,

    /// PDA that signs for vault transfers, mint authority and freeze authority.
    /// CHECK: derived as a PDA, no data, used only as signer seeds.
    #[account(
        seeds = [PROJECT_AUTHORITY_SEED, project.key().as_ref()],
        bump,
    )]
    pub project_authority: UncheckedAccount<'info>,

    /// USDC mint reference. Stored on-chain so vault accounts can be
    /// validated in subsequent instructions.
    pub usdc_mint: Account<'info, Mint>,

    /// Newly-created cota mint. PDA so the address is deterministic per
    /// project.
    #[account(
        init,
        payer = authority,
        seeds = [COTA_MINT_SEED, project.key().as_ref()],
        bump,
        mint::decimals = token_decimals,
        mint::authority = project_authority,
        mint::freeze_authority = project_authority,
    )]
    pub cota_mint: Account<'info, Mint>,

    #[account(
        init,
        payer = authority,
        seeds = [VAULT_PRINCIPAL_SEED, project.key().as_ref()],
        bump,
        token::mint = usdc_mint,
        token::authority = project_authority,
    )]
    pub vault_principal: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = authority,
        seeds = [VAULT_YIELD_SEED, project.key().as_ref()],
        bump,
        token::mint = usdc_mint,
        token::authority = project_authority,
    )]
    pub vault_yield: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = authority,
        seeds = [VAULT_BURN_SEED, project.key().as_ref()],
        bump,
        token::mint = usdc_mint,
        token::authority = project_authority,
    )]
    pub vault_burn: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

/// Generic "authority-mutates-project-flag" context (open_sale, close_sale, lock_burn, …).
#[derive(Accounts)]
pub struct UpdateProject<'info> {
    pub authority: Signer<'info>,

    #[account(
        mut,
        has_one = authority @ StructaError::Unauthorized,
        seeds = [PROJECT_SEED, project.project_seed.as_ref()],
        bump = project.bump,
    )]
    pub project: Account<'info, ProjectState>,
}

#[derive(Accounts)]
pub struct BuyCotas<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,

    #[account(
        mut,
        seeds = [PROJECT_SEED, project.project_seed.as_ref()],
        bump = project.bump,
    )]
    pub project: Box<Account<'info, ProjectState>>,

    /// CHECK: PDA, signs for mint+vault transfers via seeds.
    #[account(
        seeds = [PROJECT_AUTHORITY_SEED, project.key().as_ref()],
        bump = project.authority_bump,
    )]
    pub project_authority: UncheckedAccount<'info>,

    #[account(
        mut,
        address = project.cota_mint @ StructaError::WrongMint,
    )]
    pub cota_mint: Box<Account<'info, Mint>>,

    /// USDC ATA owned by the buyer (source of payment AND destination of
    /// pending yield auto-claim, if any).
    #[account(
        mut,
        token::mint = project.usdc_mint,
        token::authority = buyer,
    )]
    pub buyer_usdc_ata: Box<Account<'info, TokenAccount>>,

    /// Cota ATA — created if missing.
    #[account(
        init_if_needed,
        payer = buyer,
        associated_token::mint = cota_mint,
        associated_token::authority = buyer,
    )]
    pub buyer_cota_ata: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        address = project.vault_principal @ StructaError::WrongVault,
    )]
    pub vault_principal: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        address = project.vault_yield @ StructaError::WrongVault,
    )]
    pub vault_yield: Box<Account<'info, TokenAccount>>,

    /// Per-holder PDA. `init_if_needed` is safe because we identify by
    /// `(project, buyer)` and the PDA layout is fixed.
    #[account(
        init_if_needed,
        payer = buyer,
        space = HolderState::SIZE,
        seeds = [HOLDER_SEED, project.key().as_ref(), buyer.key().as_ref()],
        bump,
    )]
    pub holder: Box<Account<'info, HolderState>>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct DistributeYield<'info> {
    pub authority: Signer<'info>,

    #[account(
        mut,
        has_one = authority @ StructaError::Unauthorized,
        seeds = [PROJECT_SEED, project.project_seed.as_ref()],
        bump = project.bump,
    )]
    pub project: Account<'info, ProjectState>,

    #[account(
        address = project.vault_yield @ StructaError::WrongVault,
    )]
    pub vault_yield: Account<'info, TokenAccount>,
}

#[derive(Accounts)]
pub struct ClaimYield<'info> {
    pub holder_signer: Signer<'info>,

    #[account(
        mut,
        seeds = [PROJECT_SEED, project.project_seed.as_ref()],
        bump = project.bump,
    )]
    pub project: Account<'info, ProjectState>,

    /// CHECK: PDA used as signer.
    #[account(
        seeds = [PROJECT_AUTHORITY_SEED, project.key().as_ref()],
        bump = project.authority_bump,
    )]
    pub project_authority: UncheckedAccount<'info>,

    #[account(
        mut,
        seeds = [HOLDER_SEED, project.key().as_ref(), holder_signer.key().as_ref()],
        bump = holder.bump,
        constraint = holder.holder == holder_signer.key() @ StructaError::Unauthorized,
    )]
    pub holder: Account<'info, HolderState>,

    #[account(
        mut,
        token::mint = project.usdc_mint,
        token::authority = holder_signer,
    )]
    pub holder_usdc_ata: Account<'info, TokenAccount>,

    #[account(
        mut,
        address = project.vault_yield @ StructaError::WrongVault,
    )]
    pub vault_yield: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct WithdrawPrincipal<'info> {
    pub authority: Signer<'info>,

    #[account(
        has_one = authority @ StructaError::Unauthorized,
        seeds = [PROJECT_SEED, project.project_seed.as_ref()],
        bump = project.bump,
    )]
    pub project: Account<'info, ProjectState>,

    /// CHECK: PDA used as signer.
    #[account(
        seeds = [PROJECT_AUTHORITY_SEED, project.key().as_ref()],
        bump = project.authority_bump,
    )]
    pub project_authority: UncheckedAccount<'info>,

    #[account(
        mut,
        address = project.vault_principal @ StructaError::WrongVault,
    )]
    pub vault_principal: Account<'info, TokenAccount>,

    /// Destination USDC ATA (must use the project's USDC mint).
    #[account(
        mut,
        token::mint = project.usdc_mint,
    )]
    pub destination: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct UnlockBurn<'info> {
    pub authority: Signer<'info>,

    #[account(
        mut,
        has_one = authority @ StructaError::Unauthorized,
        seeds = [PROJECT_SEED, project.project_seed.as_ref()],
        bump = project.bump,
    )]
    pub project: Account<'info, ProjectState>,

    /// CHECK: PDA used as signer.
    #[account(
        seeds = [PROJECT_AUTHORITY_SEED, project.key().as_ref()],
        bump = project.authority_bump,
    )]
    pub project_authority: UncheckedAccount<'info>,

    #[account(
        mut,
        address = project.vault_principal @ StructaError::WrongVault,
    )]
    pub vault_principal: Account<'info, TokenAccount>,

    #[account(
        mut,
        address = project.vault_burn @ StructaError::WrongVault,
    )]
    pub vault_burn: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct BurnCotas<'info> {
    pub holder_signer: Signer<'info>,

    #[account(
        mut,
        seeds = [PROJECT_SEED, project.project_seed.as_ref()],
        bump = project.bump,
    )]
    pub project: Box<Account<'info, ProjectState>>,

    /// CHECK: PDA used as signer.
    #[account(
        seeds = [PROJECT_AUTHORITY_SEED, project.key().as_ref()],
        bump = project.authority_bump,
    )]
    pub project_authority: UncheckedAccount<'info>,

    #[account(
        mut,
        address = project.cota_mint @ StructaError::WrongMint,
    )]
    pub cota_mint: Box<Account<'info, Mint>>,

    #[account(
        mut,
        seeds = [HOLDER_SEED, project.key().as_ref(), holder_signer.key().as_ref()],
        bump = holder.bump,
        constraint = holder.holder == holder_signer.key() @ StructaError::Unauthorized,
    )]
    pub holder: Box<Account<'info, HolderState>>,

    #[account(
        mut,
        token::mint = cota_mint,
        token::authority = holder_signer,
    )]
    pub holder_cota_ata: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        token::mint = project.usdc_mint,
        token::authority = holder_signer,
    )]
    pub holder_usdc_ata: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        address = project.vault_yield @ StructaError::WrongVault,
    )]
    pub vault_yield: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        address = project.vault_burn @ StructaError::WrongVault,
    )]
    pub vault_burn: Box<Account<'info, TokenAccount>>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct TransferAuthority<'info> {
    pub authority: Signer<'info>,

    #[account(
        mut,
        has_one = authority @ StructaError::Unauthorized,
        seeds = [PROJECT_SEED, project.project_seed.as_ref()],
        bump = project.bump,
    )]
    pub project: Account<'info, ProjectState>,
}

// ─── State ─────────────────────────────────────────────────────────────

#[account]
pub struct ProjectState {
    /// Wallet that controls the project (single-signer admin).
    pub authority: Pubkey,
    /// Arbitrary 32-byte identifier of the project (typically derived from
    /// the development UUID in the off-chain database).
    pub project_seed: [u8; 32],
    /// SPL mint of the cota token.
    pub cota_mint: Pubkey,
    /// Reference USDC mint used by all three vaults.
    pub usdc_mint: Pubkey,
    pub vault_principal: Pubkey,
    pub vault_yield: Pubkey,
    pub vault_burn: Pubkey,
    /// Price per cota in USDC base units (e.g. 100 USDC => 100_000_000 with 6 decimals).
    pub token_price_usdc: u64,
    /// Total cotas authorised for sale.
    pub total_supply: u64,
    /// Cotas currently outstanding (mints − burns).
    pub cotas_minted: u64,
    /// Fixed-point cumulative yield per cota (×YIELD_SCALE).
    pub cumulative_yield_per_token: u128,
    /// Lifetime USDC distributed via `distribute_yield`.
    pub total_yield_distributed: u64,
    /// Lifetime USDC actually claimed by holders.
    pub total_yield_claimed: u64,
    pub token_decimals: u8,
    pub sale_open: bool,
    pub burn_unlocked: bool,
    pub bump: u8,
    pub authority_bump: u8,
    /// Reserved for future fields (multisig, fee config, …).
    pub _reserved: [u8; 64],
}

impl ProjectState {
    pub const SIZE: usize = 8  // discriminator
        + 32 // authority
        + 32 // project_seed
        + 32 // cota_mint
        + 32 // usdc_mint
        + 32 // vault_principal
        + 32 // vault_yield
        + 32 // vault_burn
        + 8  // token_price_usdc
        + 8  // total_supply
        + 8  // cotas_minted
        + 16 // cumulative_yield_per_token
        + 8  // total_yield_distributed
        + 8  // total_yield_claimed
        + 1  // token_decimals
        + 1  // sale_open
        + 1  // burn_unlocked
        + 1  // bump
        + 1  // authority_bump
        + 64; // reserved
}

#[account]
pub struct HolderState {
    pub project: Pubkey,
    pub holder: Pubkey,
    pub cota_balance: u64,
    pub last_claimed_per_token: u128,
    pub bump: u8,
    pub _reserved: [u8; 32],
}

impl HolderState {
    pub const SIZE: usize = 8 + 32 + 32 + 8 + 16 + 1 + 32;
}

// ─── Events ────────────────────────────────────────────────────────────

#[event]
pub struct ProjectInitialized {
    pub project: Pubkey,
    pub authority: Pubkey,
    pub cota_mint: Pubkey,
    pub total_supply: u64,
    pub token_price_usdc: u64,
}

#[event]
pub struct SaleStateChanged {
    pub project: Pubkey,
    pub open: bool,
}

#[event]
pub struct CotasPurchased {
    pub project: Pubkey,
    pub buyer: Pubkey,
    pub amount: u64,
    pub usdc_paid: u64,
}

#[event]
pub struct YieldDistributed {
    pub project: Pubkey,
    pub amount: u64,
    pub cumulative_yield_per_token: u128,
    pub cotas_minted: u64,
}

#[event]
pub struct YieldClaimed {
    pub project: Pubkey,
    pub holder: Pubkey,
    pub amount: u64,
}

#[event]
pub struct PrincipalWithdrawn {
    pub project: Pubkey,
    pub amount: u64,
    pub destination: Pubkey,
}

#[event]
pub struct BurnUnlocked {
    pub project: Pubkey,
    pub principal_moved: u64,
}

#[event]
pub struct BurnLocked {
    pub project: Pubkey,
}

#[event]
pub struct CotasBurned {
    pub project: Pubkey,
    pub holder: Pubkey,
    pub amount: u64,
    pub usdc_returned: u64,
}

#[event]
pub struct AuthorityTransferred {
    pub project: Pubkey,
    pub old_authority: Pubkey,
    pub new_authority: Pubkey,
}

// ─── Errors ────────────────────────────────────────────────────────────

#[error_code]
pub enum StructaError {
    #[msg("Unauthorized: caller is not the project authority.")]
    Unauthorized,
    #[msg("Wrong mint passed to instruction.")]
    WrongMint,
    #[msg("Wrong vault passed to instruction.")]
    WrongVault,
    #[msg("Sale already open.")]
    SaleAlreadyOpen,
    #[msg("Sale already closed.")]
    SaleAlreadyClosed,
    #[msg("Sale is closed for this project.")]
    SaleClosed,
    #[msg("All cotas have been sold.")]
    SoldOut,
    #[msg("Invalid token amount (must be > 0).")]
    InvalidAmount,
    #[msg("Invalid total supply.")]
    InvalidTotalSupply,
    #[msg("Invalid token price.")]
    InvalidTokenPrice,
    #[msg("Invalid token decimals.")]
    InvalidTokenDecimals,
    #[msg("Invalid authority address.")]
    InvalidAuthority,
    #[msg("Math overflow.")]
    MathOverflow,
    #[msg("Cannot distribute yield: no cotas have been minted.")]
    NoHolders,
    #[msg("Holder has no cota balance.")]
    NoCotaBalance,
    #[msg("Nothing to claim.")]
    NothingToClaim,
    #[msg("Insufficient balance in vault_principal.")]
    InsufficientPrincipalVault,
    #[msg("Insufficient balance in vault_yield (deposit USDC first).")]
    InsufficientYieldVault,
    #[msg("Insufficient balance in vault_burn.")]
    InsufficientBurnVault,
    #[msg("Burn pool is not unlocked.")]
    BurnNotUnlocked,
    #[msg("Burn already locked.")]
    BurnAlreadyLocked,
    #[msg("Holder has fewer cotas than requested.")]
    InsufficientCotas,
}
