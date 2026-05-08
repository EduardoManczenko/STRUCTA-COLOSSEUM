# STRUCTA Backend API

NestJS serverless API for the STRUCTA platform — designed to deploy on Vercel as a single serverless function.

> All Solana smart contract calls are **mocked** (see `src/modules/mock-contracts/`). They return realistic-looking but fake transaction signatures and addresses, ready to be replaced by real `@solana/web3.js` / Anchor calls when the contracts are ready.

## Stack

- **NestJS 10** with `@nestjs/platform-express` (Vercel handler)
- **Supabase** (Postgres + Auth + Storage) via `@supabase/supabase-js`
- **JWT** for wallet sessions (`jsonwebtoken`)
- **TweetNaCl** for Solana ed25519 signature verification
- **class-validator / class-transformer** for DTO validation

## Project structure

```
api/
  index.ts                  # Vercel serverless handler (cached Nest instance)
src/
  main.ts                   # Local dev entry
  app.module.ts
  health.controller.ts
  common/
    supabase/               # SupabaseService (admin & anon clients) + DB types
    decorators/             # @CurrentUser, @Roles
    guards/                 # AuthGuard, OptionalAuthGuard, RolesGuard
    filters/                # HttpExceptionFilter
  modules/
    auth/                   # email/password (admin/incorporator) + wallet (investor)
    public/                 # public LP endpoints (no auth)
    incorporators/          # signup form for incorporators
    developments/           # CRUD for incorporator-side
    investors/              # /investors/me + portfolio
    purchases/              # cota purchase flow (Chainalysis-gated)
    compliance/             # Chainalysis screening (mocked)
    admin/                  # /admin/*  (multisig 3/5)
    files/                  # signed upload/download URLs
    mock-contracts/         # placeholder Solana program calls
```

## Setup

```bash
npm install
cp .env.example .env
# fill SUPABASE_SERVICE_ROLE_KEY and JWT_SECRET (32+ random bytes)
npm run dev
# -> http://localhost:4000
```

You **must** set `SUPABASE_SERVICE_ROLE_KEY` from your Supabase dashboard
(Settings → API → `service_role` key). The MCP / publishable key cannot create
users or write across RLS.

## Deployment to Vercel

```bash
vercel deploy
```

Configure these environment variables on Vercel:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET`
- `ALLOWED_ORIGINS` (e.g. `https://structa.vercel.app`)
- `CHAINALYSIS_API_KEY` (when going live)

`vercel.json` already routes everything to `api/index.ts` and configures the
function for 1024 MB / 30 s.

## Endpoints

### Public (no auth)
- `GET  /api/public/stats`
- `GET  /api/public/developments?search=&status=`
- `GET  /api/public/developments/:idOrSlug`
- `GET  /api/public/incorporators`

### Auth
- `POST /api/auth/login`                    *(admin/incorporator email login)*
- `POST /api/auth/incorporator/account`     *(create incorporator user)*
- `POST /api/auth/wallet/nonce`             *(request nonce to sign)*
- `POST /api/auth/wallet/verify`            *(verify signature, get JWT)*
- `GET  /api/auth/me`                       *(authenticated)*

### Incorporators
- `POST /api/incorporators/submissions`     *(public form submission)*
- `GET  /api/incorporators/me`              *(incorporator role)*
- `GET  /api/incorporators/:id`             *(public for approved ones)*

### Developments (incorporator)
- `POST /api/developments`                  *(create proposal)*
- `GET  /api/developments/mine`
- `GET  /api/developments/:id`

### Investors
- `GET  /api/investors/me`
- `GET  /api/investors/me/portfolio`

### Purchases
- `POST /api/purchases/quote`
- `POST /api/purchases/confirm`             *(requires recent compliance check)*

### Compliance
- `POST /api/compliance/screen`             *(Chainalysis mock)*

### Admin (role: admin)
- `GET  /api/admin/incorporators?status=pendente`
- `GET  /api/admin/incorporators/:id`
- `POST /api/admin/incorporators/:id/review`
- `GET  /api/admin/developments?status=`
- `GET  /api/admin/developments/:id`
- `GET  /api/admin/signers`
- `GET  /api/admin/proposals?status=open`
- `GET  /api/admin/proposals/:id`
- `POST /api/admin/proposals`
- `POST /api/admin/proposals/:id/sign`

### Files (signed URLs)
- `POST /api/files/upload-url`
- `POST /api/files/download-url`

## Multisig 3/5

Five admin accounts are seeded in Supabase (`admin@structa.io`, `signer1@structa.io` … `signer4@structa.io`, all with password `Structa@Admin2026!`). Every privileged on-chain action (open sale, distribute yield, withdraw principal, …) goes through `multisig_proposals`:

1. `POST /api/admin/proposals { developmentId, action, payload }` creates a proposal and auto-signs as the proposer.
2. Other signers `POST /api/admin/proposals/:id/sign`.
3. As soon as **3 signatures** are collected, `MultisigService.tryExecute()` runs the corresponding mocked contract call **and** updates the database.

## Mocked contracts

`MockContractsService` exposes:
- `createDevelopmentSmartContracts` (project + mint + 3 vaults)
- `openSale` / `closeSale`
- `mintCotas`
- `withdrawPrincipal`
- `distributeYield`
- `unlockBurn` / `lockBurn`
- `refundFund`

Each returns a fake-but-realistic 88-char base58 tx signature and Solana addresses. Replace the bodies with real Anchor / web3.js calls when ready — no other layer needs to change.
