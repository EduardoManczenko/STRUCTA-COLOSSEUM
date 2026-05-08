import { Module } from '@nestjs/common';
import { IncorporatorsController } from './incorporators.controller';
import { IncorporatorsService } from './incorporators.service';

@Module({
  controllers: [IncorporatorsController],
  providers: [IncorporatorsService],
  exports: [IncorporatorsService],
})
export class IncorporatorsModule {}
