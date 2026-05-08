import { Logger } from '@nestjs/common';
import { Keypair } from '@solana/web3.js';
import * as bip39 from 'bip39';
import { derivePath } from 'ed25519-hd-key';

const log = new Logger('SolanaConfig');

/** Default BIP39 mnemonic (12 words) shown in the founder dashboard.
 *  Devnet only — production must override via SOLANA_DEPLOYER_MNEMONIC. */
const DEFAULT_DEVNET_MNEMONIC =
  'above much protect define world famous author inmate false bounce popular gate';

const DEFAULT_DERIVATION_PATH = "m/44'/501'/0'/0'";

export interface SolanaConfig {
  rpcUrl: string;
  cluster: 'devnet' | 'testnet' | 'mainnet-beta' | 'localnet';
  programId: string;
  usdcMint: string;
  authorityKeypair: Keypair;
}

export function loadSolanaConfig(): SolanaConfig {
  const mnemonic =
    process.env.SOLANA_DEPLOYER_MNEMONIC ?? DEFAULT_DEVNET_MNEMONIC;
  const derivationPath =
    process.env.SOLANA_DEPLOYER_PATH ?? DEFAULT_DERIVATION_PATH;
  const programId =
    process.env.STRUCTA_PROGRAM_ID ??
    'Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS';
  const usdcMint =
    process.env.SOLANA_USDC_MINT ??
    process.env.USDC_MINT_ADDRESS ??
    'Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr';
  const cluster =
    (process.env.SOLANA_CLUSTER as SolanaConfig['cluster']) ?? 'devnet';
  const rpcUrl =
    process.env.SOLANA_RPC_URL ?? 'https://api.devnet.solana.com';

  if (!bip39.validateMnemonic(mnemonic)) {
    throw new Error('SOLANA_DEPLOYER_MNEMONIC is not a valid BIP39 phrase.');
  }
  const seed = bip39.mnemonicToSeedSync(mnemonic, '');
  const derived = derivePath(derivationPath, seed.toString('hex')).key;
  const authorityKeypair = Keypair.fromSeed(derived);

  log.log(
    `Authority wallet: ${authorityKeypair.publicKey.toBase58()} (cluster=${cluster})`,
  );

  return { rpcUrl, cluster, programId, usdcMint, authorityKeypair };
}
