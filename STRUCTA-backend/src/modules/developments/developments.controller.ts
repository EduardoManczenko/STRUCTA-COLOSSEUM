import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { DevelopmentsService } from './developments.service';
import { CreateDevelopmentDto } from './dto/development.dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  CurrentUser,
  AuthUser,
} from '../../common/decorators/current-user.decorator';

@UseGuards(AuthGuard, RolesGuard)
@Roles('incorporator')
@Controller('developments')
export class DevelopmentsController {
  constructor(private readonly service: DevelopmentsService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateDevelopmentDto) {
    return this.service.createForUser(user.id, dto);
  }

  @Get('mine')
  mine(@CurrentUser() user: AuthUser) {
    return this.service.listForUser(user.id);
  }

  @Get(':id')
  one(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.getOneForUser(user.id, id);
  }
}
