# STRUCTA — Solana Anchor Program

Tokenized real-estate protocol for STRUCTA. One Anchor program (`structa`) that
serves every development end-to-end:

* mints a per-development SPL token (the **cota**) controlled by the program PDA,
* owns three USDC vaults (**principal**, **yield**, **burn**),
* exposes admin actions (open/close sale, withdraw principal, distribute yield,
  unlock burn, lock burn, transfer authority),
* exposes investor actions (buy cotas, claim yield, burn cotas for refund).

The wallet that initialises a project is the sole on-chain authority. A future
upgrade can swap that for a multisig signer with `transfer_authority`.

## Architecture

```
                ┌────────────────────────────────────────────────┐
   admin ──────►│ initialize_project / open_sale / close_sale   │
                │ distribute_yield / withdraw_principal          │
                │ unlock_burn / lock_burn / transfer_authority   │
                └─────────────────────┬──────────────────────────┘
                                      │
                              ┌───────▼────────┐
                              │  ProjectState   │ ◄── PDA["project", seed]
                              │  HolderState[…] │ ◄── PDA["holder", project, wallet]
                              └───────┬────────┘
                                      │
                                 ┌────▼────┐
                                 │  Mint    │  cota SPL token (PDA["cota_mint", project])
                                 │ Vault P  │  USDC principal (PDA["vault_principal", project])
                                 │ Vault Y  │  USDC yield     (PDA["vault_yield",    project])
                                 │ Vault B  │  USDC burn pool (PDA["vault_burn",     project])
                                 └─────────┘
                                      │
   investor ──► buy_cotas / claim_yield / burn_cotas
```

### Why a single program with PDAs (not a factory)

* Cheaper deploys: pay program rent once, every project is a PDA.
* Deterministic addresses: `(programId, projectSeed)` → mint/vaults are
  precomputed off-chain, simplifying frontend/backend wiring.
* Simpler audits: one Rust crate, one IDL, one set of invariants.

### Yield model — *cumulative yield per token*

`distribute_yield(amount)` increments
`cumulative_yield_per_token += amount * 1e12 / cotas_minted`. Holders later call
`claim_yield`, which pays out
`(cumulative - last_claimed) * cota_balance / 1e12` and bumps their snapshot.

The pattern scales to any number of holders without unbounded loops, and lets
the backend or a crank claim on every holder's behalf without code changes.

### Cota transferability

Cotas are non-transferable for the v1 protocol. The program freezes the
investor's ATA right after `mint_to`, and `burn_cotas` thaws → burns →
re-freezes if any balance remains. This avoids the "owner of record" drift that
would otherwise break yield accounting after an SPL transfer.

## Repo layout

```
programs/structa/      Rust program
sdk/src/               TypeScript SDK (PDAs + Anchor client wrapper)
tests/                 Mocha + Chai integration tests
scripts/               deploy.ts, initialize-project.ts, keypair-from-seed.ts
deploy/                runtime keypairs (git-ignored)
```

## Deployer wallet

The deployer keypair is derived deterministically from a 12-word BIP39 mnemonic
using the Solana default derivation path `m/44'/501'/0'/0'`. The default
mnemonic shipped with this repo (the founder dashboard one) resolves to:

> Public address: `4BK7fX3FHoTozGgxTST5Ki4KGUb6GpN3vM29vgx1p1FW`

Override in production with the env var `SOLANA_DEPLOYER_MNEMONIC`.

## Setup

### Toolchain

* **Solana CLI**  3.1.x (Agave) — `solana-cli`
* **Anchor**       0.31.1
* **Rust**         1.76+ (we tested with 1.93)
* **Node**         20+

### Linux / macOS (recommended)

```bash
# 1) Solana CLI
sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"

# 2) AVM + Anchor 0.31.1
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install 0.31.1 && avm use 0.31.1

# 3) Build & test
npm install
anchor build
anchor test
```

### Windows (Git Bash / PowerShell)

> **Important**: `cargo build-sbf` must create symlinks under
> `~/.cache/solana/`. Windows blocks this for non-administrators unless
> Developer Mode is on. Either:
>
> 1. **Enable Developer Mode**: *Settings → System → For developers → Developer Mode = ON*, then restart the terminal.
> 2. **Or** run the build/deploy commands from an Administrator-elevated terminal.
> 3. **Or** use **WSL** (`wsl --install`) and follow the Linux instructions there.

```bash
# Inside Git Bash AFTER enabling Developer Mode:
export PATH="$HOME/.solana-cli/solana-release/bin:$PATH"
solana --version  # should print solana-cli 3.1.x
avm install 0.31.1 && avm use 0.31.1
anchor --version  # should print anchor-cli 0.31.1

npm install
anchor build
anchor test
```

The deployer keypair is automatically generated at `deploy/deployer.json`
(from the configured BIP39 mnemonic) the first time you run `npm run deploy:devnet`.

## Devnet deploy

```bash
# 1) Generate the deployer keypair if not present
npx ts-node scripts/keypair-from-seed.ts > deploy/deployer.json

# 2) Configure Solana CLI to use this keypair on devnet
solana config set -u devnet -k deploy/deployer.json
solana airdrop 2  # devnet faucet, may rate-limit

# 3) Build & deploy
anchor build
anchor deploy --provider.cluster devnet --provider.wallet deploy/deployer.json
```

`anchor deploy` prints the deployed program id. Copy it into:

* `Anchor.toml`           `[programs.devnet]`
* `programs/structa/src/lib.rs`  → `declare_id!`  (then `anchor build` again, then `anchor upgrade` if you redeploy)
* `STRUCTA-backend/.env` → `STRUCTA_PROGRAM_ID=...`
* `STRUCTA-frontend/.env`→ `NEXT_PUBLIC_STRUCTA_PROGRAM_ID=...`
* `protocol_config` table in Supabase → `program_id` column

## Connect the IDL to the backend

After `anchor build` produces `target/idl/structa.json`, the backend picks it
up automatically if any of these paths exist:

* `STRUCTA-backend/target/idl/structa.json` (copy)
* `../STRUCTA-solana/target/idl/structa.json` (sibling directory)
* `STRUCTA_IDL_PATH=/abs/path/to/structa.json` env var

Easiest pattern when backend + solana repos are siblings:

```bash
ln -s ../../STRUCTA-solana/target/idl/structa.json STRUCTA-backend/structa.idl.json
# then in STRUCTA-backend/.env:
STRUCTA_IDL_PATH=./structa.idl.json
```

## Ops cheatsheet

| Action                       | Who      | Instruction          |
|------------------------------|----------|----------------------|
| Approve project              | admin    | `initialize_project` |
| Open sale                    | admin    | `open_sale`          |
| Close sale                   | admin    | `close_sale`         |
| Buy cotas                    | investor | `buy_cotas`          |
| Top up yield vault           | admin    | (plain SPL transfer) |
| Distribute yield             | admin    | `distribute_yield`   |
| Claim yield                  | investor | `claim_yield`        |
| Withdraw principal           | admin    | `withdraw_principal` |
| Unlock burn / refund         | admin    | `unlock_burn`        |
| Lock burn                    | admin    | `lock_burn`          |
| Burn cotas (refund)          | investor | `burn_cotas`         |
| Hand off to multisig         | admin    | `transfer_authority` |

## Testing

The `tests/structa.spec.ts` suite exercises every instruction including
authorisation, sale-state, supply-limit and arithmetic edge cases plus a full
multi-holder yield distribution and burn/refund cycle. It runs as part of
`anchor test`, which spins up a local validator, seeds a USDC mint, deploys
the program and runs all specs.
