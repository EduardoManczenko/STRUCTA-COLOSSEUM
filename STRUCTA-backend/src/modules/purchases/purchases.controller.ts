import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { PurchasesService } from './purchases.service';
import {
  ConfirmPurchaseDto,
  QuotePurchaseDto,
  ReconcilePurchasesDto,
} from './dto/purchase.dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  CurrentUser,
  AuthUser,
} from '../../common/decorators/current-user.decorator';

@UseGuards(AuthGuard, RolesGuard)
@Roles('investor')
@Controller('purchases')
export class PurchasesController {
  constructor(private readonly service: PurchasesService) {}

  @Post('quote')
  quote(@CurrentUser() user: AuthUser, @Body() dto: QuotePurchaseDto) {
    return this.service.quote(user.id, dto);
  }

  @Post('confirm')
  confirm(@CurrentUser() user: AuthUser, @Body() dto: ConfirmPurchaseDto) {
    return this.service.confirm(user.id, dto);
  }

  @Post('reconcile')
  reconcile(
    @CurrentUser() user: AuthUser,
    @Body() dto: ReconcilePurchasesDto,
  ) {
    return this.service.reconcile(user.id, dto);
  }
}
