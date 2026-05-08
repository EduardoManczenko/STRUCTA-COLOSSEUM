import { Injectable, Logger } from '@nestjs/common';
import { SolanaContractsService } from '../solana/solana-contracts.service';

/**
 * Backwards-compatible facade.
 *
 * The original `MockContractsService` returned fake addresses and signatures.
 * It is now a thin proxy in front of the real `SolanaContractsService` so we
 * don't have to touch every call-site in admin/multisig/purchases. The class
 * name is kept to preserve the public contract while the internals talk to
 * the on-chain Anchor program.
 *
 * If `STRUCTA_FORCE_MOCK=true` the proxy falls back to the legacy random-
 * address behaviour, which is useful for unit tests that don't have an RPC
 * node available.
 */
@Injectable()
export class MockContractsService {
  private readonly logger = new Logger('Contracts');

  constructor(private readonly real: SolanaContractsService) {}

  private get forceMock(): boolean {
    return (
      process.env.STRUCTA_FORCE_MOCK === 'true' ||
      process.env.STRUCTA_FORCE_MOCK === '1'
    );
  }

  private fakeAddress(): string {
    // Generate deterministic-looking placeholder.
    const chars =
      '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let s = '';
    for (let i = 0; i < 44; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return s;
  }

  private fakeTxSignature(): string {
    const chars =
      '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let s = '';
    for (let i = 0; i < 88; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return s;
  }

  async createDevelopmentSmartContracts(opts: {
    developmentId: string;
    tokenSymbol: string;
    tokenName: string;
    tokenSupply: number;
    tokenPriceUsdc?: number;
    seedNonce?: number;
  }) {
    if (this.forceMock) {
      this.logger.warn(
        `[FORCE-MOCK] create_project for development ${opts.developmentId}`,
      );
      return {
        txSignature: this.fakeTxSignature(),
        cota_mint_address: this.fakeAddress(),
        vault_principal_address: this.fakeAddress(),
        vault_yield_address: this.fakeAddress(),
        burn_pool_address: this.fakeAddress(),
        project_account_address: this.fakeAddress(),
        project_authority_pda: this.fakeAddress(),
        program_id: this.fakeAddress(),
      };
    }
    return this.real.createDevelopmentSmartContracts({
      developmentId: opts.developmentId,
      tokenSymbol: opts.tokenSymbol,
      tokenName: opts.tokenName,
      tokenSupply: opts.tokenSupply,
      tokenPriceUsdc: opts.tokenPriceUsdc ?? 0,
      seedNonce: opts.seedNonce ?? 0,
    });
  }

  async openSale(developmentId: string, nonce = 0) {
    if (this.forceMock)
      return { txSignature: this.fakeTxSignature() };
    return this.real.openSale(developmentId, nonce);
  }

  async closeSale(developmentId: string, nonce = 0) {
    if (this.forceMock)
      return { txSignature: this.fakeTxSignature() };
    return this.real.closeSale(developmentId, nonce);
  }

  async mintCotas(
    developmentId: string,
    walletAddress: string,
    amount: number,
  ) {
    if (this.forceMock) {
      this.logger.log(
        `[MOCK] mint_cotas dev=${developmentId} to=${walletAddress} amt=${amount}`,
      );
      return { txSignature: this.fakeTxSignature() };
    }
    return this.real.mintCotas(developmentId, walletAddress, amount);
  }

  async withdrawPrincipal(
    developmentId: string,
    amountUsdc: number,
    destinationAddress: string,
    nonce = 0,
  ) {
    if (this.forceMock)
      return { txSignature: this.fakeTxSignature() };
    return this.real.withdrawPrincipal(
      developmentId,
      amountUsdc,
      destinationAddress,
      nonce,
    );
  }

  async distributeYield(developmentId: string, amountUsdc: number, nonce = 0) {
    if (this.forceMock)
      return { txSignature: this.fakeTxSignature() };
    return this.real.distributeYield(developmentId, amountUsdc, nonce);
  }

  async unlockBurn(developmentId: string, nonce = 0) {
    if (this.forceMock)
      return { txSignature: this.fakeTxSignature() };
    return this.real.unlockBurn(developmentId, nonce);
  }

  async lockBurn(developmentId: string, nonce = 0) {
    if (this.forceMock)
      return { txSignature: this.fakeTxSignature() };
    return this.real.lockBurn(developmentId, nonce);
  }

  async refundFund(developmentId: string, nonce = 0) {
    if (this.forceMock)
      return { txSignature: this.fakeTxSignature() };
    return this.real.refundFund(developmentId, nonce);
  }
}
