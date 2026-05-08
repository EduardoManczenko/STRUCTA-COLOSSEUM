"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Coins, ExternalLink, Wallet } from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Empty } from "@/components/ui/Empty";
import { DevelopmentStatusBadge } from "@/components/ui/StatusBadge";
import { apiGet } from "@/lib/api";
import {
  formatDate,
  formatNumber,
  formatPercent,
  formatUsdc,
  shortAddress,
} from "@/lib/format";
import type { Portfolio } from "@/lib/types";
import { resolvePortfolioBalances } from "@/lib/portfolio";

export default function InvestorCotasPage() {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const balances = resolvePortfolioBalances(portfolio);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const data = await apiGet<Portfolio>("/investors/me/portfolio");
        if (!alive) return;
        setPortfolio(data);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Token balance by project</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-20 rounded-xl" />
              <Skeleton className="h-20 rounded-xl" />
            </div>
          ) : balances.length > 0 ? (
            <div className="overflow-hidden rounded-2xl border border-dark-600">
              <div className="hidden grid-cols-[1.5fr,1fr,1fr,1fr,1fr] gap-2 border-b border-dark-700 bg-dark-900/70 px-4 py-3 text-[10px] font-mono uppercase tracking-[0.18em] text-gray-500 md:grid">
                <span>Project</span>
                <span className="text-right">Tokens</span>
                <span className="text-right">Invested</span>
                <span className="text-right">Current value</span>
                <span className="text-right">P&L</span>
              </div>
              <ul className="divide-y divide-dark-700">
                {balances.map((b) => {
                  const invested = Number(b.total_invested_usdc ?? 0);
                  const current = Number(b.current_value_usdc ?? 0);
                  const pnl = current - invested;
                  const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0;
                  const purchase = portfolio?.purchases.find(
                    (p) => p.development?.id === b.development_id,
                  );
                  const dev = purchase?.development;
                  return (
                    <li
                      key={`${b.development_id ?? b.token_symbol}`}
                      className="grid gap-3 px-4 py-4 transition hover:bg-dark-800/40 md:grid-cols-[1.5fr,1fr,1fr,1fr,1fr] md:items-center"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-purple-500/30 bg-purple-500/10 text-purple-300">
                          <Coins className="size-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-white">
                            {b.nome ?? "—"}
                          </div>
                          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-gray-500">
                            {b.token_symbol ?? "—"}
                            {dev && (
                              <>
                                {" "}
                                ·{" "}
                                <Link
                                  href={`/empreendimentos/${dev.slug ?? dev.id}`}
                                  className="text-purple-300 hover:text-orange-300"
                                >
                                  view details
                                </Link>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="md:text-right">
                        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-gray-500 md:hidden">
                          Tokens
                        </div>
                        <div className="font-heading font-semibold text-white tabular-nums">
                          {formatNumber(b.total_cotas, 0)}
                        </div>
                      </div>
                      <div className="md:text-right">
                        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-gray-500 md:hidden">
                          Invested
                        </div>
                        <div className="font-heading font-semibold text-white tabular-nums">
                          {formatUsdc(invested)}
                        </div>
                      </div>
                      <div className="md:text-right">
                        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-gray-500 md:hidden">
                          Current value
                        </div>
                        <div className="font-heading font-semibold text-white tabular-nums">
                          {formatUsdc(current)}
                        </div>
                      </div>
                      <div className="md:text-right">
                        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-gray-500 md:hidden">
                          P&L
                        </div>
                        <div
                          className={`font-heading font-semibold tabular-nums ${pnl >= 0 ? "text-emerald-300" : "text-rose-300"}`}
                        >
                          {pnl >= 0 ? "+" : ""}
                          {formatUsdc(pnl)}
                          <span className="ml-1 font-mono text-[10px] uppercase tracking-[0.18em]">
                            ({pnlPct >= 0 ? "+" : ""}
                            {formatPercent(pnlPct, 2)})
                          </span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <Empty
              icon={Wallet}
              title="No tokens yet"
              description="Purchase tokens from open fundraising projects to get started."
              action={
                <Link href="/dashboard/explore">
                  <Button>Explore projects</Button>
                </Link>
              }
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Purchase history</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-14 rounded-xl" />
              <Skeleton className="h-14 rounded-xl" />
            </div>
          ) : portfolio?.purchases && portfolio.purchases.length > 0 ? (
            <ul className="divide-y divide-dark-700 overflow-hidden rounded-2xl border border-dark-600">
              {portfolio.purchases.map((p) => (
                <li
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-3 bg-dark-900/40 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm text-white">
                      {p.development?.nome ?? "—"}
                    </p>
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-gray-500">
                      {formatDate(p.created_at)} ·{" "}
                      {formatNumber(p.cotas_amount, 0)} tokens ·{" "}
                      {formatUsdc(p.price_per_cota_usdc)} each
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {p.tx_signature && (
                      <a
                        href={`https://solscan.io/tx/${p.tx_signature}?cluster=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.18em] text-purple-300 hover:text-orange-300"
                        title={p.tx_signature}
                      >
                        {shortAddress(p.tx_signature, 6)}
                        <ExternalLink className="size-3" />
                      </a>
                    )}
                    <span className="font-heading text-sm font-semibold text-white tabular-nums">
                      {formatUsdc(p.total_usdc)}
                    </span>
                    {p.development && (
                      <DevelopmentStatusBadge status={p.development.status} />
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <Empty
              icon={Coins}
              title="No purchases recorded"
              description="Your purchases will appear here once confirmed on-chain."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
