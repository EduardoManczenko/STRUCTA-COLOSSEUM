import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { MultisigService } from './multisig.service';
import { MockContractsModule } from '../mock-contracts/mock-contracts.module';
import { SolanaModule } from '../solana/solana.module';

@Module({
  imports: [MockContractsModule, SolanaModule],
  controllers: [AdminController],
  providers: [AdminService, MultisigService],
  exports: [AdminService, MultisigService],
})
export class AdminModule {}
