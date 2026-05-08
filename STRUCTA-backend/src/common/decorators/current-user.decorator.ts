import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { UserRole } from '../supabase/database.types';

export interface AuthUser {
  id: string;
  email: string | null;
  role: UserRole;
  walletAddress?: string | null;
  isMultisigSigner?: boolean;
  source: 'supabase' | 'wallet';
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser | undefined => {
    const req = ctx.switchToHttp().getRequest<Request & { user?: AuthUser }>();
    return req.user;
  },
);
