import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  MinLength,
} from 'class-validator';

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}

export class RegisterIncorporatorAccountDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;

  @IsString()
  @IsNotEmpty()
  full_name!: string;
}

export class WalletNonceDto {
  @IsString()
  @IsNotEmpty()
  @Length(32, 64)
  walletAddress!: string;
}

export class WalletVerifyDto {
  @IsString()
  @IsNotEmpty()
  walletAddress!: string;

  @IsString()
  @IsNotEmpty()
  signature!: string; // base58 encoded

  @IsString()
  @IsNotEmpty()
  nonce!: string;

  @IsOptional()
  @IsString()
  message?: string;
}

export type Role = 'admin' | 'incorporator' | 'investor';

export class SetRoleDto {
  @IsEnum(['admin', 'incorporator', 'investor'])
  role!: Role;
}
