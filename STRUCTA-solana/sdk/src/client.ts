import * as anchor from "@coral-xyz/anchor";
import { AnchorProvider, BN, Idl, Program, Wallet } from "@coral-xyz/anchor";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
} from "@solana/web3.js";

import {
  deriveHolderPda,
  deriveProjectPdas,
  projectSeedFromString,
  ProjectPdas,
} from "./pdas";

export const YIELD_SCALE = new BN("1000000000000");

export interface StructaClientConfig {
  programId: PublicKey;
  connection: Connection;
  wallet: Wallet;
  /** The Anchor IDL produced by `anchor build` (target/idl/structa.json). */
  idl: Idl;
}

/**
 * Thin wrapper around the auto-generated Anchor program client. Encapsulates
 * PDA derivation, account fetching and the most common instructions.
 *
 * The IDL is supplied at construction time so consumers can load the JSON
 * however they prefer (filesystem, bundled asset, fetched from RPC, etc.).
 */
export class StructaClient {
  // We deliberately use the loose `Program<Idl>` type so the SDK works with
  // any IDL revision without requiring a regenerated TypeScript binding.
  readonly program: Program<Idl>;
  readonly provider: AnchorProvider;
  readonly programId: PublicKey;

  constructor(cfg: StructaClientConfig) {
    this.programId = cfg.programId;
    this.provider = new AnchorProvider(cfg.connection, cfg.wallet, {
      commitment: "confirmed",
      preflightCommitment: "confirmed",
    });
    anchor.setProvider(this.provider);
    this.program = new Program<Idl>(cfg.idl, this.provider);
  }

  // ── PDA helpers ──────────────────────────────────────────────────────
  pdas(projectId: string | Buffer): ProjectPdas {
    const seed =
      typeof projectId === "string" ? projectSeedFromString(projectId) : projectId;
    return deriveProjectPdas(this.programId, seed);
  }

  holder(projectId: string | Buffer, holderWallet: PublicKey) {
    const { project } = this.pdas(projectId);
    return deriveHolderPda(this.programId, project, holderWallet);
  }

  // ── Account fetchers ─────────────────────────────────────────────────
  async getProject(projectId: string | Buffer) {
    const { project } = this.pdas(projectId);
    return (this.program.account as any).projectState.fetchNullable(project);
  }

  async getHolder(projectId: string | Buffer, holder: PublicKey) {
    const { address } = this.holder(projectId, holder);
    return (this.program.account as any).holderState.fetchNullable(address);
  }

  // ── Instruction builders ─────────────────────────────────────────────
  async initializeProjectIx(opts: {
    authority: PublicKey;
    projectId: string;
    usdcMint: PublicKey;
    tokenDecimals: number;
    totalSupply: number | bigint;
    tokenPriceUsdc: number | bigint;
  }) {
    const seed = projectSeedFromString(opts.projectId);
    const pdas = this.pdas(seed);
    const ix = await (this.program.methods as any)
      .initializeProject(
        Array.from(seed),
        opts.tokenDecimals,
        new BN(opts.totalSupply.toString()),
        new BN(opts.tokenPriceUsdc.toString()),
      )
      .accounts({
        authority: opts.authority,
        project: pdas.project,
        projectAuthority: pdas.projectAuthority,
        usdcMint: opts.usdcMint,
        cotaMint: pdas.cotaMint,
        vaultPrincipal: pdas.vaultPrincipal,
        vaultYield: pdas.vaultYield,
        vaultBurn: pdas.vaultBurn,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .instruction();
    return { ix, pdas };
  }

  async openSaleIx(authority: PublicKey, projectId: string) {
    const { project } = this.pdas(projectId);
    return (this.program.methods as any)
      .openSale()
      .accounts({ authority, project })
      .instruction();
  }

  async closeSaleIx(authority: PublicKey, projectId: string) {
    const { project } = this.pdas(projectId);
    return (this.program.methods as any)
      .closeSale()
      .accounts({ authority, project })
      .instruction();
  }

  async buyCotasIx(opts: {
    buyer: PublicKey;
    projectId: string;
    usdcMint: PublicKey;
    amount: number | bigint;
  }) {
    const pdas = this.pdas(opts.projectId);
    const buyerUsdcAta = getAssociatedTokenAddressSync(opts.usdcMint, opts.buyer);
    const buyerCotaAta = getAssociatedTokenAddressSync(pdas.cotaMint, opts.buyer);
    const holder = deriveHolderPda(this.programId, pdas.project, opts.buyer);

    const ix = await (this.program.methods as any)
      .buyCotas(new BN(opts.amount.toString()))
      .accounts({
        buyer: opts.buyer,
        project: pdas.project,
        projectAuthority: pdas.projectAuthority,
        cotaMint: pdas.cotaMint,
        buyerUsdcAta,
        buyerCotaAta,
        vaultPrincipal: pdas.vaultPrincipal,
        vaultYield: pdas.vaultYield,
        holder: holder.address,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .instruction();
    return { ix, holder, buyerCotaAta };
  }

  async distributeYieldIx(opts: {
    authority: PublicKey;
    projectId: string;
    amount: number | bigint;
  }) {
    const pdas = this.pdas(opts.projectId);
    return (this.program.methods as any)
      .distributeYield(new BN(opts.amount.toString()))
      .accounts({
        authority: opts.authority,
        project: pdas.project,
        vaultYield: pdas.vaultYield,
      })
      .instruction();
  }

  async claimYieldIx(opts: {
    holderSigner: PublicKey;
    projectId: string;
    usdcMint: PublicKey;
  }) {
    const pdas = this.pdas(opts.projectId);
    const holder = deriveHolderPda(this.programId, pdas.project, opts.holderSigner);
    const holderUsdcAta = getAssociatedTokenAddressSync(opts.usdcMint, opts.holderSigner);
    return (this.program.methods as any)
      .claimYield()
      .accounts({
        holderSigner: opts.holderSigner,
        project: pdas.project,
        projectAuthority: pdas.projectAuthority,
        holder: holder.address,
        holderUsdcAta,
        vaultYield: pdas.vaultYield,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .instruction();
  }

  async withdrawPrincipalIx(opts: {
    authority: PublicKey;
    projectId: string;
    destination: PublicKey;
    amount: number | bigint;
  }) {
    const pdas = this.pdas(opts.projectId);
    return (this.program.methods as any)
      .withdrawPrincipal(new BN(opts.amount.toString()))
      .accounts({
        authority: opts.authority,
        project: pdas.project,
        projectAuthority: pdas.projectAuthority,
        vaultPrincipal: pdas.vaultPrincipal,
        destination: opts.destination,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .instruction();
  }

  async unlockBurnIx(authority: PublicKey, projectId: string) {
    const pdas = this.pdas(projectId);
    return (this.program.methods as any)
      .unlockBurn()
      .accounts({
        authority,
        project: pdas.project,
        projectAuthority: pdas.projectAuthority,
        vaultPrincipal: pdas.vaultPrincipal,
        vaultBurn: pdas.vaultBurn,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .instruction();
  }

  async lockBurnIx(authority: PublicKey, projectId: string) {
    const { project } = this.pdas(projectId);
    return (this.program.methods as any)
      .lockBurn()
      .accounts({ authority, project })
      .instruction();
  }

  async burnCotasIx(opts: {
    holderSigner: PublicKey;
    projectId: string;
    usdcMint: PublicKey;
    amount: number | bigint;
  }) {
    const pdas = this.pdas(opts.projectId);
    const holder = deriveHolderPda(this.programId, pdas.project, opts.holderSigner);
    const holderCotaAta = getAssociatedTokenAddressSync(pdas.cotaMint, opts.holderSigner);
    const holderUsdcAta = getAssociatedTokenAddressSync(opts.usdcMint, opts.holderSigner);
    return (this.program.methods as any)
      .burnCotas(new BN(opts.amount.toString()))
      .accounts({
        holderSigner: opts.holderSigner,
        project: pdas.project,
        projectAuthority: pdas.projectAuthority,
        cotaMint: pdas.cotaMint,
        holder: holder.address,
        holderCotaAta,
        holderUsdcAta,
        vaultYield: pdas.vaultYield,
        vaultBurn: pdas.vaultBurn,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .instruction();
  }

  async transferAuthorityIx(opts: {
    authority: PublicKey;
    projectId: string;
    newAuthority: PublicKey;
  }) {
    const { project } = this.pdas(opts.projectId);
    return (this.program.methods as any)
      .transferAuthority(opts.newAuthority)
      .accounts({ authority: opts.authority, project })
      .instruction();
  }

  // ── High-level convenience: send ix as a tx ──────────────────────────
  async send(ixs: TransactionInstruction[], signers: Keypair[] = []): Promise<string> {
    const tx = new anchor.web3.Transaction().add(...ixs);
    const sig = await this.provider.sendAndConfirm(tx, signers);
    return sig;
  }
}
