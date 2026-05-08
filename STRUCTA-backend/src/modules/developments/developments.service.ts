import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { CreateDevelopmentDto } from './dto/development.dto';

function slugify(s: string) {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

@Injectable()
export class DevelopmentsService {
  constructor(private readonly supabase: SupabaseService) {}

  private async getIncorporatorOfUser(userId: string) {
    const { data, error } = await this.supabase.admin
      .from('incorporators')
      .select('id, status')
      .eq('owner_user_id', userId)
      .maybeSingle();
    if (error) throw new BadRequestException(error.message);
    if (!data)
      throw new ForbiddenException(
        'Você precisa cadastrar a incorporadora antes de propor um empreendimento.',
      );
    if (data.status !== 'aprovada')
      throw new ForbiddenException(
        'Sua incorporadora ainda não foi aprovada pela Structa.',
      );
    return data;
  }

  async createForUser(userId: string, dto: CreateDevelopmentDto) {
    const inc = await this.getIncorporatorOfUser(userId);
    const baseSlug = slugify(dto.nome);
    let slug = baseSlug;
    for (let i = 1; i < 10; i++) {
      const exists = await this.supabase.admin
        .from('developments')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();
      if (!exists.data) break;
      slug = `${baseSlug}-${i}`;
    }

    const { data, error } = await this.supabase.admin
      .from('developments')
      .insert({
        incorporator_id: inc.id,
        slug,
        nome: dto.nome,
        nome_comercial: dto.nome_comercial ?? null,
        tipo: dto.tipo,
        endereco_terreno: dto.endereco_terreno,
        municipio: dto.municipio,
        uf: dto.uf.toUpperCase(),
        cep: dto.cep,
        matricula_cri: dto.matricula_cri ?? null,
        area_terreno_m2: dto.area_terreno_m2 ?? null,
        area_construida_total_m2: dto.area_construida_total_m2 ?? null,
        numero_unidades: dto.numero_unidades,
        padrao: dto.padrao ?? null,
        previsao_inicio_obra: dto.previsao_inicio_obra ?? null,
        previsao_habite_se: dto.previsao_habite_se ?? null,
        cover_image_url: dto.cover_image_url ?? null,
        description: dto.description ?? null,
        spe_razao_social: dto.spe_razao_social,
        spe_cnpj: dto.spe_cnpj,
        spe_data_constituicao: dto.spe_data_constituicao,
        spe_nire: dto.spe_nire ?? null,
        spe_endereco: dto.spe_endereco ?? null,
        spe_cartorio: dto.spe_cartorio ?? null,
        spe_registro: dto.spe_registro ?? null,
        spe_patrimonio_afetacao: dto.spe_patrimonio_afetacao ?? false,
        spe_patrimonio_afetacao_registro:
          dto.spe_patrimonio_afetacao_registro ?? null,
        spe_ret_ativo: dto.spe_ret_ativo ?? false,
        construtora_responsavel_tecnico:
          dto.construtora_responsavel_tecnico ?? null,
        construtora_crea_cau: dto.construtora_crea_cau ?? null,
        construtora_uf: dto.construtora_uf?.toUpperCase() ?? null,
        vgv_brl: dto.vgv_brl,
        custo_total_construcao_brl: dto.custo_total_construcao_brl,
        custo_terreno_brl: dto.custo_terreno_brl ?? null,
        cub_referencia_mes_ano: dto.cub_referencia_mes_ano ?? null,
        cub_sinduscon: dto.cub_sinduscon ?? null,
        bdi_percent: dto.bdi_percent ?? null,
        captacao_target_brl: dto.captacao_target_brl,
        prazo_captacao_dias: dto.prazo_captacao_dias,
        percentual_custo_construcao_coberto:
          dto.percentual_custo_construcao_coberto ?? null,
        status: 'pendente',
      })
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);

    if (dto.images?.length) {
      await this.supabase.admin.from('development_images').insert(
        dto.images.map((i, idx) => ({
          development_id: data.id,
          storage_path: i.storage_path,
          url: i.url,
          caption: i.caption ?? null,
          order_index: i.order_index ?? idx,
        })),
      );
    }
    if (dto.documents?.length) {
      await this.supabase.admin.from('development_documents').insert(
        dto.documents.map((d) => ({
          development_id: data.id,
          type: d.type,
          label: d.label ?? null,
          storage_path: d.storage_path,
          filename: d.filename,
          mime_type: d.mime_type,
          size_bytes: d.size_bytes,
          sha256_hash: d.sha256_hash ?? null,
          registered_data: (d.registered_data ?? null) as never,
          uploaded_by: userId,
        })),
      );
    }
    if (dto.units?.length) {
      await this.supabase.admin.from('development_units').insert(
        dto.units.map((u) => ({
          development_id: data.id,
          identifier: u.identifier,
          metragem_m2: u.metragem_m2 ?? null,
          preco_brl: u.preco_brl ?? null,
        })),
      );
    }
    return data;
  }

  async listForUser(userId: string) {
    const inc = await this.supabase.admin
      .from('incorporators')
      .select('id')
      .eq('owner_user_id', userId)
      .maybeSingle();
    if (!inc.data) return [];
    const { data, error } = await this.supabase.admin
      .from('developments')
      .select('*')
      .eq('incorporator_id', inc.data.id)
      .order('created_at', { ascending: false });
    if (error) throw new BadRequestException(error.message);
    return data ?? [];
  }

  async getOneForUser(userId: string, id: string) {
    const inc = await this.supabase.admin
      .from('incorporators')
      .select('id')
      .eq('owner_user_id', userId)
      .maybeSingle();
    if (!inc.data) throw new NotFoundException();
    const { data, error } = await this.supabase.admin
      .from('developments')
      .select(
        `*,
         images:development_images(*),
         documents:development_documents(*),
         units:development_units(*),
         purchases:cota_purchases(id, total_usdc, cotas_amount, created_at, investor:investors(wallet_address)),
         yield_history:yield_distributions(*)`,
      )
      .eq('id', id)
      .eq('incorporator_id', inc.data.id)
      .maybeSingle();
    if (error) throw new BadRequestException(error.message);
    if (!data) throw new NotFoundException();
    return data;
  }
}
