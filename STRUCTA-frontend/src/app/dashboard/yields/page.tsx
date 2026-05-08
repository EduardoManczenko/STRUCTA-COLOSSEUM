"use client";

import { useEffect, useMemo, useState } from "react";
import { History, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Empty } from "@/components/ui/Empty";
import { StatCard } from "@/components/dashboard/StatCard";
import { apiGet } from "@/lib/api";
import { formatDate, formatUsdc } from "@/lib/format";
import type { Portfolio } from "@/lib/types";

export default function InvestorYieldsPage() {
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
        toast.error(err instanceof Error ? err.message : "Failed to load");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const totals = useMemo(() => {
    const list = portfolio?.yield_history ?? [];
    const total = list.reduce((s, y) => s + Number(y.amount_usdc ?? 0), 0);
    return {
      total,
      distributions: list.length,
      avg: list.length > 0 ? total / list.length : 0,
    };
  }, [portfolio]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[124px] rounded-2xl" />
          ))
        ) : (
          <>
            <StatCard
              label="Total yield received"
              value={formatUsdc(totals.total)}
              hint="Sum of all distributions"
              icon={TrendingUp}
              tone="emerald"
              index={0}
            />
            <StatCard
              label="Distributions"
              value={String(totals.distributions)}
              hint="Paid events"
              icon={History}
              tone="purple"
              index={1}
            />
            <StatCard
              label="Average payment"
              value={formatUsdc(totals.avg)}
              hint="Average per distribution"
              tone="orange"
              index={2}
            />
          </>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Full history</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 rounded-xl" />
              <Skeleton className="h-12 rounded-xl" />
            </div>
          ) : (portfolio?.yield_history ?? []).length === 0 ? (
            <Empty
              icon={History}
              title="No yield distributed yet"
              description="Payments will appear here as soon as the project starts distributing."
            />
          ) : (
            <ul className="divide-y divide-dark-700 overflow-hidden rounded-2xl border border-dark-600">
              {(portfolio?.yield_history ?? []).map((y, i) => (
                <li
                  key={`${y.development_id}-${i}`}
                  className="flex flex-wrap items-center justify-between gap-3 bg-dark-900/40 px-4 py-3"
                >
                  <div>
                    <p className="text-sm text-white">
                      {y.reference_period ?? "Distribution"}
                    </p>
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-gray-500">
                      {formatDate(y.distributed_at)}
                    </p>
                  </div>
                  <span className="font-heading text-base font-semibold text-emerald-300 tabular-nums">
                    +{formatUsdc(y.amount_usdc)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
