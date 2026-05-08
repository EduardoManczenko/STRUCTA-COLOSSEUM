"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  CheckCircle2,
  Clock,
  PlusCircle,
  TrendingUp,
  XCircle,
  ArrowUpRight,
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
import {
  formatDate,
  formatNumber,
  formatUsdc,
} from "@/lib/format";
import type {
  DevelopmentListItem,
  IncorporatorStatus,
} from "@/lib/types";

interface MyIncorporator {
  id: string;
  razao_social: string;
  nome_fantasia: string | null;
  status: IncorporatorStatus;
  status_reason: string | null;
  cnpj: string;
  data_submissao: string;
  reviewed_at: string | null;
}

export default function IncorporatorOverviewPage() {
  const [me, setMe] = useState<MyIncorporator | null>(null);
  const [meLoading, setMeLoading] = useState(true);
  const [devs, setDevs] = useState<DevelopmentListItem[]>([]);
  const [devsLoading, setDevsLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const data = await apiGet<MyIncorporator | null>("/incorporators/me");
        if (alive) setMe(data);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load");
      } finally {
        if (alive) setMeLoading(false);
      }
    })();
    void (async () => {
      try {
        const data = await apiGet<DevelopmentListItem[]>("/developments/mine");
        if (alive) setDevs(data ?? []);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load");
      } finally {
        if (alive) setDevsLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const stats = useMemo(() => {
    const totalRaised = devs.reduce(
      (s, d) => s + Number(d.amount_raised_usdc ?? 0),
      0,
    );
    const totalTarget = devs.reduce(
      (s, d) => s + Number(d.captacao_target_brl ?? 0),
      0,
    );
    const approved = devs.filter((d) =>
      ["aprovado", "venda_aberta", "em_construcao", "distribuindo_yield", "aguardando_burn", "finalizado"].includes(
        d.status,
      ),
    ).length;
    const pending = devs.filter((d) => d.status === "pendente").length;
    return { totalRaised, totalTarget, approved, pending };
  }, [devs]);

  const isApproved = me?.status === "aprovada";

  return (
    <div className="space-y-8">
      {!meLoading && me && me.status !== "aprovada" && (
        <Card
          className={
            me.status === "recusada"
              ? "border-rose-500/30 bg-rose-500/5"
              : "border-amber-500/30 bg-amber-500/5"
          }
        >
          <CardContent className="flex flex-wrap items-start justify-between gap-3 pt-5">
            <div className="flex items-start gap-3">
              {me.status === "recusada" ? (
                <XCircle className="size-5 text-rose-300" />
              ) : (
                <Clock className="size-5 text-amber-300" />
              )}
              <div>
                <p className="font-heading font-semibold text-white">
                  {me.status === "recusada"
                    ? "Registration rejected"
                    : "Registration under review"}
                </p>
                <p className="mt-1 max-w-xl text-sm text-gray-300">
                  {me.status === "recusada"
                    ? me.status_reason ??
                      "Your submission was rejected. Please contact the Structa team."
                    : "You will be able to submit projects once the Structa team approves your company. You will receive an email at the registered contact address."}
                </p>
              </div>
            </div>
            <IncorporatorStatusBadge status={me.status} />
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {meLoading || devsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[124px] rounded-2xl" />
          ))
        ) : (
          <>
            <StatCard
              label="Projects"
              value={String(devs.length)}
              hint={`${stats.approved} approved · ${stats.pending} pending`}
              icon={Building2}
              tone="purple"
              index={0}
            />
            <StatCard
              label="Fundraising target"
              value={formatUsdc(stats.totalTarget, { compact: true })}
              hint="Sum of all targets"
              tone="orange"
              index={1}
            />
            <StatCard
              label="Raised"
              value={formatUsdc(stats.totalRaised, { compact: true })}
              hint="Total volume in USDC"
              icon={TrendingUp}
              tone="emerald"
              index={2}
            />
            <StatCard
              label="Status"
              value={me?.status ? me.status.charAt(0).toUpperCase() + me.status.slice(1) : "—"}
              hint={
                me?.data_submissao
                  ? `Submitted on ${formatDate(me.data_submissao)}`
                  : ""
              }
              icon={CheckCircle2}
              tone={
                me?.status === "aprovada"
                  ? "emerald"
                  : me?.status === "recusada"
                    ? "rose"
                    : "amber"
              }
              index={3}
            />
          </>
        )}
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>My projects</CardTitle>
            <p className="mt-1 text-sm text-gray-400">
              Track the status of each project and its fundraising progress.
            </p>
          </div>
          <Link
            href="/incorporadora/novo-empreendimento"
            aria-disabled={!isApproved}
          >
            <Button
              size="sm"
              leftIcon={<PlusCircle className="size-4" />}
              disabled={!isApproved}
              title={
                isApproved
                  ? undefined
                  : "Your company must be approved before submitting projects"
              }
            >
              New project
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {devsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-20 rounded-xl" />
              <Skeleton className="h-20 rounded-xl" />
            </div>
          ) : devs.length === 0 ? (
            <Empty
              icon={Building2}
              title={
                isApproved
                  ? "No projects submitted yet"
                  : "Awaiting approval"
              }
              description={
                isApproved
                  ? "Submit your first project to start fundraising."
                  : "You can submit projects once the Structa team approves your company."
              }
              action={
                isApproved && (
                  <Link href="/incorporadora/novo-empreendimento">
                    <Button leftIcon={<PlusCircle className="size-4" />}>
                      New project
                    </Button>
                  </Link>
                )
              }
            />
          ) : (
            <div className="space-y-3">
              {devs.map((d) => (
                <Link
                  key={d.id}
                  href={`/incorporadora/empreendimentos/${d.id}`}
                  className="group flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-dark-600 bg-dark-900/50 p-4 transition hover:border-purple-500/40 hover:bg-purple-500/5"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-purple-500/30 bg-purple-500/10 text-purple-300">
                      <Building2 className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-heading text-base font-semibold text-white group-hover:text-orange-300">
                        {d.nome_comercial ?? d.nome}
                      </div>
                      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-gray-500">
                        {d.municipio} · {d.uf} ·{" "}
                        {formatNumber(d.numero_unidades, 0)} unit
                        {d.numero_unidades > 1 ? "s" : ""}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 sm:ml-auto">
                    <div className="text-left sm:text-right">
                      <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-gray-500">
                        Target
                      </p>
                      <p className="font-heading text-base font-semibold text-white tabular-nums">
                        {formatUsdc(d.captacao_target_brl, { compact: true })}
                      </p>
                    </div>
                    <DevelopmentStatusBadge status={d.status} />
                    <ArrowUpRight className="size-4 text-gray-500 transition group-hover:text-orange-300" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
