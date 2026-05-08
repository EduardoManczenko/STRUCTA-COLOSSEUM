import { Injectable, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

/**
 * Provides two Supabase clients:
 *  - `admin` → service-role key, bypasses RLS (all server-to-server ops)
 *  - `anon`  → anon key, honours RLS (scoped to authenticated user)
 *
 * Clients are created lazily on first access so that `process.env` values
 * are guaranteed to be present in any serverless runtime (Vercel cold-start).
 */
@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);
  private _admin: SupabaseClient<Database> | null = null;
  private _anon: SupabaseClient<Database> | null = null;

  private get url(): string {
    const v = process.env['SUPABASE_URL'];
    if (!v) throw new Error('SUPABASE_URL env var is missing');
    return v;
  }

  private get anonKey(): string {
    const v = process.env['SUPABASE_ANON_KEY'];
    if (!v) throw new Error('SUPABASE_ANON_KEY env var is missing');
    return v;
  }

  private get serviceRoleKey(): string | null {
    const v = (process.env['SUPABASE_SERVICE_ROLE_KEY'] ?? '').trim();
    if (!v || v === 'YOUR_SERVICE_ROLE_KEY_HERE') return null;
    return v;
  }

  /** Service-role client. Bypasses RLS. Use ONLY in trusted server code. */
  get admin(): SupabaseClient<Database> {
    if (!this._admin) {
      const key = this.serviceRoleKey;
      if (!key) {
        this.logger.warn(
          'SUPABASE_SERVICE_ROLE_KEY not set — admin client will use anon key. ' +
            'RLS policies will apply and admin queries may return partial data.',
        );
      } else {
        this.logger.log(
          `Supabase admin client initialised with service-role key (len=${key.length}, preview=${key.slice(0, 12)}…${key.slice(-6)}).`,
        );
      }
      const finalKey = key ?? this.anonKey;
      this._admin = createClient<Database>(this.url, finalKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
        global: {
          headers: {
            apikey: finalKey,
            Authorization: `Bearer ${finalKey}`,
          },
        },
      });
    }
    return this._admin;
  }

  /** Anon client. Honours RLS. */
  get anon(): SupabaseClient<Database> {
    if (!this._anon) {
      this._anon = createClient<Database>(this.url, this.anonKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
    }
    return this._anon;
  }
}
