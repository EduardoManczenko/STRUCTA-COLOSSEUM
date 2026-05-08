/**
 * Generate the deployer Keypair from a BIP39 mnemonic, using the Solana
 * default derivation path `m/44'/501'/0'/0'` (Phantom-compatible).
 *
 * Usage:
 *   ts-node scripts/keypair-from-seed.ts > deploy/deployer.json
 *
 * The mnemonic is read from the SOLANA_DEPLOYER_MNEMONIC env var, falling
 * back to the dev mnemonic stored alongside this repo for the devnet
 * deployment requested by the founders. NEVER commit the resulting JSON.
 */
import * as bip39 from "bip39";
import { derivePath } from "ed25519-hd-key";
import { Keypair } from "@solana/web3.js";

/**
 * The 12-word seed phrase shown in the dashboard screenshot:
 *   above much protect define world famous author inmate false bounce popular gate
 *
 * Used ONLY for devnet deployment. Production must source the mnemonic from
 * an env-injected secret (Vercel encrypted env, AWS SSM, …).
 */
export const DEFAULT_DEVNET_MNEMONIC =
  "above much protect define world famous author inmate false bounce popular gate";

export const DEFAULT_DERIVATION_PATH = "m/44'/501'/0'/0'";

export function keypairFromMnemonic(
  mnemonic = DEFAULT_DEVNET_MNEMONIC,
  derivationPath = DEFAULT_DERIVATION_PATH,
): Keypair {
  if (!bip39.validateMnemonic(mnemonic)) {
    throw new Error("Invalid BIP39 mnemonic");
  }
  const seed = bip39.mnemonicToSeedSync(mnemonic, "");
  const derived = derivePath(derivationPath, seed.toString("hex")).key;
  return Keypair.fromSeed(derived);
}

if (require.main === module) {
  const mnemonic = process.env.SOLANA_DEPLOYER_MNEMONIC ?? DEFAULT_DEVNET_MNEMONIC;
  const path = process.env.SOLANA_DEPLOYER_PATH ?? DEFAULT_DERIVATION_PATH;
  const kp = keypairFromMnemonic(mnemonic, path);
  process.stderr.write(
    `Derived address: ${kp.publicKey.toBase58()}\nPath: ${path}\n`,
  );
  process.stdout.write(`[${kp.secretKey.toString()}]\n`);
}
