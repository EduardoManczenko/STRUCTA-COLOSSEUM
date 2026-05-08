import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../common/supabase/supabase.service';
import type { DevelopmentStatus } from '../../common/supabase/database.types';

const PUBLIC_DEV_STATUSES: DevelopmentStatus[] = [
  'aprovado',
  'venda_aberta',
  'em_construcao',
  'distribuindo_yield',
  'aguardando_burn',
  'finalizado',
];

@Injectable()
export class PublicService {
  constructor(private readonly supabase: SupabaseService) {}

  async listDevelopments(opts: { search?: string; status?: string }) {
    let query = this.supabase.admin
      .from('developments')
      .select(
        `id, slug, nome, nome_comercial, tipo, municipio, uf, cover_image_url,
         vgv_brl, captacao_target_brl, amount_raised_usdc, prazo_captacao_dias,
         yield_apy_percent, yield_periodicidade,
         prazo_total_token_meses, status, sale_open, units_sold, numero_unidades,
         token_symbol, token_price_usdc, previsao_habite_se,
         incorporator:incorporators(id, razao_social, nome_fantasia, logo_url, status)`,
      )
      .in('status', PUBLIC_DEV_STATUSES)
      .order('created_at', { ascending: false });

    if (opts.search) {
      query = query.ilike('nome', `%${opts.search}%`);
    }
    if (
      opts.status &&
      PUBLIC_DEV_STATUSES.includes(opts.status as DevelopmentStatus)
    ) {
      query = query.eq('status', opts.status as DevelopmentStatus);
    }
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data ?? [];
  }

  async getDevelopment(idOrSlug: string) {
    const isUuid = /^[0-9a-f-]{36}$/i.test(idOrSlug);
    const filter = isUuid ? 'id' : 'slug';

    const { data, error } = await this.supabase.admin
      .from('developments')
      .select(
        `*,
         incorporator:incorporators(
           id, razao_social, nome_fantasia, logo_url, site, status,
           ano_fundacao, empreendimentos_entregues, vgv_total_entregue_brl,
           estados_atuacao, iso_9001_certificada, iso_9001_numero, iso_9001_validade,
           pbqp_h_nivel, pbqp_h_numero, pbqp_h_validade, municipio, uf
         ),
         images:development_images(*),
         documents:development_documents(id, type, label, filename, mime_type, size_bytes, created_at, sha256_hash, registered_data),
         units:development_units(*),
         yield_history:yield_distributions(amount_usdc, reference_period, distributed_at)`,
      )
      .eq(filter, idOrSlug)
      .in('status', PUBLIC_DEV_STATUSES)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) throw new NotFoundException('Empreendimento not found');
    return data;
  }

  async listApprovedIncorporators() {
    const { data, error } = await this.supabase.admin
      .from('incorporators')
      .select(
        `id, razao_social, nome_fantasia, logo_url, site, municipio, uf,
         ano_fundacao, empreendimentos_entregues, vgv_total_entregue_brl,
         iso_9001_certificada, pbqp_h_nivel`,
      )
      .eq('status', 'aprovada')
      .order('vgv_total_entregue_brl', { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  }

  async stats() {
    const [devs, incs, purchases] = await Promise.all([
      this.supabase.admin
        .from('developments')
        .select('id', { count: 'exact', head: true })
        .in('status', PUBLIC_DEV_STATUSES),
      this.supabase.admin
        .from('incorporators')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'aprovada'),
      this.supabase.admin
        .from('cota_purchases')
        .select('total_usdc'),
    ]);
    const totalRaised = (purchases.data ?? []).reduce(
      (sum, p) => sum + Number(p.total_usdc ?? 0),
      0,
    );
    return {
      developments: devs.count ?? 0,
      incorporators: incs.count ?? 0,
      total_raised_usdc: totalRaised,
    };
  }
}
