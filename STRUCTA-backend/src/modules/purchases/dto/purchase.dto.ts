import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class QuotePurchaseDto {
  @IsString() developmentId!: string;
  @IsNumber() @Min(0.000001) @Type(() => Number) cotasAmount!: number;
}

export class ConfirmPurchaseDto {
  @IsString() developmentId!: string;
  @IsNumber() @Min(0.000001) @Type(() => Number) cotasAmount!: number;
  @IsString() complianceCheckId!: string;
  @IsOptional() @IsString() clientTxSignature?: string;
}

export class ReconcilePurchasesDto {
  @IsOptional() @IsString() developmentId?: string;
}
