"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Building2,
  Coins,
  Sparkles,
  TrendingUp,
  Wallet,
  PieChart,
  ChevronRight,
  History,
  Clock,
  Droplet,
  Github,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Empty } from "@/components/ui/Empty";
import { StatCard } from "@/components/dashboard/StatCard";
import { DevelopmentStatusBadge } from "@/components/ui/StatusBadge";
import { apiGet } from "@/lib/api";
import {
  formatNumber,
  formatPercent,
  formatUsdc,
  formatDate,
} from "@/lib/format";
import type {
  DevelopmentListItem,
  Portfolio,
} from "@/lib/types";
import { useAuth } from "@/components/providers/AuthProvider";

export default function InvestorOverviewPage() {
  const { user } = useAuth();
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loadingPortfolio, setLoadingPortfolio] = useState(true);

  const [openSale, setOpenSale] = useState<DevelopmentListItem[]>([]);
  const [loadingOpen, setLoadingOpen] = useState(true);

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
        if (alive) setLoadingPortfolio(false);
      }
    })();
    void (async () => {
      try {
        const data = await apiGet<DevelopmentListItem[]>(
          "/public/developments?status=venda_aberta&limit=4",
          { noAuth: true },
        );
        if (!alive) return;
        setOpenSale(data ?? []);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load projects");
      } finally {
        if (alive) setLoadingOpen(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const totals = portfolio?.totals;
  const purchases = portfolio?.purchases ?? [];

  return (
    <div className="space-y-8">
      <Link
        href="/dashboard/devnet"
        className="group relative block overflow-hidden rounded-2xl border border-purple-500/30 bg-gradient-to-r from-purple-500/15 via-dark-800/60 to-orange-500/10 p-4 backdrop-blur-md transition hover:border-purple-400/50 hover:shadow-lg hover:shadow-purple-500/10 sm:p-5"
      >
        <div className="pointer-events-none absolute -right-10 -top-10 size-[200px] rounded-full bg-orange-500/10 blur-3xl transition group-hover:bg-orange-500/20" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-purple-500/30 bg-purple-500/10 text-purple-200">
              <Droplet className="size-5" />
            </div>
            <div className="min-w-0">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-purple-200">
                <Sparkles className="size-2.5" />
                Devnet beta
              </span>
              <h3 className="mt-1.5 truncate font-heading text-base font-bold text-white sm:text-lg">
                First time here? Set up your devnet wallet in 2 minutes
              </h3>
              <p className="mt-0.5 hidden text-[12px] text-gray-400 sm:block">
                Switch to devnet, grab 5 SOL from the official Solana faucet
                with{" "}
                <span className="inline-flex items-center gap-1 align-middle text-gray-300">
                  <Github className="size-3" /> GitHub
                </span>{" "}
                and mint 100k fake USDC to start testing.
              </p>
            </div>
          </div>
            <Button
              size="sm"
              variant="primary"
              rightIcon={<ChevronRight className="size-4" />}
            >
              Open guide
            </Button>
        </div>
      </Link>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loadingPortfolio ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[124px] rounded-2xl" />
          ))
        ) : (
          <>
            <StatCard
              label="Total invested"
              value={formatUsdc(totals?.invested_usdc ?? 0)}
              hint="Capital deployed across all tokens"
              icon={Wallet}
              tone="purple"
              index={0}
            />
            <StatCard
              label="Current value"
              value={formatUsdc(totals?.current_value_usdc ?? 0)}
              hint="Market value in USDC"
              icon={PieChart}
              tone="orange"
              index={1}
            />
            <StatCard
              label="Unrealized P&L"
              value={formatUsdc(totals?.unrealized_pnl_usdc ?? 0)}
              trend={
                totals
                  ? {
                      value: `${(totals.unrealized_pnl_percent ?? 0) >= 0 ? "+" : ""}${(totals.unrealized_pnl_percent ?? 0).toFixed(2)}%`,
                      positive: (totals.unrealized_pnl_percent ?? 0) >= 0,
                    }
                  : undefined
              }
              icon={TrendingUp}
              tone={
                (totals?.unrealized_pnl_usdc ?? 0) >= 0 ? "emerald" : "rose"
              }
              index={2}
            />
            <StatCard
              label="Projects"
              value={formatNumber(portfolio?.balances.length ?? 0, 0)}
              hint="Active positions"
              icon={Building2}
              tone="sky"
              index={3}
            />
          </>
        )}
      </div>

      {user?.walletAddress && (
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-5">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300">
                <Sparkles className="size-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-gray-400">Connected wallet</p>
                <code className="block break-all font-mono text-[12px] text-purple-200">
                  {user.walletAddress}
                </code>
              </div>
            </div>
            <Link href="/dashboard/explore">
              <Button size="sm" rightIcon={<ChevronRight className="size-4" />}>
                Explore investments
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div>
            <CardTitle>My tokens</CardTitle>
            <p className="mt-1 text-sm text-gray-400">
              Token balance per project and current USDC value.
            </p>
          </div>
          <Link href="/dashboard/cotas">
            <Button
              variant="secondary"
              size="sm"
              rightIcon={<ChevronRight className="size-4" />}
            >
              View all
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {loadingPortfolio ? (
            <div className="space-y-3">
              <Skeleton className="h-16 rounded-xl" />
              <Skeleton className="h-16 rounded-xl" />
            </div>
          ) : portfolio?.balances && portfolio.balances.length > 0 ? (
            <div className="space-y-3">
              {portfolio.balances.slice(0, 4).map((b) => {
                const purchase = purchases.find(
                  (p) => p.development?.id === b.development_id,
                );
                const dev = purchase?.development;
                return (
                  <Link
                    key={`${b.development_id ?? b.token_symbol}-balance`}
                    href={
                      dev
                        ? `/empreendimentos/${dev.slug ?? dev.id}`
                        : "/dashboard/cotas"
                    }
                    className="group flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-dark-600 bg-dark-900/50 p-4 transition hover:border-purple-500/40 hover:bg-purple-500/5"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-purple-500/30 bg-purple-500/10 text-purple-300">
                        <Coins className="size-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate font-heading text-base font-semibold text-white">
                          {b.nome ?? "Project"}
                        </div>
                        <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-gray-500">
                          {b.token_symbol ?? "—"} ·{" "}
                          {formatNumber(b.total_cotas, 0)} tokens
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-heading text-lg font-bold text-white tabular-nums">
                        {formatUsdc(b.current_value_usdc ?? 0)}
                      </div>
                      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-emerald-400">
                        Invested {formatUsdc(b.total_invested_usdc ?? 0)}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <Empty
              icon={Coins}
              title="No tokens yet"
              description="Explore open fundraising projects and acquire your first tokenized real estate position."
              action={
                <Link href="/dashboard/explore">
                  <Button>Explore investments</Button>
                </Link>
              }
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Open for investment</CardTitle>
            <p className="mt-1 text-sm text-gray-400">
              Live opportunities available for token purchase right now.
            </p>
          </div>
          <Link href="/dashboard/explore">
            <Button
              variant="secondary"
              size="sm"
              rightIcon={<ChevronRight className="size-4" />}
            >
              View all
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {loadingOpen ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-40 rounded-2xl" />
              <Skeleton className="h-40 rounded-2xl" />
            </div>
          ) : openSale.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {openSale.map((dev, i) => (
                <motion.div
                  key={dev.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                >
                  <Link
                    href={`/empreendimentos/${dev.slug ?? dev.id}`}
                    className="group flex h-full flex-col gap-4 rounded-2xl border border-dark-600 bg-dark-900/50 p-4 transition hover:border-orange-500/40 hover:bg-orange-500/5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-heading text-base font-semibold text-white">
                          {dev.nome_comercial ?? dev.nome}
                        </div>
                        <p className="mt-0.5 truncate text-[12px] text-gray-500">
                          {dev.municipio} · {dev.uf}
                        </p>
                      </div>
                      <DevelopmentStatusBadge status={dev.status} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-xl border border-dark-600 bg-dark-800/60 p-2.5">
                        <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-gray-500">
                          Target APY
                        </p>
                        <p className="mt-0.5 font-heading text-base font-bold text-emerald-300 tabular-nums">
                          {formatPercent(dev.yield_apy_percent, 1)}
                        </p>
                      </div>
                      <div className="rounded-xl border border-dark-600 bg-dark-800/60 p-2.5">
                        <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-gray-500">
                          Token price
                        </p>
                        <p className="mt-0.5 font-heading text-base font-bold text-orange-300 tabular-nums">
                          {formatUsdc(dev.token_price_usdc)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-auto inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.18em] text-orange-300">
                      Buy tokens
                      <ChevronRight className="size-3 transition group-hover:translate-x-0.5" />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <Empty
              icon={Building2}
              title="No open sales at the moment"
              description="Check back soon for the next fundraising round, or browse projects under construction."
              action={
                <Link href="/empreendimentos">
                  <Button variant="secondary">Browse projects</Button>
                </Link>
              }
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Recent yields</CardTitle>
            <p className="mt-1 text-sm text-gray-400">
              Latest distributions paid in USDC.
            </p>
          </div>
          <Link href="/dashboard/yields">
            <Button
              variant="secondary"
              size="sm"
              rightIcon={<ChevronRight className="size-4" />}
            >
              Full history
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {loadingPortfolio ? (
            <div className="space-y-3">
              <Skeleton className="h-12 rounded-xl" />
              <Skeleton className="h-12 rounded-xl" />
            </div>
          ) : portfolio?.yield_history && portfolio.yield_history.length > 0 ? (
            <ul className="space-y-2">
              {portfolio.yield_history.slice(0, 5).map((y, i) => (
                <li
                  key={`${y.development_id}-${y.distributed_at}-${i}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dark-600 bg-dark-900/40 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
                      <History className="size-4" />
                    </div>
                    <div>
                      <p className="text-sm text-white">
                        Distribution {y.reference_period ?? "—"}
                      </p>
                      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-gray-500">
                        <Clock className="mr-1 inline size-3" />
                        {formatDate(y.distributed_at)}
                      </p>
                    </div>
                  </div>
                  <div className="font-heading text-base font-semibold text-emerald-300 tabular-nums">
                    +{formatUsdc(y.amount_usdc)}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <Empty
              icon={History}
              title="No distributions yet"
              description="When projects start distributing yield, it will appear here."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
