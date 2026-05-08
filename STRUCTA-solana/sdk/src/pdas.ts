import { PublicKey } from "@solana/web3.js";

export const PROJECT_SEED = Buffer.from("project");
export const PROJECT_AUTHORITY_SEED = Buffer.from("authority");
export const VAULT_PRINCIPAL_SEED = Buffer.from("vault_principal");
export const VAULT_YIELD_SEED = Buffer.from("vault_yield");
export const VAULT_BURN_SEED = Buffer.from("vault_burn");
export const COTA_MINT_SEED = Buffer.from("cota_mint");
export const HOLDER_SEED = Buffer.from("holder");

/**
 * Convert any UUID/string into the deterministic 32-byte project seed used on-chain.
 *
 * `nonce` (optional) lets us derive a different seed for the same UUID — useful
 * to recover from a bad on-chain init (e.g. wrong USDC mint) without changing
 * the canonical UUID stored in the database.
 */
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
  bumps: {
    project: number;
    authority: number;
    cotaMint: number;
    vaultPrincipal: number;
    vaultYield: number;
    vaultBurn: number;
  };
}

/** Derive every PDA related to a project from its seed and the program id. */
export function deriveProjectPdas(
  programId: PublicKey,
  projectSeed: Buffer,
): ProjectPdas {
  const [project, projectBump] = PublicKey.findProgramAddressSync(
    [PROJECT_SEED, projectSeed],
    programId,
  );
  const [projectAuthority, authorityBump] = PublicKey.findProgramAddressSync(
    [PROJECT_AUTHORITY_SEED, project.toBuffer()],
    programId,
  );
  const [cotaMint, mintBump] = PublicKey.findProgramAddressSync(
    [COTA_MINT_SEED, project.toBuffer()],
    programId,
  );
  const [vaultPrincipal, principalBump] = PublicKey.findProgramAddressSync(
    [VAULT_PRINCIPAL_SEED, project.toBuffer()],
    programId,
  );
  const [vaultYield, yieldBump] = PublicKey.findProgramAddressSync(
    [VAULT_YIELD_SEED, project.toBuffer()],
    programId,
  );
  const [vaultBurn, burnBump] = PublicKey.findProgramAddressSync(
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
    bumps: {
      project: projectBump,
      authority: authorityBump,
      cotaMint: mintBump,
      vaultPrincipal: principalBump,
      vaultYield: yieldBump,
      vaultBurn: burnBump,
    },
  };
}

/** Derive the per-holder state PDA for a (project, wallet) tuple. */
export function deriveHolderPda(
  programId: PublicKey,
  project: PublicKey,
  holder: PublicKey,
): { address: PublicKey; bump: number } {
  const [address, bump] = PublicKey.findProgramAddressSync(
    [HOLDER_SEED, project.toBuffer(), holder.toBuffer()],
    programId,
  );
  return { address, bump };
}
