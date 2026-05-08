import { Controller, Get, UseGuards } from '@nestjs/common';
import { InvestorsService } from './investors.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  CurrentUser,
  AuthUser,
} from '../../common/decorators/current-user.decorator';

@UseGuards(AuthGuard, RolesGuard)
@Roles('investor')
@Controller('investors')
export class InvestorsController {
  constructor(private readonly service: InvestorsService) {}

  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.service.getMe(user.id);
  }

  @Get('me/portfolio')
  portfolio(@CurrentUser() user: AuthUser) {
    return this.service.portfolio(user.id);
  }
}
