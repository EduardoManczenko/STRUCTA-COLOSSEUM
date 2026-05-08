import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountIdempotentInstruction,
  createMintToInstruction,
  getAssociatedTokenAddressSync,
  getMint,
} from '@solana/spl-token';
import {
  ComputeBudgetProgram,
  PublicKey,
  Transaction,
} from '@solana/web3.js';

import { SolanaService } from '../solana/solana.service';

/**
 * In-memory rate limiter: one mint request per wallet every 30s.
 *
 * The faucet only exists to help testers fund their devnet wallet — we don't
 * need full Redis-grade limits, but we do want to soft-throttle to avoid
 * users hammering the endpoint and the authority signer running out of SOL.
 */
const MIN_INTERVAL_MS = 30_000;
const lastRequestByWallet = new Map<string, number>();

/** Maximum amount the faucet is willing to mint in a single request. */
const MAX_HUMAN_AMOUNT = 1_000_000;

@Injectable()
export class FaucetService {
  private readonly log = new Logger('Faucet');

  constructor(private readonly solana: SolanaService) {}

  /**
   * Build a partially-signed transaction that mints fake USDC to the given
   * wallet. The user is the fee payer (so they pay the gas) and signs as the
   * ATA owner; the backend signs as the mint authority. The frontend just
   * has to ask the wallet to add its signature and submit the tx.
   */
  async buildMintUsdcTx(opts: {
    walletAddress: string;
    amountHuman?: string;
  }): Promise<{
    transactionBase64: string;
    amountHuman: number;
    amountBaseUnits: string;
    usdcMint: string;
    recipient: string;
    recipientAta: string;
  }> {
    const cluster = this.solana.config.cluster;
    if (cluster !== 'devnet' && cluster !== 'localnet' && cluster !== 'testnet') {
      throw new BadRequestException(
        'USDC faucet is only available on devnet/testnet/localnet.',
      );
    }

    let recipient: PublicKey;
    try {
      recipient = new PublicKey(opts.walletAddress);
    } catch {
      throw new BadRequestException('Invalid Solana wallet address.');
    }

    const amountHuman = parseAmount(opts.amountHuman, 100_000);
    if (amountHuman <= 0 || amountHuman > MAX_HUMAN_AMOUNT) {
      throw new BadRequestException(
        `Amount must be between 1 and ${MAX_HUMAN_AMOUNT} USDC.`,
      );
    }

    // ── Soft per-wallet rate limit ─────────────────────────────────────
    const now = Date.now();
    const last = lastRequestByWallet.get(opts.walletAddress) ?? 0;
    if (now - last < MIN_INTERVAL_MS) {
      const wait = Math.ceil((MIN_INTERVAL_MS - (now - last)) / 1000);
      throw new BadRequestException(
        `Please wait ${wait}s before requesting a new USDC mint for this wallet.`,
      );
    }

    const connection = this.solana.connection;
    const mintPk = this.solana.usdcMint;
    const mintAccount = await getMint(connection, mintPk);

    if (
      !mintAccount.mintAuthority ||
      !mintAccount.mintAuthority.equals(this.solana.authority.publicKey)
    ) {
      throw new BadRequestException(
        `Backend authority is not the mint authority of ${mintPk.toBase58()}. ` +
          'Reconfigure SOLANA_DEPLOYER_MNEMONIC / SOLANA_USDC_MINT.',
      );
    }

    const decimals = mintAccount.decimals;
    const amountBaseUnits = BigInt(
      Math.round(amountHuman * 10 ** decimals),
    );

    const recipientAta = getAssociatedTokenAddressSync(mintPk, recipient);

    const ixs = [
      // Slight priority bump so the tx confirms quickly under devnet load.
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 5_000 }),
      // Idempotent: skipped if the ATA already exists. Fee payer (user)
      // covers the rent on first creation.
      createAssociatedTokenAccountIdempotentInstruction(
        recipient, // payer
        recipientAta, // ata
        recipient, // owner
        mintPk, // mint
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID,
      ),
      createMintToInstruction(
        mintPk,
        recipientAta,
        this.solana.authority.publicKey, // mint authority (signer)
        amountBaseUnits,
        [],
        TOKEN_PROGRAM_ID,
      ),
    ];

    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash('confirmed');

    const tx = new Transaction({
      feePayer: recipient,
      blockhash,
      lastValidBlockHeight,
    });
    tx.add(...ixs);

    // Backend partial-signs as the mint authority. The user signs later as
    // fee payer + ATA owner via their wallet adapter.
    tx.partialSign(this.solana.authority);

    const serialized = tx.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    });

    lastRequestByWallet.set(opts.walletAddress, now);

    this.log.log(
      `Built USDC mint tx: ${amountHuman} USDC → ${opts.walletAddress}`,
    );

    return {
      transactionBase64: serialized.toString('base64'),
      amountHuman,
      amountBaseUnits: amountBaseUnits.toString(),
      usdcMint: mintPk.toBase58(),
      recipient: recipient.toBase58(),
      recipientAta: recipientAta.toBase58(),
    };
  }

  /** Public metadata used by the dashboard onboarding page. */
  info() {
    const cluster = this.solana.config.cluster;
    return {
      cluster,
      usdcMint: this.solana.usdcMint.toBase58(),
      mintAuthority: this.solana.authority.publicKey.toBase58(),
      defaultAmount: 100_000,
      maxAmount: MAX_HUMAN_AMOUNT,
      minIntervalSeconds: MIN_INTERVAL_MS / 1000,
    };
  }
}

function parseAmount(raw: string | undefined, fallback: number): number {
  if (raw === undefined || raw === null || raw === '') return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return n;
}
