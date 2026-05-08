import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import * as jwt from 'jsonwebtoken';
import { SupabaseService } from '../supabase/supabase.service';
import type { AuthUser } from '../decorators/current-user.decorator';
import type { UserRole } from '../supabase/database.types';

@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly config: ConfigService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<Request & { user?: AuthUser }>();
    const auth = (req.headers['authorization'] ?? '') as string;
    if (!auth.toLowerCase().startsWith('bearer ')) return true;
    const token = auth.slice(7).trim();
    if (!token) return true;

    const jwtSecret = this.config.get<string>('JWT_SECRET');
    if (jwtSecret) {
      try {
        const decoded = jwt.verify(token, jwtSecret) as {
          sub: string;
          walletAddress: string;
          role?: UserRole;
        };
        if (decoded?.sub && decoded?.walletAddress) {
          req.user = {
            id: decoded.sub,
            email: null,
            role: (decoded.role ?? 'investor') as UserRole,
            walletAddress: decoded.walletAddress,
            source: 'wallet',
          };
          return true;
        }
      } catch {
        /* fall through */
      }
    }

    const { data, error } = await this.supabase.admin.auth.getUser(token);
    if (!error && data.user) {
      const profile = await this.supabase.admin
        .from('profiles')
        .select('id, role, email, is_multisig_signer')
        .eq('id', data.user.id)
        .maybeSingle();
      if (profile.data) {
        req.user = {
          id: profile.data.id,
          email: profile.data.email ?? data.user.email ?? null,
          role: profile.data.role,
          isMultisigSigner: profile.data.is_multisig_signer,
          source: 'supabase',
        };
      }
    }
    return true;
  }
}
