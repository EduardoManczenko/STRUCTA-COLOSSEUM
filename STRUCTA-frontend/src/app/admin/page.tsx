"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Building2,
  Users,
  Inbox,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
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
import { StatCard } from "@/components/dashboard/StatCard";
import {
  DevelopmentStatusBadge,
  IncorporatorStatusBadge,
} from "@/components/ui/StatusBadge";
import { apiGet } from "@/lib/api";
import { formatDate, formatUsdc } from "@/lib/format";
import type {
  DevelopmentListItem,
  IncorporatorListItem,
} from "@/lib/types";

export default function AdminOverviewPage() {
  const [pendingDevs, setPendingDevs] = useState<DevelopmentListItem[]>([]);
  const [pendingIncs, setPendingIncs] = useState<IncorporatorListItem[]>([]);
  const [allDevs, setAllDevs] = useState<DevelopmentListItem[]>([]);
  const [allIncs, setAllIncs] = useState<IncorporatorListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const [pDev, pInc, dev, inc] = await Promise.all([
          apiGet<DevelopmentListItem[]>("/admin/developments?status=pendente"),
          apiGet<IncorporatorListItem[]>("/admin/incorporators?status=pendente"),
          apiGet<DevelopmentListItem[]>("/admin/developments"),
          apiGet<IncorporatorListItem[]>("/admin/incorporators"),
        ]);
        if (!alive) return;
        setPendingDevs(pDev ?? []);
        setPendingIncs(pInc ?? []);
        setAllDevs(dev ?? []);
        setAllIncs(inc ?? []);
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
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[124px] rounded-2xl" />
          ))
        ) : (
          <>
            <StatCard
              label="Projects"
              value={String(allDevs.length)}
              hint={`${pendingDevs.length} awaiting approval`}
              icon={Building2}
              tone="purple"
              index={0}
            />
            <StatCard
              label="Developers"
              value={String(allIncs.length)}
              hint={`${pendingIncs.length} pending review`}
              icon={Users}
              tone="orange"
              index={1}
            />
            <StatCard
              label="Pending approvals"
              value={String(pendingDevs.length + pendingIncs.length)}
              hint="Total to review"
              icon={Inbox}
              tone="rose"
              index={2}
            />
          </>
        )}
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Pending developers</CardTitle>
            <p className="mt-1 text-sm text-gray-400">
              Manual approval required before they can submit projects.
            </p>
          </div>
          <Link href="/admin/incorporadoras?status=pendente">
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
          {loading ? (
            <Skeleton className="h-20 rounded-xl" />
          ) : pendingIncs.length === 0 ? (
            <Empty
              icon={CheckCircle2}
              title="No pending developers"
              description="All caught up. Check back later."
            />
          ) : (
            <ul className="space-y-2">
              {pendingIncs.slice(0, 5).map((inc) => (
                <Link
                  key={inc.id}
                  href={`/admin/incorporadoras/${inc.id}`}
                  className="group flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dark-600 bg-dark-900/40 p-3 transition hover:border-purple-500/40"
                >
                  <div className="flex items-center gap-3">
                    {inc.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={inc.logo_url}
                        alt={inc.razao_social}
                        className="size-9 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex size-9 items-center justify-center rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-300">
                        <Users className="size-4" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white group-hover:text-orange-300">
                        {inc.razao_social}
                      </p>
                      <p className="truncate font-mono text-[10px] uppercase tracking-[0.12em] text-gray-500">
                        {inc.municipio} · {inc.uf} · ISO:{" "}
                        {inc.iso_9001_certificada ? "yes" : "—"} · PBQP-H:{" "}
                        {inc.pbqp_h_nivel ?? "—"}
                      </p>
                    </div>
                  </div>
                  {inc.status && <IncorporatorStatusBadge status={inc.status} />}
                </Link>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Projects awaiting approval</CardTitle>
            <p className="mt-1 text-sm text-gray-400">
              Review each proposal and approve or reject it.
            </p>
          </div>
          <Link href="/admin/aprovacoes">
            <Button
              variant="secondary"
              size="sm"
              rightIcon={<ChevronRight className="size-4" />}
            >
              Go to approvals
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-20 rounded-xl" />
          ) : pendingDevs.length === 0 ? (
            <Empty
              icon={CheckCircle2}
              title="No pending proposals"
              description="No new projects waiting for review."
            />
          ) : (
            <ul className="space-y-2">
              {pendingDevs.slice(0, 5).map((d) => (
                <Link
                  key={d.id}
                  href={`/admin/empreendimentos/${d.id}`}
                  className="group flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dark-600 bg-dark-900/40 p-3 transition hover:border-orange-500/40"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-300">
                      <Building2 className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white group-hover:text-orange-300">
                        {d.nome_comercial ?? d.nome}
                      </p>
                      <p className="truncate font-mono text-[10px] uppercase tracking-[0.12em] text-gray-500">
                        {d.municipio} · {d.uf} · target{" "}
                        {formatUsdc(d.captacao_target_brl, { compact: true })}
                      </p>
                    </div>
                  </div>
                  <DevelopmentStatusBadge status={d.status} />
                </Link>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
