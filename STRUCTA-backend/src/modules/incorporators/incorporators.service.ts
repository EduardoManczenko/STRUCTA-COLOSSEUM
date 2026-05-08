import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { CreateIncorporatorSubmissionDto } from './dto/incorporator.dto';

function ensureCertification(dto: CreateIncorporatorSubmissionDto) {
  const hasIso = dto.iso_9001_certificada;
  const hasPbqp = !!dto.pbqp_h_nivel;
  if (!hasIso && !hasPbqp) {
    throw new BadRequestException(
      'The company must have at least ISO 9001 OR PBQP-H (level A or B) certification.',
    );
  }
}

@Injectable()
export class IncorporatorsService {
  private readonly logger = new Logger(IncorporatorsService.name);
  constructor(private readonly supabase: SupabaseService) {}

  async createSubmission(dto: CreateIncorporatorSubmissionDto) {
    ensureCertification(dto);

    if (
      !dto.declaracao_veracidade ||
      !dto.declaracao_certificacoes ||
      !dto.declaracao_documentos ||
      !dto.declaracao_diligencia
    ) {
      throw new BadRequestException(
        'All declarations are required to submit the registration.',
      );
    }

    // 1. Create the Supabase Auth user with the provided credentials.
    //    The account exists immediately but the role stays 'pending' until admin approval.
    const { data: authData, error: authError } =
      await this.supabase.admin.auth.admin.createUser({
        email: dto.login_email.trim().toLowerCase(),
        password: dto.password,
        email_confirm: true, // skip email confirmation — we control vetting via admin approval
        user_metadata: {
          full_name: dto.responsavel_nome,
          role: 'pending_incorporator',
        },
      });

    if (authError) {
      this.logger.error('Auth user creation error', authError);
      if (authError.message?.toLowerCase().includes('already registered') ||
          authError.message?.toLowerCase().includes('already exists')) {
        throw new BadRequestException(
          'This email is already registered. Please use a different email or contact support.',
        );
      }
      throw new BadRequestException(
        'Failed to create your account. Please try again.',
      );
    }

    const userId = authData.user.id;

    // 2. Ensure a profile row exists with role = 'pending_incorporator'
    await this.supabase.admin.from('profiles').upsert(
      {
        id: userId,
        email: dto.login_email.trim().toLowerCase(),
        full_name: dto.responsavel_nome,
        role: 'pending_incorporator',
      },
      { onConflict: 'id' },
    );

    // 3. Insert the incorporator submission linked to the auth user
    const { data, error } = await this.supabase.admin
      .from('incorporators')
      .insert({
        razao_social: dto.razao_social,
        nome_fantasia: dto.nome_fantasia ?? null,
        cnpj: dto.cnpj,
        endereco_sede: dto.endereco_sede,
        municipio: dto.municipio,
        uf: dto.uf.toUpperCase(),
        site: dto.site ?? null,
        social_media: dto.social_media ?? null,
        email_comercial: dto.responsavel_email,
        telefone: dto.telefone,
        responsavel_nome: dto.responsavel_nome,
        responsavel_cargo: dto.responsavel_cargo,
        responsavel_cpf: dto.responsavel_cpf,
        responsavel_email: dto.responsavel_email,
        responsavel_whatsapp: dto.responsavel_whatsapp,
        ano_fundacao: dto.ano_fundacao,
        empreendimentos_entregues: dto.empreendimentos_entregues,
        vgv_total_entregue_brl: dto.vgv_total_entregue_brl,
        estados_atuacao: dto.estados_atuacao,
        empreendimentos_em_andamento: dto.empreendimentos_em_andamento ?? [],
        iso_9001_certificada: dto.iso_9001_certificada,
        iso_9001_numero: dto.iso_9001_numero ?? null,
        iso_9001_validade: dto.iso_9001_validade ?? null,
        iso_9001_organismo: dto.iso_9001_organismo ?? null,
        pbqp_h_nivel: dto.pbqp_h_nivel ?? null,
        pbqp_h_numero: dto.pbqp_h_numero ?? null,
        pbqp_h_validade: dto.pbqp_h_validade ?? null,
        pbqp_h_organismo: dto.pbqp_h_organismo ?? null,
        representante_nome: dto.representante_nome,
        representante_cpf: dto.representante_cpf,
        representante_cargo: dto.representante_cargo,
        declaracao_veracidade: dto.declaracao_veracidade,
        declaracao_certificacoes: dto.declaracao_certificacoes,
        declaracao_documentos: dto.declaracao_documentos,
        declaracao_diligencia: dto.declaracao_diligencia,
        logo_url: dto.logo_url ?? null,
        owner_user_id: userId,
        status: 'pendente',
      })
      .select()
      .single();

    if (error) {
      this.logger.error('incorporators insert error', error);
      // Roll back the auth user so the email isn't blocked on retry
      await this.supabase.admin.auth.admin.deleteUser(userId).catch(() => null);
      if (error.code === '42501' || error.message?.includes('row-level security')) {
        throw new BadRequestException(
          'Server configuration error. Please try again in a moment.',
        );
      }
      throw new BadRequestException('Failed to save your submission. Please try again.');
    }

    return { id: data.id };
  }

  async getMine(ownerUserId: string) {
    const { data, error } = await this.supabase.admin
      .from('incorporators')
      .select('*')
      .eq('owner_user_id', ownerUserId)
      .maybeSingle();
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async getById(id: string) {
    const { data, error } = await this.supabase.admin
      .from('incorporators')
      .select(
        `*,
         developments:developments(id, nome, status, captacao_target_brl, amount_raised_usdc, created_at)`,
      )
      .eq('id', id)
      .maybeSingle();
    if (error) throw new BadRequestException(error.message);
    if (!data) throw new NotFoundException('Incorporator not found');
    return data;
  }
}
