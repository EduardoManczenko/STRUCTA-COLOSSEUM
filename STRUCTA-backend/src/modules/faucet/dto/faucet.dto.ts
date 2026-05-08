import { IsOptional, IsString, Matches } from 'class-validator';

const SOLANA_PUBKEY = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export class FaucetMintUsdcDto {
  @IsString()
  @Matches(SOLANA_PUBKEY, { message: 'walletAddress must be a base58 pubkey' })
  walletAddress!: string;

  @IsOptional()
  @IsString()
  amountHuman?: string;
}
