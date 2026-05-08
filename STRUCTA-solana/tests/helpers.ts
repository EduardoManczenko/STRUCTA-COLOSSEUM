/**
 * Test helpers: USDC mint creation, ATA helpers, airdrop, etc.
 */
import * as anchor from "@coral-xyz/anchor";
import {
  createAssociatedTokenAccountIdempotent,
  createMint,
  getAssociatedTokenAddressSync,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  TOKEN_PROGRAM_ID,
  getAccount,
} from "@solana/spl-token";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
} from "@solana/web3.js";

export const USDC_DECIMALS = 6;

export async function airdrop(
  connection: Connection,
  to: PublicKey,
  sol = 5,
): Promise<void> {
  const sig = await connection.requestAirdrop(to, sol * LAMPORTS_PER_SOL);
  await connection.confirmTransaction(sig, "confirmed");
}

export async function setupUsdcMint(
  connection: Connection,
  payer: Keypair,
): Promise<PublicKey> {
  return createMint(connection, payer, payer.publicKey, null, USDC_DECIMALS);
}

export async function fundUsdc(
  connection: Connection,
  payer: Keypair,
  usdcMint: PublicKey,
  to: PublicKey,
  amountUi: number,
): Promise<PublicKey> {
  const ata = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    usdcMint,
    to,
  );
  await mintTo(
    connection,
    payer,
    usdcMint,
    ata.address,
    payer,
    BigInt(Math.round(amountUi * 10 ** USDC_DECIMALS)),
  );
  return ata.address;
}

export async function ensureAta(
  connection: Connection,
  payer: Keypair,
  mint: PublicKey,
  owner: PublicKey,
): Promise<PublicKey> {
  return createAssociatedTokenAccountIdempotent(connection, payer, mint, owner);
}

export async function tokenBalance(
  connection: Connection,
  account: PublicKey,
): Promise<bigint> {
  try {
    const acc = await getAccount(connection, account);
    return acc.amount;
  } catch {
    return 0n;
  }
}

export function uniqueProjectId(): string {
  // Random 32-char hex (mimics a UUID without dashes; fits the seed exactly).
  return [...Array(32)]
    .map(() => Math.floor(Math.random() * 16).toString(16))
    .join("");
}

export function usdcUi(amount: bigint): number {
  return Number(amount) / 10 ** USDC_DECIMALS;
}

export async function newFundedKeypair(
  connection: Connection,
  sol = 2,
): Promise<Keypair> {
  const kp = Keypair.generate();
  await airdrop(connection, kp.publicKey, sol);
  return kp;
}
