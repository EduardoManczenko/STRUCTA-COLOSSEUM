import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateProposalDto {
  @IsString() developmentId!: string;

  @IsEnum([
    'approve_development',
    'reject_development',
    'open_sale',
    'close_sale',
    'withdraw_principal',
    'distribute_yield',
    'unlock_burn',
    'lock_burn',
    'refund_fund',
    'create_smart_contracts',
  ])
  action!:
    | 'approve_development'
    | 'reject_development'
    | 'open_sale'
    | 'close_sale'
    | 'withdraw_principal'
    | 'distribute_yield'
    | 'unlock_burn'
    | 'lock_burn'
    | 'refund_fund'
    | 'create_smart_contracts';

  @IsOptional() @IsString() description?: string;

  @IsOptional()
  payload?: Record<string, unknown>;
}

export class ApproveDevelopmentPayload {
  @IsNumber() @Type(() => Number) yield_apy_percent!: number;
  @IsEnum(['mensal', 'trimestral', 'semestral', 'anual'])
  yield_periodicidade!: 'mensal' | 'trimestral' | 'semestral' | 'anual';
  @IsInt() @Type(() => Number) prazo_total_token_meses!: number;
  @IsString() token_symbol!: string;
  @IsString() token_name!: string;
  @IsNumber() @Type(() => Number) token_supply!: number;
  @IsNumber() @Type(() => Number) token_price_usdc!: number;
}

export class WithdrawPrincipalPayload {
  @IsNumber() @Type(() => Number) @Min(0.000001) amount_usdc!: number;
  @IsString() destination_address!: string;
  @IsOptional() @IsString() description?: string;
}

export class DistributeYieldPayload {
  @IsNumber() @Type(() => Number) @Min(0.000001) amount_usdc!: number;
  @IsOptional() @IsString() reference_period?: string;
}

export class IncorporatorReviewDto {
  @IsBoolean() approved!: boolean;
  @IsOptional() @IsString() reason?: string;
}

export class SignProposalDto {
  /** Solana wallet address (base58) that is signing */
  @IsString() walletAddress!: string;
  /** base58-encoded Ed25519 signature of the canonical message */
  @IsString() signature!: string;
  /** The exact message that was signed (used for verification) */
  @IsString() message!: string;
}
