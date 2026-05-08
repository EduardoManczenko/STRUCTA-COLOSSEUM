import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get('/')
  root() {
    return {
      service: 'structa-api',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('/health')
  health() {
    return { status: 'ok', uptime: process.uptime() };
  }
}
