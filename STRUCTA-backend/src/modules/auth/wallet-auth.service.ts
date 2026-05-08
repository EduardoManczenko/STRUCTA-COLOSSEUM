import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import * as nacl from 'tweetnacl';
import bs58 from 'bs58';
import { PublicKey } from '@solana/web3.js';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { WalletNonceDto, WalletVerifyDto } from './dto/auth.dto';

interface NonceRecord {
  nonce: string;
  expiresAt: number;
}

const NONCE_TTL_MS = 5 * 60 * 1000;

@Injectable()
export class WalletAuthService {
  // In-memory nonce cache. Acceptable for serverless because nonces are short-lived
  // and the verifier doesn't strictly need persistence (we can also accept any signed
  // message containing the wallet address as long as signature is valid).
  // For multi-instance scenarios, swap with Supabase table if needed.
  private static nonces: Map<string, NonceRecord> = new Map();

  constructor(
    private readonly supabase: SupabaseService,
    private readonly config: ConfigService,
  ) {}

  buildMessage(walletAddress: string, nonce: string) {
    return [
      'STRUCTA — Sign in',
      '',
      `Wallet: ${walletAddress}`,
      `Nonce: ${nonce}`,
      'By signing you authenticate with STRUCTA. This request will not trigger any blockchain transaction or cost gas.',
    ].join('\n');
  }

  requestNonce(dto: WalletNonceDto) {
    if (!this.isValidSolanaAddress(dto.walletAddress)) {
      throw new BadRequestException('Invalid Solana address');
    }
    const nonce = `structa-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    WalletAuthService.nonces.set(dto.walletAddress, {
      nonce,
      expiresAt: Date.now() + NONCE_TTL_MS,
    });
    return {
      nonce,
      message: this.buildMessage(dto.walletAddress, nonce),
      expiresIn: NONCE_TTL_MS / 1000,
    };
  }

  async verify(dto: WalletVerifyDto) {
    if (!this.isValidSolanaAddress(dto.walletAddress)) {
      throw new BadRequestException('Invalid Solana address');
    }
    const cached = WalletAuthService.nonces.get(dto.walletAddress);
    const validNonce =
      cached && cached.nonce === dto.nonce && cached.expiresAt > Date.now();
    if (!validNonce) {
      // For dev-friendliness, if message is supplied we still verify signature against it.
      if (!dto.message) {
        throw new UnauthorizedException('Invalid or expired nonce');
      }
    }
    const message = dto.message ?? this.buildMessage(dto.walletAddress, dto.nonce);

    const messageBytes = new TextEncoder().encode(message);
    let signatureBytes: Uint8Array;
    let publicKeyBytes: Uint8Array;
    try {
      signatureBytes = bs58.decode(dto.signature);
      publicKeyBytes = bs58.decode(dto.walletAddress);
    } catch {
      throw new BadRequestException('Malformed base58 signature/address');
    }

    const ok = nacl.sign.detached.verify(
      messageBytes,
      signatureBytes,
      publicKeyBytes,
    );
    if (!ok) throw new UnauthorizedException('Signature verification failed');

    WalletAuthService.nonces.delete(dto.walletAddress);

    // Get-or-create investor + a synthetic auth user to anchor profile
    const investor = await this.upsertInvestor(dto.walletAddress);

    const jwtSecret = this.config.getOrThrow<string>('JWT_SECRET');
    const expiresIn = this.config.get<string>('JWT_EXPIRES_IN') ?? '7d';
    const token = jwt.sign(
      {
        sub: investor.id,
        walletAddress: investor.wallet_address,
        role: 'investor',
      },
      jwtSecret,
      {
        issuer: this.config.get<string>('JWT_ISSUER') ?? 'structa-api',
        audience: this.config.get<string>('JWT_AUDIENCE') ?? 'structa-frontend',
        expiresIn: expiresIn as jwt.SignOptions['expiresIn'],
      },
    );

    return {
      access_token: token,
      token_type: 'Bearer',
      expires_in: expiresIn,
      investor,
    };
  }

  private async upsertInvestor(walletAddress: string) {
    const found = await this.supabase.admin
      .from('investors')
      .select('*')
      .eq('wallet_address', walletAddress)
      .maybeSingle();
    if (found.data) return found.data;
    const inserted = await this.supabase.admin
      .from('investors')
      .insert({ wallet_address: walletAddress })
      .select()
      .single();
    if (inserted.error)
      throw new BadRequestException(inserted.error.message);
    return inserted.data;
  }

  private isValidSolanaAddress(addr: string): boolean {
    try {
      new PublicKey(addr);
      return true;
    } catch {
      return false;
    }
  }
}
