import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { WalletAuthService } from './wallet-auth.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, WalletAuthService],
  exports: [AuthService, WalletAuthService],
})
export class AuthModule {}
