import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { SolanaContractsService } from '../solana/solana-contracts.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly contracts: SolanaContractsService,
  ) {}

  /** On-chain vault balances + project flags. Used by the admin dashboard
   *  to display the live state of an approved development. */
  async getOnChainSnapshot(developmentId: string) {
    const dev = await this.supabase.admin
      .from('developments')
      .select('project_seed_nonce')
      .eq('id', developmentId)
      .maybeSingle();
    const nonce = (dev.data as { project_seed_nonce?: number } | null)?.project_seed_nonce ?? 0;
    const balances = await this.contracts.getOnChainBalances(developmentId, nonce);
    const addresses = this.contracts.getDepositAddresses(developmentId, nonce);
    return { ...addresses, ...balances };
  }

  async listIncorporators(status?: string) {
    let q = this.supabase.admin
      .from('incorporators')
      .select('*')
      .order('data_submissao', { ascending: false });
    if (status) q = q.eq('status', status as 'pendente');
    const { data, error } = await q;
    if (error) throw new BadRequestException(error.message);
    return data ?? [];
  }

  async getIncorporator(id: string) {
    const { data, error } = await this.supabase.admin
      .from('incorporators')
      .select(
        `*,
         documents:incorporator_documents(*),
         developments:developments(id, nome, status, captacao_target_brl, amount_raised_usdc, created_at)`,
      )
      .eq('id', id)
      .maybeSingle();
    if (error) throw new BadRequestException(error.message);
    if (!data) throw new NotFoundException();
    return data;
  }

  async reviewIncorporator(
    id: string,
    reviewerId: string,
    approved: boolean,
    reason?: string,
  ) {
    const { data, error } = await this.supabase.admin
      .from('incorporators')
      .update({
        status: approved ? 'aprovada' : 'recusada',
        status_reason: reason ?? null,
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw new BadRequestException(error.message);

    // If approved, ensure the owner profile is set as 'incorporator'
    if (approved && data?.owner_user_id) {
      await this.supabase.admin
        .from('profiles')
        .update({ role: 'incorporator' })
        .eq('id', data.owner_user_id);
    }
    return data;
  }

  async listDevelopments(status?: string) {
    let q = this.supabase.admin
      .from('developments')
      .select(
        `id, slug, nome, tipo, municipio, uf, status, sale_open, units_sold, numero_unidades,
         captacao_target_brl, amount_raised_usdc, vgv_brl, created_at,
         incorporator:incorporators(id, razao_social, nome_fantasia, status)`,
      )
      .order('created_at', { ascending: false });
    if (status) q = q.eq('status', status as 'pendente');
    const { data, error } = await q;
    if (error) throw new BadRequestException(error.message);
    return data ?? [];
  }

  async getDevelopment(id: string) {
    const { data, error } = await this.supabase.admin
      .from('developments')
      .select(
        `*,
         incorporator:incorporators(*),
         images:development_images(*),
         documents:development_documents(*),
         units:development_units(*),
         purchases:cota_purchases(id, total_usdc, cotas_amount, created_at, investor:investors(wallet_address)),
         yield_history:yield_distributions(*),
         proposals:multisig_proposals(*)`,
      )
      .eq('id', id)
      .maybeSingle();
    if (error) throw new BadRequestException(error.message);
    if (!data) throw new NotFoundException();
    return data;
  }

}
