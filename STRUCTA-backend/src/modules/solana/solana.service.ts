import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as anchor from '@coral-xyz/anchor';
import {
  AnchorProvider,
  BN,
  Idl,
  Program,
  Wallet,
} from '@coral-xyz/anchor';
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  getAccount,
} from '@solana/spl-token';
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';

import { loadSolanaConfig, SolanaConfig } from './solana.config';

/** Scaling factor matches the program's `YIELD_SCALE` constant (1e12). */
export const YIELD_SCALE = new BN('1000000000000');

const PROJECT_SEED = Buffer.from('project');
const PROJECT_AUTHORITY_SEED = Buffer.from('authority');
const VAULT_PRINCIPAL_SEED = Buffer.from('vault_principal');
const VAULT_YIELD_SEED = Buffer.from('vault_yield');
const VAULT_BURN_SEED = Buffer.from('vault_burn');
const COTA_MINT_SEED = Buffer.from('cota_mint');
const HOLDER_SEED = Buffer.from('holder');

/**
 * UUID (or any string) → 32-byte project seed for PDA derivation.
 *
 * `nonce` (optional) is used to get a different seed for the same UUID, useful
 * when a project needs to be re-initialised on-chain after a misconfiguration
 * (e.g. wrong USDC mint). When `nonce > 0`, the last byte of the seed is
 * XOR-mixed with the nonce so the new PDA is guaranteed to be different.
 */
export function projectSeedFromString(id: string, nonce = 0): Buffer {
  const ascii = Buffer.from(id.replace(/-/g, '').toLowerCase(), 'utf8');
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

/**
 * Holds the singleton Solana resources used by the backend:
 *   - RPC connection
 *   - Anchor program (loaded from the IDL JSON)
 *   - Authority keypair derived from the configured BIP39 mnemonic
 *   - Helpers to derive PDAs and fetch on-chain accounts
 */
@Injectable()
export class SolanaService implements OnModuleInit {
  private readonly log = new Logger('Solana');
  private _connection!: Connection;
  private _provider!: AnchorProvider;
  private _program!: Program<Idl>;
  private _config!: SolanaConfig;
  private _idl: Idl | null = null;

  onModuleInit() {
    this._config = loadSolanaConfig();
    this._connection = new Connection(this._config.rpcUrl, 'confirmed');

    const wallet = new Wallet(this._config.authorityKeypair);
    this._provider = new AnchorProvider(this._connection, wallet, {
      commitment: 'confirmed',
      preflightCommitment: 'confirmed',
    });
    anchor.setProvider(this._provider);

    const idl = this.loadIdl();
    this._idl = idl;
    if (idl) {
      this._program = new Program<Idl>(idl, this._provider);
      this.log.log(
        `Program loaded: ${new PublicKey(this._config.programId).toBase58()}`,
      );
    } else {
      this.log.warn(
        'No IDL JSON found. Set STRUCTA_IDL_PATH or place target/idl/structa.json in repo root. Backend will degrade to read-only mode for Solana actions.',
      );
    }
  }

  // ── Lazy resources ─────────────────────────────────────────────────────
  get config() {
    return this._config;
  }
  get connection() {
    return this._connection;
  }
  get authority(): Keypair {
    return this._config.authorityKeypair;
  }
  get programId(): PublicKey {
    return new PublicKey(this._config.programId);
  }
  get usdcMint(): PublicKey {
    return new PublicKey(this._config.usdcMint);
  }
  get program(): Program<Idl> {
    if (!this._program) {
      throw new Error(
        'Anchor program not initialised — IDL is missing on the backend.',
      );
    }
    return this._program;
  }
  get hasProgram(): boolean {
    return !!this._program;
  }

  // ── PDA derivation ─────────────────────────────────────────────────────
  pdas(developmentId: string, nonce = 0): ProjectPdas {
    const seed = projectSeedFromString(developmentId, nonce);
    const programId = this.programId;
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

  holderPda(developmentId: string, holder: PublicKey, nonce = 0): PublicKey {
    const { project } = this.pdas(developmentId, nonce);
    const [pda] = PublicKey.findProgramAddressSync(
      [HOLDER_SEED, project.toBuffer(), holder.toBuffer()],
      this.programId,
    );
    return pda;
  }

  ataFor(mint: PublicKey, owner: PublicKey): PublicKey {
    return getAssociatedTokenAddressSync(mint, owner);
  }

  // ── Account fetchers ───────────────────────────────────────────────────
  async getProject(developmentId: string, nonce = 0) {
    if (!this._program) return null;
    const { project } = this.pdas(developmentId, nonce);
    return (this._program.account as any).projectState.fetchNullable(project);
  }

  async getHolder(developmentId: string, holder: PublicKey, nonce = 0) {
    if (!this._program) return null;
    const pda = this.holderPda(developmentId, holder, nonce);
    return (this._program.account as any).holderState.fetchNullable(pda);
  }

  async tokenBalance(account: PublicKey): Promise<bigint> {
    try {
      const acc = await getAccount(this._connection, account);
      return acc.amount;
    } catch {
      return 0n;
    }
  }

  // ── High level helpers used by SolanaContractsService ──────────────────
  async sendIxs(
    instructions: TransactionInstruction[],
    extraSigners: Keypair[] = [],
  ): Promise<string> {
    const tx = new Transaction().add(...instructions);
    return this._provider.sendAndConfirm(tx, extraSigners);
  }

  /** Helper: build the args for `initialize_project`. */
  buildInitializeProjectAccounts(developmentId: string, nonce = 0) {
    const pdas = this.pdas(developmentId, nonce);
    return {
      authority: this.authority.publicKey,
      project: pdas.project,
      projectAuthority: pdas.projectAuthority,
      usdcMint: this.usdcMint,
      cotaMint: pdas.cotaMint,
      vaultPrincipal: pdas.vaultPrincipal,
      vaultYield: pdas.vaultYield,
      vaultBurn: pdas.vaultBurn,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      pdas,
    };
  }

  // ── Internal: load IDL JSON ────────────────────────────────────────────
  private loadIdl(): Idl | null {
    /* Bundled copy — guaranteed to be present on Vercel/serverless because
     * it lives next to this source file and is built into dist/. */
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
      const bundled = require('./structa-idl.json') as Idl;
      this.log.log('IDL loaded from bundled structa-idl.json');
      return bundled;
    } catch {
      /* fall through to the legacy filesystem-based lookup */
    }

    const overridePath = process.env.STRUCTA_IDL_PATH;
    const candidatePaths = [
      overridePath,
      'target/idl/structa.json',
      'idl/structa.json',
      '../STRUCTA-solana/target/idl/structa.json',
      '../../STRUCTA-solana/target/idl/structa.json',
    ].filter(Boolean) as string[];

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const fs = require('node:fs') as typeof import('node:fs');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const path = require('node:path') as typeof import('node:path');

    for (const p of candidatePaths) {
      const abs = path.isAbsolute(p) ? p : path.resolve(process.cwd(), p);
      if (fs.existsSync(abs)) {
        try {
          const raw = fs.readFileSync(abs, 'utf8');
          const parsed = JSON.parse(raw) as Idl;
          this.log.log(`IDL loaded from ${abs}`);
          return parsed;
        } catch (err) {
          this.log.warn(
            `Failed to parse IDL at ${abs}: ${(err as Error).message}`,
          );
        }
      }
    }
    return null;
  }
}
