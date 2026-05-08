import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseModule } from './common/supabase/supabase.module';
import { AuthModule } from './modules/auth/auth.module';
import { PublicModule } from './modules/public/public.module';
import { IncorporatorsModule } from './modules/incorporators/incorporators.module';
import { DevelopmentsModule } from './modules/developments/developments.module';
import { InvestorsModule } from './modules/investors/investors.module';
import { PurchasesModule } from './modules/purchases/purchases.module';
import { ComplianceModule } from './modules/compliance/compliance.module';
import { AdminModule } from './modules/admin/admin.module';
import { FilesModule } from './modules/files/files.module';
import { MockContractsModule } from './modules/mock-contracts/mock-contracts.module';
import { SolanaModule } from './modules/solana/solana.module';
import { FaucetModule } from './modules/faucet/faucet.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SolanaModule,
    SupabaseModule,
    AuthModule,
    PublicModule,
    IncorporatorsModule,
    DevelopmentsModule,
    InvestorsModule,
    PurchasesModule,
    ComplianceModule,
    AdminModule,
    FilesModule,
    MockContractsModule,
    FaucetModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
