import { Module } from '@nestjs/common';
import { PurchasesController } from './purchases.controller';
import { PurchasesService } from './purchases.service';
import { ComplianceModule } from '../compliance/compliance.module';
import { MockContractsModule } from '../mock-contracts/mock-contracts.module';
import { SolanaModule } from '../solana/solana.module';

@Module({
  imports: [ComplianceModule, MockContractsModule, SolanaModule],
  controllers: [PurchasesController],
  providers: [PurchasesService],
})
export class PurchasesModule {}
