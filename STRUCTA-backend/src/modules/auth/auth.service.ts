import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { LoginDto, RegisterIncorporatorAccountDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(private readonly supabase: SupabaseService) {}

  async login(dto: LoginDto) {
    const { data, error } = await this.supabase.admin.auth.signInWithPassword({
      email: dto.email,
      password: dto.password,
    });
    if (error || !data.session) {
      throw new UnauthorizedException('Invalid email or password.');
    }
    const profile = await this.supabase.admin
      .from('profiles')
      .select('id, role, email, full_name, is_multisig_signer')
      .eq('id', data.user.id)
      .maybeSingle();

    const role = profile.data?.role ?? 'investor';

    return {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
      user: {
        id: data.user.id,
        email: data.user.email,
        role,
        full_name: profile.data?.full_name ?? null,
        is_multisig_signer: profile.data?.is_multisig_signer ?? false,
      },
    };
  }

  async registerIncorporatorAccount(dto: RegisterIncorporatorAccountDto) {
    const { data, error } = await this.supabase.admin.auth.admin.createUser({
      email: dto.email,
      password: dto.password,
      email_confirm: true,
      user_metadata: { role: 'incorporator', full_name: dto.full_name },
    });
    if (error || !data.user) {
      throw new BadRequestException(error?.message ?? 'Failed to create user');
    }
    // Trigger handle_new_auth_user already creates the profile, but ensure role is 'incorporator'
    await this.supabase.admin
      .from('profiles')
      .update({ role: 'incorporator', full_name: dto.full_name, email: dto.email })
      .eq('id', data.user.id);
    return { user_id: data.user.id, email: dto.email };
  }
}
