import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../common/supabase/supabase.service';

@Injectable()
export class InvestorsService {
  constructor(private readonly supabase: SupabaseService) {}

  async getMe(investorId: string) {
    const { data, error } = await this.supabase.admin
      .from('investors')
      .select('*')
      .eq('id', investorId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw new NotFoundException('Investor not found');
    return data;
  }

  async portfolio(investorId: string) {
    const [purchasesRes, balancesRes, distributionsRes] = await Promise.all([
      this.supabase.admin
        .from('cota_purchases')
        .select(
          `id, cotas_amount, price_per_cota_usdc, total_usdc, tx_signature, created_at,
           development:developments(id, slug, nome, token_symbol, status, sale_open, cover_image_url, yield_apy_percent, yield_periodicidade, prazo_total_token_meses, token_price_usdc)`,
        )
        .eq('investor_id', investorId)
        .order('created_at', { ascending: false }),
      this.supabase.admin
        .from('cota_balances')
        .select('*')
        .eq('investor_id', investorId),
      this.supabase.admin
        .from('yield_distributions')
        .select('*')
        .order('distributed_at', { ascending: false })
        .limit(50),
    ]);

    if (purchasesRes.error) throw new Error(purchasesRes.error.message);
    if (balancesRes.error) throw new Error(balancesRes.error.message);

    const balances = balancesRes.data ?? [];
    const totalInvested = balances.reduce(
      (sum, b) => sum + Number(b.total_invested_usdc ?? 0),
      0,
    );
    const totalCurrentValue = balances.reduce(
      (sum, b) => sum + Number(b.current_value_usdc ?? 0),
      0,
    );

    return {
      purchases: purchasesRes.data ?? [],
      balances,
      totals: {
        invested_usdc: totalInvested,
        current_value_usdc: totalCurrentValue,
        unrealized_pnl_usdc: totalCurrentValue - totalInvested,
        unrealized_pnl_percent:
          totalInvested > 0
            ? ((totalCurrentValue - totalInvested) / totalInvested) * 100
            : 0,
      },
      yield_history: distributionsRes.data ?? [],
    };
  }
}
