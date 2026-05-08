import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { WalletAuthService } from './wallet-auth.service';
import {
  LoginDto,
  RegisterIncorporatorAccountDto,
  WalletNonceDto,
  WalletVerifyDto,
} from './dto/auth.dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly wallet: WalletAuthService,
  ) {}

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Post('incorporator/account')
  registerIncorporatorAccount(@Body() dto: RegisterIncorporatorAccountDto) {
    return this.auth.registerIncorporatorAccount(dto);
  }

  @Post('wallet/nonce')
  walletNonce(@Body() dto: WalletNonceDto) {
    return this.wallet.requestNonce(dto);
  }

  @Post('wallet/verify')
  walletVerify(@Body() dto: WalletVerifyDto) {
    return this.wallet.verify(dto);
  }

  @UseGuards(AuthGuard)
  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return { user };
  }
}
