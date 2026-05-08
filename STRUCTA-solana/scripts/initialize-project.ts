/**
 * Initialise on-chain state for a STRUCTA development.
 *
 *   1. Reads `--development-id` and project params from CLI args.
 *   2. Derives the deployer keypair from the BIP39 mnemonic env var.
 *   3. Calls `initialize_project` on the deployed Anchor program.
 *   4. Prints the resulting cota mint, vault and project PDAs.
 *
 * Used as a fallback for manual ops; the real flow lives in the backend
 * service (STRUCTA-backend/src/modules/solana/solana-contracts.service.ts).
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Wallet } from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";

import { StructaClient } from "../sdk/src";
import { keypairFromMnemonic } from "./keypair-from-seed";

interface CliArgs {
  developmentId: string;
  totalSupply: number;
  tokenPriceUsdc: number;
  tokenDecimals?: number;
  usdcMint: string;
  programId: string;
  rpcUrl?: string;
  idlPath?: string;
}

function parseArgs(argv: string[]): CliArgs {
  const out: Partial<CliArgs> = { tokenDecimals: 0 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--development-id") out.developmentId = argv[++i];
    else if (a === "--total-supply") out.totalSupply = Number(argv[++i]);
    else if (a === "--token-price-usdc") out.tokenPriceUsdc = Number(argv[++i]);
    else if (a === "--token-decimals") out.tokenDecimals = Number(argv[++i]);
    else if (a === "--usdc-mint") out.usdcMint = argv[++i];
    else if (a === "--program-id") out.programId = argv[++i];
    else if (a === "--rpc-url") out.rpcUrl = argv[++i];
    else if (a === "--idl-path") out.idlPath = argv[++i];
  }
  if (!out.developmentId || !out.totalSupply || !out.tokenPriceUsdc || !out.usdcMint || !out.programId) {
    throw new Error(
      "Missing required arg. Usage: ts-node scripts/initialize-project.ts " +
        "--development-id <uuid> --total-supply <n> --token-price-usdc <lamports> " +
        "--usdc-mint <pubkey> --program-id <pubkey>",
    );
  }
  return out as CliArgs;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const rpcUrl = args.rpcUrl ?? "https://api.devnet.solana.com";
  const idlPath = args.idlPath ?? resolve(__dirname, "..", "target", "idl", "structa.json");
  const idl = JSON.parse(readFileSync(idlPath, "utf8"));

  const kp: Keypair = keypairFromMnemonic();
  const connection = new Connection(rpcUrl, "confirmed");
  const client = new StructaClient({
    programId: new PublicKey(args.programId),
    connection,
    wallet: new Wallet(kp),
    idl,
  });

  console.log(`▶ Authority      : ${kp.publicKey.toBase58()}`);
  console.log(`▶ Program        : ${args.programId}`);
  console.log(`▶ Development id : ${args.developmentId}`);
  console.log(`▶ Total supply   : ${args.totalSupply}`);
  console.log(`▶ Token price    : ${args.tokenPriceUsdc} (USDC base units)`);

  const { ix, pdas } = await client.initializeProjectIx({
    authority: kp.publicKey,
    projectId: args.developmentId,
    usdcMint: new PublicKey(args.usdcMint),
    tokenDecimals: args.tokenDecimals ?? 0,
    totalSupply: args.totalSupply,
    tokenPriceUsdc: args.tokenPriceUsdc,
  });

  const txSig = await client.send([ix]);
  console.log(`✓ tx: ${txSig}`);
  console.log(JSON.stringify({
    txSignature: txSig,
    project: pdas.project.toBase58(),
    cota_mint_address: pdas.cotaMint.toBase58(),
    vault_principal_address: pdas.vaultPrincipal.toBase58(),
    vault_yield_address: pdas.vaultYield.toBase58(),
    burn_pool_address: pdas.vaultBurn.toBase58(),
  }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
