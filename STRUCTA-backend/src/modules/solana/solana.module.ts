import { Global, Module } from '@nestjs/common';
import { SolanaService } from './solana.service';
import { SolanaContractsService } from './solana-contracts.service';

@Global()
@Module({
  providers: [SolanaService, SolanaContractsService],
  exports: [SolanaService, SolanaContractsService],
})
export class SolanaModule {}
