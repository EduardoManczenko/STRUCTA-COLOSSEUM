<div align="center">

# STRUCTA

### Real yield, backed by real estate. Paid in USDC.

**The on-chain credit channel that bridges global crypto liquidity to the scarcest funding in the Brazilian real estate market: construction-start capital.**

[![Solana](https://img.shields.io/badge/Built%20on-Solana-9945FF?style=flat-square&logo=solana)](https://solana.com)
[![Anchor](https://img.shields.io/badge/Anchor-0.31.1-512BD4?style=flat-square)](https://www.anchor-lang.com)
[![Next.js](https://img.shields.io/badge/Next.js-15-000000?style=flat-square&logo=next.js)](https://nextjs.org)
[![NestJS](https://img.shields.io/badge/NestJS-10-E0234E?style=flat-square&logo=nestjs)](https://nestjs.com)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](#)
[![Stage](https://img.shields.io/badge/Stage-Alpha%20·%20Q2%202026-orange?style=flat-square)](#roadmap)

**Submission for Solana Colosseum** · Devnet program id: [`2vEvLqNyMKPx7B6nz1yaKJgNBMV7DeXv17dTYR8T5SSf`](https://explorer.solana.com/address/2vEvLqNyMKPx7B6nz1yaKJgNBMV7DeXv17dTYR8T5SSf?cluster=devnet)

</div>

---

## TL;DR for investors

| | |
| --- | --- |
| **What** | A protocol that tokenizes Brazilian real-estate development credit as Solana SPL tokens, distributes monthly yield in USDC, and gives global crypto holders access to a yield class they cannot reach from any DeFi venue today. |
| **Why now** | The two largest forces in tokenization are converging: (1) USDC-native demand for *real* RWA yield above the T-Bill 5% ceiling, and (2) a Brazilian real-estate market that has paid 16–22%/yr to private credit funds for two decades and is starved for development-start capital. |
| **Spread** | **6–8% net STRUCTA spread** between the rate the protocol captures from the project and the yield distributed to holders — sustained by geographic arbitrage between USD funding cost and BRL development cost. |
| **Target APY** | **16–22% in USDC**, vs. 4.8–5.2% on tokenized T-Bills (Ondo/Maple), 6–10% on RWA credit (Centrifuge/Goldfinch), 3–7% on stablecoin lending (Aave/Compound). |
| **Who pays the yield** | The developer (incorporadora), funded by the unit pre-sales of the very building investors helped finance. Capital is *not* a loan against the developer's balance sheet — it lives in a ring-fenced SPE per project. |
| **Legal stack** | SPE per project + asset ring-fencing + construction completion insurance + ISO 9001 / PBQP-H developer screening + Chainalysis KYT on every wallet + US geo-block + 3-of-5 multisig on critical withdrawals. |
| **Stage** | Alpha — Anchor program live on devnet, full backend + frontend functional end-to-end, audited multisig, first developer pipeline being onboarded. |
| **Round** | Seed round open · 2026 Q2. |

---

## Table of contents

- [The opportunity](#the-opportunity)
- [What STRUCTA does](#what-structa-does)
- [Architecture overview](#architecture-overview)
- [The three repositories](#the-three-repositories)
  - [`STRUCTA-solana` — Anchor program](#structa-solana--anchor-program)
  - [`STRUCTA-backend` — NestJS API](#structa-backend--nestjs-api)
  - [`STRUCTA-frontend` — Next.js 15 app](#structa-frontend--nextjs-15-app)
- [Yield mechanics — cumulative-per-token](#yield-mechanics--cumulative-per-token)
- [Security & compliance — 6 layers from code to concrete](#security--compliance--6-layers-from-code-to-concrete)
- [Why Solana](#why-solana)
- [Quickstart — run the full stack locally](#quickstart--run-the-full-stack-locally)
- [Roadmap](#roadmap)
- [Why STRUCTA wins](#why-structa-wins)
- [License](#license)

---

## The opportunity

> Two structurally separate markets. One missing pipe.

**On one side**, the Brazilian real-estate development industry is one of the largest yield-paying private-credit asset classes in the Americas — it has paid **16–22% per year, for two decades**, to *Letras de Crédito Imobiliário* (LCI) funds, *Certificados de Recebíveis Imobiliários* (CRI), and bank development lines. The supply of capital for the **most expensive part of the cycle — construction start, before pre-sales kick in —** is permanently rationed.

**On the other side**, global crypto holds **>$280B in stablecoins** and the only "real-yield" options today top out around **5%** (T-Bill wrappers). RWA Credit protocols clear 6–10%, but the underlying assets are mostly invoice factoring and US private credit — categories already saturated by traditional capital.

**STRUCTA is the missing pipe.** We let a USDC holder anywhere in the world buy a fraction of a tokenized Brazilian development project, receive monthly USDC yield as units sell, and burn the token at the end to recover principal — with the legal robustness of a regulated SPE and the transparency of an on-chain audit trail.

| Yield class | APY | Underlying |
| --- | --- | --- |
| **STRUCTA (target)** | **16–22%** | Brazilian real-estate receivables · SPE-segregated |
| Tokenized T-Bills | 4.8–5.2% | US treasuries (Ondo, Maple, Backed) |
| Stablecoin staking | 3–7% | DeFi lending (Aave, Compound, Spark) |
| RWA Credit | 6–10% | Invoice factoring, US private credit (Centrifuge, Goldfinch) |
| BTC liquid staking | 2–4% | Babylon, Lombard |

*Source: market data, 2026 Q1.*

---

## What STRUCTA does

For every approved real-estate development, STRUCTA mints a **per-project SPL token** (the *cota*) and provisions **three on-chain USDC vaults**:

```
                  ┌────────────────────────────────────────────────┐
   admin ────────►│ initialize_project · open_sale · close_sale    │
                  │ distribute_yield   · withdraw_principal        │
                  │ unlock_burn · lock_burn · transfer_authority   │
                  └─────────────────────┬──────────────────────────┘
                                        │
                                ┌───────▼────────┐
                                │  ProjectState  │ ◄─ PDA["project", projectSeed]
                                │  HolderState[] │ ◄─ PDA["holder", project, wallet]
                                └───────┬────────┘
                                        │
                                ┌───────▼────────┐
                                │  Cota Mint     │ ◄─ PDA["cota_mint", project]
                                │  Vault P (USDC)│ ◄─ PDA["vault_principal", project]   ← raised capital
                                │  Vault Y (USDC)│ ◄─ PDA["vault_yield",     project]   ← monthly yield drops
                                │  Vault B (USDC)│ ◄─ PDA["vault_burn",      project]   ← redemption pool
                                └────────────────┘
                                        ▲
   investor ─────► buy_cotas · claim_yield · burn_cotas
```

A complete cycle:

1. **Registration.** A developer (incorporadora) submits a project. STRUCTA mints the cota SPL and provisions the three vaults via `initialize_project`. PDAs make the addresses deterministic — the frontend can compute every vault address before deploy.
2. **Listing.** The project goes live with hard cap, soft cap, deadline, and a unit-share price (default $100 USDC).
3. **Fundraising.** Investors `buy_cotas`. USDC flows into `vault_principal`, the cota is minted and **automatically frozen** in the buyer's ATA (cotas are non-transferable in v1 — see [yield mechanics](#yield-mechanics--cumulative-per-token)). On hitting the soft cap → admin off-ramp to fiat → developer breaks ground. On failure → automatic refund.
4. **Execution.** During construction, the developer deposits the monthly yield in fiat; STRUCTA on-ramps and routes it to `vault_yield`, then calls `distribute_yield` to update the cumulative-per-token bookkeeping.
5. **Distribution.** Holders call `claim_yield` whenever they want and pull pro-rata USDC from `vault_yield`. No unbounded loops, no per-holder gas overhead.
6. **Burn for redemption.** As the developer sells units, principal is replenished into `vault_burn`. Admin calls `unlock_burn`; holders call `burn_cotas` to redeem the original $100 USDC of principal per cota.

---

## Architecture overview

A monorepo with three production-grade repositories — each independently deployable, individually documented, and joined by a single deterministic PDA scheme.

```
STRUCTA-COLOSSEUM/
├── STRUCTA-solana/      Anchor program · 1 program, N projects via PDAs · TS SDK + tests
├── STRUCTA-backend/     NestJS serverless API on Vercel · Supabase Postgres/Auth/Storage
└── STRUCTA-frontend/    Next.js 15 · public LP + investor + incorporator + admin dashboards
```

| Layer | Stack | LOC | Role |
| --- | --- | --- | --- |
| **On-chain** | Rust · Anchor 0.31.1 · SPL Token | ~1.2k Rust + ~1.2k TS (SDK + tests) | Source of truth: cotas, vaults, yield bookkeeping, burn-for-redemption |
| **Backend** | NestJS 10 · TS · Supabase · Solana web3.js · Anchor client | ~4.7k TS | Admin UI logic, multisig orchestration, off-ramp routing, KYT, file uploads, IDL bridge |
| **Frontend** | Next.js 15 (App Router) · React 19 · Tailwind · Solana Wallet Adapter | ~16.8k TS/TSX | Public landing, investor dashboard, incorporator portal, admin/multisig console |

---

## The three repositories

### `STRUCTA-solana` — Anchor program

> One program. N projects via PDAs. No factory, no per-project program deploys.

**Highlights**

- A single Anchor program (`structa`) deployed once. Every project becomes a `(programId, projectSeed)`-derived PDA — cheaper, deterministically addressable, and audit-friendly (one Rust crate, one IDL, one set of invariants).
- Three USDC vaults per project (**principal · yield · burn**) owned by the Project Authority PDA. Capital never mixes between projects.
- **Non-transferable cotas (v1).** Right after `mint_to`, the program freezes the holder's ATA using the mint's freeze authority (the Project Authority PDA). `burn_cotas` thaws → burns → re-freezes. This eliminates the "owner of record drift" that would otherwise break yield accounting after an SPL transfer. Designed to be relaxed once the secondary-market venue ships in V2.
- **Cumulative-per-token yield model** — see [yield mechanics](#yield-mechanics--cumulative-per-token). Scales to unbounded holders without a per-holder distribution loop.
- **Authority is hot-swappable.** `transfer_authority` lets the founding wallet hand off control to a multisig signer once governance matures — without re-deploying or migrating state.
- Full `tests/structa.spec.ts` suite (~726 LOC) exercises every instruction including authorisation, sale-state, supply-limit, arithmetic edge cases, multi-holder yield distribution, and the full burn/refund cycle on a local validator.

**Layout**

```
programs/structa/      Rust program (single crate, ~1.2k LOC)
sdk/src/               TypeScript SDK (PDA derivation + Anchor client wrapper)
tests/                 Mocha + Chai integration tests against a local validator
scripts/               deploy.ts · initialize-project.ts · keypair-from-seed.ts
deploy/                runtime keypairs (git-ignored)
```

**Instruction set**

| Instruction | Caller | Purpose |
| --- | --- | --- |
| `initialize_project` | admin | Bootstrap the project: PDA, mint, three vaults |
| `open_sale` / `close_sale` | admin | Toggle the cota sale window |
| `buy_cotas` | investor | USDC → vault_principal · mint frozen cota · settle pending yield in same tx |
| `distribute_yield` | admin | Pure bookkeeping: bump `cumulative_yield_per_token` |
| `claim_yield` | investor | Pull pending pro-rata USDC from vault_yield |
| `withdraw_principal` | admin | Off-ramp from vault_principal to a destination ATA |
| `unlock_burn` | admin | Sweep vault_principal → vault_burn, mark refund-enabled |
| `lock_burn` | admin | Re-lock the burn pool |
| `burn_cotas` | investor | Burn cotas → redeem original USDC at `token_price_usdc` |
| `transfer_authority` | admin | Hand off to a multisig signer |

**Devnet status:** deployed at `2vEvLqNyMKPx7B6nz1yaKJgNBMV7DeXv17dTYR8T5SSf`.

---

### `STRUCTA-backend` — NestJS API

> Serverless NestJS on Vercel. Stateless, single-function deploy, JWT-based wallet sessions, fully typed against Supabase.

**Highlights**

- **NestJS 10** with `@nestjs/platform-express` running as a single Vercel serverless function (cold start cached). 1024 MB / 30 s execution budget.
- **Wallet auth** via Solana ed25519 signature verification (TweetNaCl) — the user requests a nonce, signs it in their wallet, and exchanges the signed message for a 7-day JWT.
- **Email/password auth** for admins and approved incorporators (Supabase Auth + role claims).
- **Off-chain Multisig 3/5** orchestrates every privileged action. Each proposal is a row in `multisig_proposals`; signatures are recorded via on-chain Ed25519 signature verification against `multisig_owner_wallets`. As soon as 3 signatures land, the backend executes the corresponding on-chain instruction and updates Postgres atomically.
- **Chainalysis KYT** screening before any cota purchase confirms — blocked wallets cannot complete `buy_cotas`.
- **Signed Supabase Storage URLs** for image and document uploads, so files never traverse the serverless function (Vercel payload limits + Supabase RLS in one move).
- **Solana service** picks up the IDL from any of three locations (env var, sibling dir, or local copy) and exposes a typed Anchor client for every program instruction. Mock-contracts module exists for E2E demos when the real validator isn't available.

**Module map**

```
src/modules/
├── auth/                email/password (admin/incorporator) + wallet (investor)
├── public/              public LP endpoints (stats, developments, partners)
├── incorporators/       developer signup, profile, document management
├── developments/        CRUD for the incorporator side
├── investors/           /investors/me + portfolio
├── purchases/           cota purchase flow (Chainalysis-gated)
├── compliance/          Chainalysis screening
├── admin/               admin console + multisig 3/5 orchestrator
├── files/               signed upload/download URLs (Supabase Storage)
├── solana/              typed Anchor client + IDL bridge
├── mock-contracts/      drop-in stub for demos
└── faucet/              devnet USDC faucet helper
```

**Selected endpoints**

```
POST   /api/auth/wallet/nonce            → request nonce to sign
POST   /api/auth/wallet/verify           → verify signature, return JWT
POST   /api/purchases/quote              → price + USDC needed
POST   /api/purchases/confirm            → KYT-gated cota purchase
POST   /api/admin/proposals              → create multisig proposal
POST   /api/admin/proposals/:id/sign     → record an Ed25519 signature
POST   /api/files/upload-url             → Supabase signed PUT URL
GET    /api/public/developments?status=  → marketplace feed
```

---

### `STRUCTA-frontend` — Next.js 15 app

> One Next.js 15 codebase serving four audiences: the public landing, the investor dashboard, the incorporator portal, and the admin/multisig console.

**Highlights**

- **Next.js 15 App Router** + **React 19**, with Tailwind + custom design tokens. ~16.8k LOC of TS/TSX. Static and serverless-friendly — deploys 1-click on Vercel.
- **Solana Wallet Adapter** (Phantom · Solflare · WalletConnect-ready) with a single-click connect → sign nonce → JWT login flow.
- **Public landing** (`/`) is a fully animated, conversion-oriented investor pitch: hero, trust strip, yield comparator, interactive yield simulator (16–22% APY × $100–$250k), 5-step "how it works" timeline, live deals carousel, partner developer grid.
- **Investor area** (`/dashboard`) — portfolio, holdings per project, yield history, marketplace, devnet utilities.
- **Incorporator area** (`/incorporadora`) — project submission with multi-step image/document upload, sale tracking, profile management, document vault.
- **Admin console** (`/admin`) — KPIs, multisig proposal queue, approvals, signers list, history of every multisig execution. Operates on top of the backend Multisig service: creates proposals, signs with the connected wallet, watches execution.
- **Buy-cota modal** orchestrates the full investor flow: amount → KYT screen → review → on-chain confirmation, with proper error states for blocked wallets.

**Route map**

| Route | Audience | Purpose |
| --- | --- | --- |
| `/` | Public | Landing page · CTAs to deals, signup, login |
| `/empreendimentos` · `/empreendimentos/[id]` | Public | Marketplace + project detail (gallery, tokenomics, docs, addresses) |
| `/cadastro/incorporadora` | Public | Multi-step developer signup |
| `/login` | Public | Email/password (admin / approved incorporator) |
| `/dashboard` · `/dashboard/cotas` · `/dashboard/yields` · `/dashboard/explore` | Investor (wallet) | Portfolio, holdings, yield history, marketplace |
| `/incorporadora/*` | Incorporator | Submit projects, track sales, manage profile/documents |
| `/admin` · `/admin/aprovacoes` · `/admin/multisig` · `/admin/empreendimentos/[id]` | Admin | Approvals, multisig 3/5 console, sale controls, yield distribution, burn controls |

---

## Yield mechanics — cumulative-per-token

The hardest problem in any RWA-yield protocol is distributing pro-rata to an arbitrarily large set of holders **without** an unbounded on-chain loop. STRUCTA uses the canonical *cumulative yield per token* pattern, with a 1e12 fixed-point scale:

- `distribute_yield(amount)` updates one global counter:
  ```
  cumulative_yield_per_token += amount * 1e12 / cotas_minted
  ```
- Each holder stores a snapshot (`last_claimed_per_token`) inside their `HolderState` PDA. `claim_yield` pays:
  ```
  pending = (cumulative_yield_per_token − last_claimed_per_token) × cota_balance / 1e12
  ```
  …then bumps the snapshot.
- **`buy_cotas` auto-settles** any pending yield *before* changing the holder's balance, so the snapshot is always consistent.
- **A backend crank can pull on every holder's behalf** without a code change to the program — useful for inactive wallets or for delivering UX where users see balances "just appear."

This eliminates the gas-cliff that plagues per-holder distribution patterns and lets STRUCTA scale to thousands of holders per project without ever touching the program.

---

## Security & compliance — 6 layers from code to concrete

Tokenization doesn't replace rigor — it amplifies what the real-estate market already knows how to do. STRUCTA combines the legal infrastructure of Brazilian real estate with the on-chain transparency of Web3.

| Layer | What it does |
| --- | --- |
| **SPE + asset ring-fencing** | Each project lives in a special-purpose vehicle. Investor capital is legally segregated from the developer's balance sheet. Insolvency of the developer cannot reach the project's funds. |
| **Construction completion insurance** | Coverage contracted to guarantee project delivery even in adverse scenarios. |
| **Audited smart contracts** | Anchor program with a comprehensive Mocha test suite. Pre-mainnet third-party audit scheduled for V1 (Q4 2026). 3-of-5 multisig on every critical withdrawal. |
| **Chainalysis KYT** | Every wallet is screened before a deposit can be confirmed. Sanctioned / high-risk wallets are blocked at the API. |
| **US geo-restriction** | Geographic block for restricted jurisdictions activated on the frontend before wallet connect. |
| **Progressive regulatory layers** | Lean offshore MVP today, scaling to a full Brazilian institutional structure as traction consolidates. |
| **Developer screening** | Only developers holding a valid **ISO 9001** or **PBQP-H** certification (the Brazilian construction quality benchmark) are admitted to listing. |
| **Non-transferable cotas (v1)** | Cotas freeze on mint to prevent yield-accounting drift. Secondary-market liquidity arrives in V2 with a permissioned transfer hook that preserves accounting. |

---

## Why Solana

| Requirement | Why Solana wins |
| --- | --- |
| Sub-cent tx cost for monthly yield drops to thousands of holders | Without it, the per-tx cost would eat the spread |
| Sub-second finality for the buy-cota UX | Investor signs once, confirms once, sees the cota in seconds |
| First-class native USDC liquidity | The yield asset *is* USDC — no bridge risk, no wrapper |
| Mature SPL Token + Associated Token Account standards | Maps cleanly to "1 mint per project, 1 ATA per holder" |
| Anchor 0.31's PDA + IDL story | Lets us run **one** program for **every** project, with deterministic addresses precomputed off-chain |

---

## Quickstart — run the full stack locally

> Detailed instructions live in each repo's README. This is the 30-second tour.

### 1) Solana program (Anchor)

```bash
cd STRUCTA-solana
npm install
anchor build
anchor test                       # spins up local validator + runs every spec
# Deploy to devnet:
solana config set -u devnet -k deploy/deployer.json
solana airdrop 2
anchor deploy --provider.cluster devnet --provider.wallet deploy/deployer.json
```

### 2) Backend (NestJS)

```bash
cd STRUCTA-backend
cp .env.example .env              # fill SUPABASE_SERVICE_ROLE_KEY + JWT_SECRET (32+ random bytes)
npm install
npm run dev                       # → http://localhost:4000
```

### 3) Frontend (Next.js)

```bash
cd STRUCTA-frontend
cp .env.example .env.local        # point NEXT_PUBLIC_API_URL at the backend
npm install
npm run dev                       # → http://localhost:3000
```

### 4) End-to-end demo path

1. Open `/cadastro/incorporadora` and submit a developer.
2. Login as admin, approve the developer at `/admin/incorporadoras`.
3. Submit a development as the developer at `/incorporadora/novo-empreendimento`.
4. Approve it as admin at `/admin/empreendimentos/[id]` — this triggers `initialize_project` on devnet.
5. Open the sale (multisig action), then connect a fresh wallet at `/empreendimentos/[id]` and `buy_cotas`.
6. As admin, distribute yield. The investor sees the new claimable balance under `/dashboard/yields`.

---

## Roadmap

| Stage | Quarter | Milestones |
| --- | --- | --- |
| **Alpha** *(now)* | 2026 Q2 | Pilot + first raise · devnet program · backend + frontend live · first developer pipeline |
| **Beta** | 2026 Q3 | Operational validation · external smart-contract audit · institutional-grade KYC/AML wiring |
| **V1** | 2026 Q4 | Mainnet deploy · first public listing · multisig fully on-chain |
| **V2** | 2027 Q1 | Secondary market for cotas (permissioned transfer hook + AMM) |
| **V3** | 2027 Q2 | LATAM expansion: Mexico, Colombia, Chile developers onboard |

---

## Why STRUCTA wins

1. **Real spread, not synthetic.** The 6–8% net protocol margin comes from a real geographic arbitrage that has existed for two decades — not from token emissions, not from leverage, not from liquidity mining.
2. **Yield asset = USDC.** Investors are paid in the unit of account they already hold. No bridging risk, no wrapper risk, no FX conversion at claim time.
3. **One Solana program serves N projects.** PDA-based architecture means deploys are paid once. Every new development is a `(programId, seed)` derivation away, with deterministic addresses the frontend can compute before the project is even initialized on-chain.
4. **Bookkeeping that actually scales.** Cumulative-per-token yield + frozen cotas eliminate the two failure modes that kill most RWA-yield protocols at scale: the unbounded distribution loop, and the owner-of-record drift after SPL transfers.
5. **Legal and on-chain rigor co-designed from day one.** SPE per project, asset ring-fencing, completion insurance, ISO 9001 / PBQP-H developer gate, Chainalysis KYT, US geo-block, 3/5 multisig — every one of these is wired into the smart-contract authorisation flow, not bolted on as a UI promise.
6. **An end-to-end product, not a slide deck.** Three production-grade repositories — Anchor program with tests, typed serverless backend, polished four-audience frontend — already integrated and demoable on devnet.

---

## License

MIT for the Solana program (see `STRUCTA-solana/`). Backend and frontend repositories are private until V1 mainnet launch.

---

<div align="center">

**Credit is structure. Structure is foundation.**

*Let's build the funding channel the Brazilian real-estate market has been waiting for — and the real yield DeFi finally deserves.*

</div>
