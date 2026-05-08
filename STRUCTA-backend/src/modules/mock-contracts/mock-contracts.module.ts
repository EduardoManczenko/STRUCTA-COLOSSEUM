import { Module } from '@nestjs/common';
import { MockContractsService } from './mock-contracts.service';
import { SolanaModule } from '../solana/solana.module';

/**
 * Despite the legacy name, this module now wires the real on-chain Solana
 * contracts service behind the same `MockContractsService` symbol used
 * across the codebase. Setting `STRUCTA_FORCE_MOCK=true` re-enables the
 * original random-address mock behaviour for tests/CI.
 */
@Module({
  imports: [SolanaModule],
  providers: [MockContractsService],
  exports: [MockContractsService],
})
export class MockContractsModule {}
