import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { IncorporatorsService } from './incorporators.service';
import { CreateIncorporatorSubmissionDto } from './dto/incorporator.dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';

@Controller('incorporators')
export class IncorporatorsController {
  constructor(private readonly service: IncorporatorsService) {}

  @Post('submissions')
  create(@Body() dto: CreateIncorporatorSubmissionDto) {
    return this.service.createSubmission(dto);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('incorporator')
  @Get('me')
  mine(@CurrentUser() user: AuthUser) {
    return this.service.getMine(user.id);
  }

  @Get(':id')
  byId(@Param('id') id: string) {
    return this.service.getById(id);
  }
}
