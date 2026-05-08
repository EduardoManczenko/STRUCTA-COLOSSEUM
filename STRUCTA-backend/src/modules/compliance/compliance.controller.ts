import {
  Body,
  Controller,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ComplianceService } from './compliance.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  CurrentUser,
  AuthUser,
} from '../../common/decorators/current-user.decorator';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

class ScreenDto {
  @IsOptional() @IsString() walletAddress?: string;
  @IsOptional() @IsString() developmentId?: string;
  @IsOptional() @IsNumber() @Type(() => Number) amountUsdc?: number;
}

@UseGuards(AuthGuard, RolesGuard)
@Roles('investor')
@Controller('compliance')
export class ComplianceController {
  constructor(private readonly service: ComplianceService) {}

  @Post('screen')
  screen(@CurrentUser() user: AuthUser, @Body() dto: ScreenDto) {
    const wallet = dto.walletAddress ?? user.walletAddress;
    if (!wallet) throw new Error('Wallet address required');
    return this.service.screenWallet(
      wallet,
      dto.amountUsdc,
      dto.developmentId,
    );
  }
}
