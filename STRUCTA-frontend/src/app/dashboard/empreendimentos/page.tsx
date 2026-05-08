"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  Building2,
  Coins,
  Compass,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Empty } from "@/components/ui/Empty";
import { Skeleton } from "@/components/ui/Skeleton";
import { DevelopmentStatusBadge } from "@/components/ui/StatusBadge";
import { apiGet } from "@/lib/api";
import { formatDate, formatNumber, formatPercent, formatUsdc } from "@/lib/format";
import type { Portfolio, PortfolioPurchase } from "@/lib/types";

export default function InvestorInvestmentsPage() {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const data = await apiGet<Portfolio>("/investors/me/portfolio");
        if (!alive) return;
        setPortfolio(data);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load portfolio");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  /* Group purchases by development */
  const grouped = portfolio
    ? Object.values(
        portfolio.purchases.reduce<Record<string, { dev: PortfolioPurchase["development"]; purchases: PortfolioPurchase[] }>>(
          (acc, p) => {
            const id = p.development?.id ?? "unknown";
            if (!acc[id]) acc[id] = { dev: p.development, purchases: [] };
            acc[id].purchases.push(p);
            return acc;
          },
          {},
        ),
      )
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-xl font-bold text-white">My Investments</h2>
          <p className="mt-0.5 text-sm text-gray-400">
            Projects where you hold tokens.
          </p>
        </div>
        <Link href="/dashboard/explore">
          <Button size="sm" rightIcon={<Compass className="size-4" />}>
            Explore all
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[140px] rounded-2xl" />
          ))}
        </div>
      ) : grouped.length === 0 ? (
        <Empty
          icon={Coins}
          title="No investments yet"
          description="You haven't purchased any tokens yet. Use Explore to find open fundraising opportunities."
          action={
            <Link href="/dashboard/explore">
              <Button rightIcon={<Compass className="size-4" />}>Explore properties</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {grouped.map(({ dev, purchases }) => {
            if (!dev) return null;
            const balance = portfolio?.balances.find((b) => b.development_id === dev.id);
            const totalCotas = balance?.total_cotas ?? purchases.reduce((s, p) => s + p.cotas_amount, 0);
            const totalInvested = balance?.total_invested_usdc ?? purchases.reduce((s, p) => s + p.total_usdc, 0);
            const currentValue = balance?.current_value_usdc ?? totalInvested;
            const latestPurchase = purchases[0];
            return (
              <Card key={dev.id} className="overflow-hidden">
                <div className="flex flex-col gap-0 sm:flex-row">
                  {dev.cover_image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={dev.cover_image_url}
                      alt={dev.nome}
                      className="h-[120px] w-full object-cover sm:h-auto sm:w-[140px] sm:shrink-0"
                    />
                  )}
                  <div className="flex flex-1 flex-col justify-between gap-4 p-4 sm:flex-row sm:items-center">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <DevelopmentStatusBadge status={dev.status} />
                        {dev.token_symbol && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-orange-500/30 px-2 py-0.5 font-mono text-[10px] text-orange-300">
                            <Coins className="size-2.5" />
                            {dev.token_symbol}
                          </span>
                        )}
                      </div>
                      <h3 className="mt-2 font-heading text-lg font-bold text-white">
                        {dev.nome}
                      </h3>
                      <div className="mt-1 grid grid-cols-2 gap-x-6 gap-y-1 text-[12px] sm:grid-cols-4">
                        <Stat label="Tokens held" value={formatNumber(totalCotas, 0)} icon={Coins} />
                        <Stat label="Invested" value={formatUsdc(totalInvested)} icon={Building2} />
                        <Stat label="Current value" value={formatUsdc(currentValue)} accent />
                        {dev.yield_apy_percent && (
                          <Stat label="Target APY" value={formatPercent(dev.yield_apy_percent, 1)} icon={TrendingUp} accent />
                        )}
                      </div>
                    </div>
                    <Link
                      href={`/empreendimentos/${dev.slug ?? dev.id}`}
                      className="shrink-0"
                    >
                      <Button
                        variant="secondary"
                        size="sm"
                        rightIcon={<ArrowUpRight className="size-4" />}
                      >
                        View project
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* purchase history rows */}
                <div className="border-t border-dark-700">
                  <CardHeader className="py-2">
                    <CardTitle className="text-xs">Purchase history</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-3 pt-0">
                    <div className="space-y-1.5">
                      {purchases.map((p) => (
                        <div
                          key={p.id}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dark-700 bg-dark-900/40 px-3 py-2 text-[12px]"
                        >
                          <span className="font-mono text-gray-500">
                            {formatDate(p.created_at)}
                          </span>
                          <span className="text-gray-300">
                            {formatNumber(p.cotas_amount, 0)} tokens @ {formatUsdc(p.price_per_cota_usdc)} each
                          </span>
                          <span className="font-semibold text-orange-300">
                            {formatUsdc(p.total_usdc)}
                          </span>
                          {p.tx_signature && (
                            <a
                              href={`https://solscan.io/tx/${p.tx_signature}?cluster=devnet`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 font-mono text-[10px] text-purple-400 hover:text-purple-300"
                            >
                              TX <ArrowUpRight className="size-3" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  icon?: typeof Building2;
  accent?: boolean;
}) {
  return (
    <div>
      <p className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.16em] text-gray-500">
        {Icon && <Icon className="size-3 text-purple-400" />}
        {label}
      </p>
      <p className={`mt-0.5 font-heading text-sm font-bold tabular-nums ${accent ? "text-orange-300" : "text-white"}`}>
        {value}
      </p>
    </div>
  );
}
