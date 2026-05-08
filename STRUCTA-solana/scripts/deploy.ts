/**
 * Deploys the structa Anchor program to devnet using the deployer keypair
 * derived from the configured BIP39 mnemonic.
 *
 *   1. Generates `deploy/deployer.json` if missing.
 *   2. Airdrops 2 SOL on devnet (best-effort).
 *   3. Builds the program (`anchor build`).
 *   4. Deploys via `anchor deploy --provider.cluster devnet`.
 *
 * Usage:  ts-node scripts/deploy.ts
 */
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";

import { keypairFromMnemonic } from "./keypair-from-seed";

const ROOT = resolve(__dirname, "..");
const DEPLOYER_PATH = resolve(ROOT, "deploy", "deployer.json");
const RPC = process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com";

async function main() {
  const kp = keypairFromMnemonic();
  console.log(`▶ Deployer wallet: ${kp.publicKey.toBase58()}`);

  if (!existsSync(DEPLOYER_PATH)) {
    mkdirSync(resolve(ROOT, "deploy"), { recursive: true });
    writeFileSync(DEPLOYER_PATH, `[${kp.secretKey.toString()}]`);
    console.log(`▶ Wrote deployer keypair to ${DEPLOYER_PATH}`);
  }

  const connection = new Connection(RPC, "confirmed");
  const balance = await connection.getBalance(kp.publicKey);
  console.log(`▶ Balance: ${balance / LAMPORTS_PER_SOL} SOL`);

  if (balance < 2 * LAMPORTS_PER_SOL) {
    console.log("▶ Requesting devnet airdrop (2 SOL)…");
    try {
      const sig = await connection.requestAirdrop(kp.publicKey, 2 * LAMPORTS_PER_SOL);
      await connection.confirmTransaction(sig, "confirmed");
      console.log(`  Airdrop ok: ${sig}`);
    } catch (err) {
      console.warn(
        "  Airdrop failed (devnet faucets are rate-limited). Fund the wallet manually before retrying.",
        err,
      );
    }
  }

  console.log("▶ Building program (anchor build)…");
  execSync("anchor build", { stdio: "inherit", cwd: ROOT });

  console.log("▶ Deploying to devnet…");
  execSync(
    `anchor deploy --provider.cluster ${RPC} --provider.wallet ${DEPLOYER_PATH}`,
    { stdio: "inherit", cwd: ROOT },
  );

  console.log("✓ Deployment complete. Program id is in target/deploy/structa-keypair.json.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
