/**
 * STRUCTA on-chain client for the Next.js frontend.
 *
 * Wraps `@coral-xyz/anchor` so that the buy/claim/burn instructions can be
 * built browser-side and signed by the investor's connected wallet via the
 * Solana wallet adapter.
 */
import {
  AnchorProvider,
  BN,
  Idl,
  Program,
  Wallet,
} from "@coral-xyz/anchor";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import {
  Connection,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { config } from "./config";

const PROJECT_SEED = Buffer.from("project");
const PROJECT_AUTHORITY_SEED = Buffer.from("authority");
const VAULT_PRINCIPAL_SEED = Buffer.from("vault_principal");
const VAULT_YIELD_SEED = Buffer.from("vault_yield");
const VAULT_BURN_SEED = Buffer.from("vault_burn");
const COTA_MINT_SEED = Buffer.from("cota_mint");
const HOLDER_SEED = Buffer.from("holder");

export function projectSeedFromString(id: string, nonce = 0): Buffer {
  const ascii = Buffer.from(id.replace(/-/g, "").toLowerCase(), "utf8");
  let seed: Buffer;
  if (ascii.length === 32) {
    seed = Buffer.from(ascii);
  } else if (ascii.length > 32) {
    seed = Buffer.from(ascii.subarray(0, 32));
  } else {
    seed = Buffer.alloc(32, 0);
    ascii.copy(seed);
  }
  if (nonce > 0) {
    seed[31] = seed[31] ^ (nonce & 0xff);
    seed[30] = seed[30] ^ ((nonce >> 8) & 0xff);
  }
  return seed;
}

export interface ProjectPdas {
  project: PublicKey;
  projectAuthority: PublicKey;
  cotaMint: PublicKey;
  vaultPrincipal: PublicKey;
  vaultYield: PublicKey;
  vaultBurn: PublicKey;
}

export function deriveProjectPdas(
  programId: PublicKey,
  seed: Buffer,
): ProjectPdas {
  const [project] = PublicKey.findProgramAddressSync(
    [PROJECT_SEED, seed],
    programId,
  );
  const [projectAuthority] = PublicKey.findProgramAddressSync(
    [PROJECT_AUTHORITY_SEED, project.toBuffer()],
    programId,
  );
  const [cotaMint] = PublicKey.findProgramAddressSync(
    [COTA_MINT_SEED, project.toBuffer()],
    programId,
  );
  const [vaultPrincipal] = PublicKey.findProgramAddressSync(
    [VAULT_PRINCIPAL_SEED, project.toBuffer()],
    programId,
  );
  const [vaultYield] = PublicKey.findProgramAddressSync(
    [VAULT_YIELD_SEED, project.toBuffer()],
    programId,
  );
  const [vaultBurn] = PublicKey.findProgramAddressSync(
    [VAULT_BURN_SEED, project.toBuffer()],
    programId,
  );
  return {
    project,
    projectAuthority,
    cotaMint,
    vaultPrincipal,
    vaultYield,
    vaultBurn,
  };
}

export function deriveHolderPda(
  programId: PublicKey,
  project: PublicKey,
  holder: PublicKey,
): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [HOLDER_SEED, project.toBuffer(), holder.toBuffer()],
    programId,
  );
  return pda;
}

interface SignerWalletLike {
  publicKey: PublicKey;
  signTransaction: <T extends Transaction>(tx: T) => Promise<T>;
  signAllTransactions?: <T extends Transaction>(txs: T[]) => Promise<T[]>;
}

/**
 * Build (and optionally send) a `buy_cotas` transaction using the connected
 * wallet adapter. The IDL is fetched from the deployed program at runtime
 * via Anchor's `Program.fetchIdl` to avoid bundling the JSON into the
 * Next.js client bundle.
 */
export async function buildBuyCotasTx(opts: {
  connection: Connection;
  wallet: SignerWalletLike;
  programId: PublicKey;
  developmentId: string;
  usdcMint: PublicKey;
  amount: number | bigint;
  /** Optional seed nonce — pass when the backend has re-initialised the project. */
  seedNonce?: number;
}): Promise<Transaction> {
  const seed = projectSeedFromString(opts.developmentId, opts.seedNonce ?? 0);
  const pdas = deriveProjectPdas(opts.programId, seed);
  const buyerUsdcAta = getAssociatedTokenAddressSync(
    opts.usdcMint,
    opts.wallet.publicKey,
  );
  const buyerCotaAta = getAssociatedTokenAddressSync(
    pdas.cotaMint,
    opts.wallet.publicKey,
  );
  const holderPda = deriveHolderPda(
    opts.programId,
    pdas.project,
    opts.wallet.publicKey,
  );

  // Compose a manual instruction so we don't need the IDL on the client.
  // Discriminator + args: amount (u64 LE).
  // The discriminator is sha256("global:buy_cotas")[:8].
  const ix = await buildBuyCotasInstruction({
    programId: opts.programId,
    buyer: opts.wallet.publicKey,
    pdas,
    buyerUsdcAta,
    buyerCotaAta,
    holderPda,
    amount: opts.amount,
  });

  const { blockhash } = await opts.connection.getLatestBlockhash();
  const tx = new Transaction({
    feePayer: opts.wallet.publicKey,
    recentBlockhash: blockhash,
  }).add(ix);

  return tx;
}

/**
 * Build the raw `buy_cotas` instruction without needing the IDL JSON. We
 * encode the Anchor discriminator + the `amount` argument manually.
 */
async function buildBuyCotasInstruction(opts: {
  programId: PublicKey;
  buyer: PublicKey;
  pdas: ProjectPdas;
  buyerUsdcAta: PublicKey;
  buyerCotaAta: PublicKey;
  holderPda: PublicKey;
  amount: number | bigint;
}): Promise<TransactionInstruction> {
  // Anchor instruction discriminator = sha256("global:buy_cotas").slice(0,8)
  const discriminator = await sha256("global:buy_cotas");
  const data = Buffer.alloc(8 + 8);
  Buffer.from(discriminator.slice(0, 8)).copy(data, 0);
  const amt = BigInt(opts.amount.toString());
  data.writeBigUInt64LE(amt, 8);

  const keys = [
    { pubkey: opts.buyer, isSigner: true, isWritable: true },
    { pubkey: opts.pdas.project, isSigner: false, isWritable: true },
    { pubkey: opts.pdas.projectAuthority, isSigner: false, isWritable: false },
    { pubkey: opts.pdas.cotaMint, isSigner: false, isWritable: true },
    { pubkey: opts.buyerUsdcAta, isSigner: false, isWritable: true },
    { pubkey: opts.buyerCotaAta, isSigner: false, isWritable: true },
    { pubkey: opts.pdas.vaultPrincipal, isSigner: false, isWritable: true },
    { pubkey: opts.pdas.vaultYield, isSigner: false, isWritable: true },
    { pubkey: opts.holderPda, isSigner: false, isWritable: true },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
  ];

  return new TransactionInstruction({
    programId: opts.programId,
    keys,
    data,
  });
}

async function sha256(input: string): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return new Uint8Array(digest);
}

/** Read the program id and USDC mint from the runtime config. */
export function getStructaProgramId(): PublicKey {
  const id =
    process.env.NEXT_PUBLIC_STRUCTA_PROGRAM_ID ??
    "Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS";
  return new PublicKey(id);
}

export function getDevnetUsdcMint(): PublicKey {
  return new PublicKey(
    process.env.NEXT_PUBLIC_USDC_MINT ??
      "Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr",
  );
}

/**
 * Decode a base64-encoded `Transaction` produced by the backend faucet.
 * Anchor/web3 partial-sign serialization is preserved so the wallet adapter
 * just has to add the user's signature before submitting.
 */
export function deserializeBackendTx(base64: string): Transaction {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  return Transaction.from(bytes);
}
