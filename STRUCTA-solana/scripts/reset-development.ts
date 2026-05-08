/**
 * One-shot recovery script: re-initialise an existing development on-chain
 * after a misconfiguration (e.g. wrong USDC mint) and update the database
 * row with the new addresses.
 *
 * What it does:
 *   1. Reads the dev row from Supabase by `--id <uuid>`.
 *   2. Bumps `project_seed_nonce` so the on-chain PDAs change deterministically
 *      (no collision with the previous incarnation).
 *   3. Calls `initialize_project` with the project params and the configured
 *      USDC mint (read from --usdc-mint or `USDC_MINT_ADDRESS` env).
 *   4. Calls `open_sale` to leave the project in the "venda_aberta" state.
 *   5. Updates the dev row with the new on-chain addresses + sale_open=true.
 *
 * Usage:
 *   ts-node scripts/reset-development.ts \
 *     --id <dev-uuid> \
 *     --usdc-mint <pubkey> \
 *     [--rpc-url https://api.devnet.solana.com]
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import * as dotenv from "dotenv";

// Load env vars from the backend's .env file by default.
dotenv.config({
  path:
    process.env.DOTENV_PATH ?? resolve(__dirname, "..", "..", "STRUCTA-backend", ".env"),
});
import { BN, Wallet } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import { createClient } from "@supabase/supabase-js";

import { StructaClient } from "../sdk/src";
import { projectSeedFromString, deriveProjectPdas } from "../sdk/src/pdas";
import { keypairFromMnemonic } from "./keypair-from-seed";

interface CliArgs {
  id: string;
  usdcMint?: string;
  rpcUrl?: string;
  programId?: string;
  idlPath?: string;
}

function parseArgs(argv: string[]): CliArgs {
  const out: Partial<CliArgs> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--id") out.id = argv[++i];
    else if (a === "--usdc-mint") out.usdcMint = argv[++i];
    else if (a === "--rpc-url") out.rpcUrl = argv[++i];
    else if (a === "--program-id") out.programId = argv[++i];
    else if (a === "--idl-path") out.idlPath = argv[++i];
  }
  if (!out.id) throw new Error("Missing --id <dev-uuid>");
  return out as CliArgs;
}

function envOrThrow(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var ${name}`);
  return v;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const rpcUrl = args.rpcUrl ?? "https://api.devnet.solana.com";
  const programIdStr =
    args.programId ?? "2vEvLqNyMKPx7B6nz1yaKJgNBMV7DeXv17dTYR8T5SSf";
  const usdcMintStr =
    args.usdcMint ??
    process.env.USDC_MINT_ADDRESS ??
    process.env.SOLANA_USDC_MINT;
  if (!usdcMintStr) throw new Error("Missing --usdc-mint or USDC_MINT_ADDRESS env");

  const idlPath =
    args.idlPath ?? resolve(__dirname, "..", "target", "idl", "structa.json");
  const idl = JSON.parse(readFileSync(idlPath, "utf8"));

  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_SERVICE_KEY;
  if (!serviceKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY env");
  const supa = createClient(envOrThrow("SUPABASE_URL"), serviceKey, {
    auth: { persistSession: false },
  });

  const dev = await supa
    .from("developments")
    .select(
      "id, nome, status, sale_open, token_symbol, token_name, token_supply, token_price_usdc, project_seed_nonce",
    )
    .eq("id", args.id)
    .maybeSingle();
  if (dev.error) throw dev.error;
  if (!dev.data) throw new Error(`Development ${args.id} not found`);

  const oldNonce = Number(dev.data.project_seed_nonce ?? 0);
  const newNonce = oldNonce + 1;

  console.log(`▶ Dev: ${dev.data.nome} (${args.id})`);
  console.log(`▶ Old seed nonce: ${oldNonce} → new nonce: ${newNonce}`);
  console.log(`▶ USDC mint: ${usdcMintStr}`);

  const kp = keypairFromMnemonic();
  const connection = new Connection(rpcUrl, "confirmed");
  const client = new StructaClient({
    programId: new PublicKey(programIdStr),
    connection,
    wallet: new Wallet(kp),
    idl,
  });

  /* ── 1. initialize_project with new seed (nonce-tweaked) ───────────── */
  const seed = projectSeedFromString(args.id, newNonce);
  const pdas = deriveProjectPdas(client.programId, seed);
  console.log(`▶ Project PDA (new): ${pdas.project.toBase58()}`);
  console.log(`▶ Cota mint  (new): ${pdas.cotaMint.toBase58()}`);
  console.log(`▶ Vault principal:   ${pdas.vaultPrincipal.toBase58()}`);

  const totalSupply = Number(dev.data.token_supply ?? 0);
  const priceUsdc = Number(dev.data.token_price_usdc ?? 0);
  const priceBaseUnits = Math.round(priceUsdc * 1e6);

  // Manually build initialize_project (same as initialize-project.ts but with explicit pdas)
  const ix = await (client.program.methods as any)
    .initializeProject(
      Array.from(seed),
      0,
      new BN(totalSupply),
      new BN(priceBaseUnits),
    )
    .accounts({
      authority: kp.publicKey,
      project: pdas.project,
      projectAuthority: pdas.projectAuthority,
      usdcMint: new PublicKey(usdcMintStr),
      cotaMint: pdas.cotaMint,
      vaultPrincipal: pdas.vaultPrincipal,
      vaultYield: pdas.vaultYield,
      vaultBurn: pdas.vaultBurn,
      tokenProgram: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
      systemProgram: new PublicKey("11111111111111111111111111111111"),
      rent: new PublicKey("SysvarRent111111111111111111111111111111111"),
    })
    .instruction();

  const initSig = await client.send([ix]);
  console.log(`✓ initialize_project: ${initSig}`);

  /* ── 2. open_sale ──────────────────────────────────────────────────── */
  const openIx = await (client.program.methods as any)
    .openSale()
    .accounts({ authority: kp.publicKey, project: pdas.project })
    .instruction();
  const openSig = await client.send([openIx]);
  console.log(`✓ open_sale: ${openSig}`);

  /* ── 3. Persist the new state in the DB ────────────────────────────── */
  const update = await supa
    .from("developments")
    .update({
      project_seed_nonce: newNonce,
      cota_mint_address: pdas.cotaMint.toBase58(),
      vault_principal_address: pdas.vaultPrincipal.toBase58(),
      vault_yield_address: pdas.vaultYield.toBase58(),
      burn_pool_address: pdas.vaultBurn.toBase58(),
      project_account_address: pdas.project.toBase58(),
      project_authority_pda: pdas.projectAuthority.toBase58(),
      sale_open: true,
      status: "venda_aberta",
      amount_raised_usdc: 0,
    } as any)
    .eq("id", args.id);
  if (update.error) throw update.error;

  console.log(`✓ DB updated. Sale is OPEN with the correct USDC mint.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
