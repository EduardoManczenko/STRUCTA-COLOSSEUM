import { Controller, Get, Param, Query } from '@nestjs/common';
import { PublicService } from './public.service';

@Controller('public')
export class PublicController {
  constructor(private readonly service: PublicService) {}

  @Get('stats')
  stats() {
    return this.service.stats();
  }

  @Get('developments')
  list(@Query('search') search?: string, @Query('status') status?: string) {
    return this.service.listDevelopments({ search, status });
  }

  @Get('developments/:idOrSlug')
  one(@Param('idOrSlug') idOrSlug: string) {
    return this.service.getDevelopment(idOrSlug);
  }

  @Get('incorporators')
  partners() {
    return this.service.listApprovedIncorporators();
  }
}
