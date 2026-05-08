import {
  Body,
  Controller,
  Post,
  UseGuards,
} from '@nestjs/common';
import { FilesService } from './files.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import {
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OptionalAuthGuard } from '../../common/guards/optional-auth.guard';

class UploadUrlDto {
  @IsString() bucket!: string;
  @IsString() filename!: string;
  @IsString() contentType!: string;
  @IsOptional() @IsString() folder?: string;
}

class DownloadUrlDto {
  @IsString() bucket!: string;
  @IsString() path!: string;
  @IsOptional() @IsInt() @Type(() => Number) expiresIn?: number;
}

@Controller('files')
export class FilesController {
  constructor(private readonly service: FilesService) {}

  // Upload URLs are open (works for incorporator signup before any auth) but limited to allowed buckets.
  @UseGuards(OptionalAuthGuard)
  @Post('upload-url')
  uploadUrl(@Body() dto: UploadUrlDto) {
    return this.service.getUploadUrl(dto);
  }

  @UseGuards(AuthGuard)
  @Post('download-url')
  downloadUrl(@Body() dto: DownloadUrlDto) {
    return this.service.getDownloadUrl(dto);
  }
}
