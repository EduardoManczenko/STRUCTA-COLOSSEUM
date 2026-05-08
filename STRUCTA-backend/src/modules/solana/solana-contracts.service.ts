import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { BN } from '@coral-xyz/anchor';
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from '@solana/spl-token';
import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import { ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';

import { SolanaService, projectSeedFromString } from './solana.service';

/**
 * Real Solana contracts service. Mirrors the legacy MockContractsService API
 * shape so call sites in admin/multisig/purchases keep working without code
 * changes.
 */
@Injectable()
export class SolanaContractsService {
  private readonly log = new Logger('SolanaContracts');

  constructor(private readonly solana: SolanaService) {}

  // ─────────────────────────────────────────────────────────────────────
  /** Equivalent to `initialize_project` in the on-chain program. */
  async createDevelopmentSmartContracts(opts: {
    developmentId: string;
    tokenSymbol: string;
    tokenName: string;
    tokenSupply: number;
    tokenPriceUsdc: number; // human-readable USDC, e.g. 100 → 100_000_000 base units
    tokenDecimals?: number;
    seedNonce?: number;
  }): Promise<{
    txSignature: string;
    cota_mint_address: string;
    vault_principal_address: string;
    vault_yield_address: string;
    burn_pool_address: string;
    project_account_address: string;
    project_authority_pda: string;
    program_id: string;
  }> {
    const nonce = opts.seedNonce ?? 0;
    const seed = projectSeedFromString(opts.developmentId, nonce);
    const accounts = this.solana.buildInitializeProjectAccounts(
      opts.developmentId,
      nonce,
    );
    const tokenDecimals = opts.tokenDecimals ?? 0;
    const totalSupply = new BN(Math.floor(opts.tokenSupply));
    const priceBaseUnits = new BN(
      Math.round(opts.tokenPriceUsdc * 10 ** 6),
    );

    if (!this.solana.hasProgram) {
      throw new BadRequestException(
        'Solana program is not loaded on the backend (IDL missing). ' +
          'Run `anchor build` in STRUCTA-solana and set STRUCTA_IDL_PATH.',
      );
    }

    const ix = await (this.solana.program.methods as any)
      .initializeProject(
        Array.from(seed),
        tokenDecimals,
        totalSupply,
        priceBaseUnits,
      )
      .accounts({
        authority: accounts.authority,
        project: accounts.project,
        projectAuthority: accounts.projectAuthority,
        usdcMint: accounts.usdcMint,
        cotaMint: accounts.cotaMint,
        vaultPrincipal: accounts.vaultPrincipal,
        vaultYield: accounts.vaultYield,
        vaultBurn: accounts.vaultBurn,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .instruction();

    const txSignature = await this.solana.sendIxs([ix]);

    this.log.log(
      `initialize_project ok dev=${opts.developmentId} mint=${accounts.cotaMint.toBase58()} tx=${txSignature}`,
    );

    return {
      txSignature,
      cota_mint_address: accounts.cotaMint.toBase58(),
      vault_principal_address: accounts.vaultPrincipal.toBase58(),
      vault_yield_address: accounts.vaultYield.toBase58(),
      burn_pool_address: accounts.vaultBurn.toBase58(),
      project_account_address: accounts.project.toBase58(),
      project_authority_pda: accounts.projectAuthority.toBase58(),
      program_id: this.solana.programId.toBase58(),
    };
  }

  async openSale(developmentId: string, nonce = 0) {
    const { project } = this.solana.pdas(developmentId, nonce);
    const ix = await (this.solana.program.methods as any)
      .openSale()
      .accounts({ authority: this.solana.authority.publicKey, project })
      .instruction();
    return { txSignature: await this.solana.sendIxs([ix]) };
  }

  async closeSale(developmentId: string, nonce = 0) {
    const { project } = this.solana.pdas(developmentId, nonce);
    const ix = await (this.solana.program.methods as any)
      .closeSale()
      .accounts({ authority: this.solana.authority.publicKey, project })
      .instruction();
    return { txSignature: await this.solana.sendIxs([ix]) };
  }

  /**
   * Cota minting itself happens inside `buy_cotas` (signed by the investor).
   * The backend just verifies the on-chain transaction. This stub remains for
   * call-site backwards compatibility — when invoked by an admin manually it
   * returns an error.
   */
  async mintCotas(
    _developmentId: string,
    _walletAddress: string,
    _amount: number,
  ) {
    throw new BadRequestException(
      'Cotas are minted on-chain through buy_cotas signed by the investor. ' +
        'Use POST /purchases/confirm with the resulting tx_signature instead.',
    );
  }

  async withdrawPrincipal(
    developmentId: string,
    amountUsdc: number,
    destinationAddress: string,
    nonce = 0,
  ) {
    const pdas = this.solana.pdas(developmentId, nonce);
    const destOwner = new PublicKey(destinationAddress);
    const destination = getAssociatedTokenAddressSync(
      this.solana.usdcMint,
      destOwner,
    );

    const ix = await (this.solana.program.methods as any)
      .withdrawPrincipal(new BN(Math.round(amountUsdc * 10 ** 6)))
      .accounts({
        authority: this.solana.authority.publicKey,
        project: pdas.project,
        projectAuthority: pdas.projectAuthority,
        vaultPrincipal: pdas.vaultPrincipal,
        destination,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .instruction();
    return { txSignature: await this.solana.sendIxs([ix]) };
  }

  /**
   * Distribute yield. The instruction expects USDC to already be sitting in
   * vault_yield (the admin transfers USDC to the deposit address shown in
   * the dashboard before calling this). We pass the on-chain amount but the
   * program reads the vault balance to check sufficiency.
   */
  async distributeYield(developmentId: string, amountUsdc: number, nonce = 0) {
    const pdas = this.solana.pdas(developmentId, nonce);
    const ix = await (this.solana.program.methods as any)
      .distributeYield(new BN(Math.round(amountUsdc * 10 ** 6)))
      .accounts({
        authority: this.solana.authority.publicKey,
        project: pdas.project,
        vaultYield: pdas.vaultYield,
      })
      .instruction();
    return { txSignature: await this.solana.sendIxs([ix]) };
  }

  /** Used to refund/burn — also called when the project ends. */
  async unlockBurn(developmentId: string, nonce = 0) {
    const pdas = this.solana.pdas(developmentId, nonce);
    const ix = await (this.solana.program.methods as any)
      .unlockBurn()
      .accounts({
        authority: this.solana.authority.publicKey,
        project: pdas.project,
        projectAuthority: pdas.projectAuthority,
        vaultPrincipal: pdas.vaultPrincipal,
        vaultBurn: pdas.vaultBurn,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .instruction();
    return { txSignature: await this.solana.sendIxs([ix]) };
  }

  async lockBurn(developmentId: string, nonce = 0) {
    const { project } = this.solana.pdas(developmentId, nonce);
    const ix = await (this.solana.program.methods as any)
      .lockBurn()
      .accounts({ authority: this.solana.authority.publicKey, project })
      .instruction();
    return { txSignature: await this.solana.sendIxs([ix]) };
  }

  /** "Refund fund" is an alias for unlock_burn in this protocol. */
  async refundFund(developmentId: string, nonce = 0) {
    return this.unlockBurn(developmentId, nonce);
  }

  // ─────────────────────────────────────────────────────────────────────
  // Read-only helpers used by controllers/services to expose deposit
  // addresses and on-chain balances in the dashboard.
  // ─────────────────────────────────────────────────────────────────────
  getDepositAddresses(developmentId: string, nonce = 0) {
    const pdas = this.solana.pdas(developmentId, nonce);
    return {
      vault_principal_address: pdas.vaultPrincipal.toBase58(),
      vault_yield_address: pdas.vaultYield.toBase58(),
      burn_pool_address: pdas.vaultBurn.toBase58(),
      cota_mint_address: pdas.cotaMint.toBase58(),
      project_account_address: pdas.project.toBase58(),
      project_authority_pda: pdas.projectAuthority.toBase58(),
      program_id: this.solana.programId.toBase58(),
      usdc_mint: this.solana.usdcMint.toBase58(),
    };
  }

  async getOnChainBalances(developmentId: string, nonce = 0) {
    const pdas = this.solana.pdas(developmentId, nonce);
    const [principal, yieldBal, burn] = await Promise.all([
      this.solana.tokenBalance(pdas.vaultPrincipal),
      this.solana.tokenBalance(pdas.vaultYield),
      this.solana.tokenBalance(pdas.vaultBurn),
    ]);
    const project = await this.solana.getProject(developmentId, nonce);
    return {
      principal_usdc_base_units: principal.toString(),
      yield_usdc_base_units: yieldBal.toString(),
      burn_usdc_base_units: burn.toString(),
      cotas_minted: project ? project.cotasMinted.toString() : '0',
      cumulative_yield_per_token: project
        ? project.cumulativeYieldPerToken.toString()
        : '0',
      sale_open: project ? project.saleOpen : false,
      burn_unlocked: project ? project.burnUnlocked : false,
    };
  }
}
