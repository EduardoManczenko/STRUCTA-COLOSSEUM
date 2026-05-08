import type {
  Portfolio,
  PortfolioBalance,
  PortfolioPurchase,
} from "./types";

/**
 * Aggregate purchases into per-development balances. Used as a fallback when
 * the backend `cota_balances` view comes back empty (RLS, view not refreshed,
 * etc.) so freshly bought tokens always show up in the investor dashboard.
 */
export function deriveBalancesFromPurchases(
  purchases: PortfolioPurchase[],
): PortfolioBalance[] {
  const byDev = new Map<string, PortfolioBalance>();
  for (const p of purchases) {
    const dev = p.development;
    if (!dev) continue;
    const cotas = Number(p.cotas_amount ?? 0);
    const invested = Number(p.total_usdc ?? 0);
    const existing = byDev.get(dev.id);
    if (existing) {
      existing.total_cotas = (existing.total_cotas ?? 0) + cotas;
      existing.total_invested_usdc =
        (existing.total_invested_usdc ?? 0) + invested;
    } else {
      byDev.set(dev.id, {
        investor_id: null,
        development_id: dev.id,
        token_symbol: dev.token_symbol,
        nome: dev.nome,
        total_cotas: cotas,
        total_invested_usdc: invested,
        current_value_usdc: 0,
      });
    }
  }
  for (const balance of byDev.values()) {
    const purchase = purchases.find(
      (p) => p.development?.id === balance.development_id,
    );
    const price = Number(purchase?.development?.token_price_usdc ?? 0);
    balance.current_value_usdc =
      price > 0 && balance.total_cotas
        ? +(balance.total_cotas * price).toFixed(6)
        : (balance.total_invested_usdc ?? 0);
  }
  return Array.from(byDev.values());
}

/**
 * Returns the balances to render. Prefers the backend view; falls back to
 * client-derived balances when the view is empty but purchases exist.
 */
export function resolvePortfolioBalances(
  portfolio: Portfolio | null,
): PortfolioBalance[] {
  if (!portfolio) return [];
  if (portfolio.balances && portfolio.balances.length > 0) {
    return portfolio.balances;
  }
  return deriveBalancesFromPurchases(portfolio.purchases ?? []);
}

export function computePortfolioTotals(balances: PortfolioBalance[]) {
  const invested = balances.reduce(
    (sum, b) => sum + Number(b.total_invested_usdc ?? 0),
    0,
  );
  const current = balances.reduce(
    (sum, b) => sum + Number(b.current_value_usdc ?? 0),
    0,
  );
  return {
    invested_usdc: invested,
    current_value_usdc: current,
    unrealized_pnl_usdc: current - invested,
    unrealized_pnl_percent:
      invested > 0 ? ((current - invested) / invested) * 100 : 0,
  };
}
