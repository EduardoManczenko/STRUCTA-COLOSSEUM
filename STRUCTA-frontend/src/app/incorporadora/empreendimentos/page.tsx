"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Building2, PlusCircle, Search } from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { Empty } from "@/components/ui/Empty";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { DevelopmentStatusBadge } from "@/components/ui/StatusBadge";
import { apiGet } from "@/lib/api";
import {
  formatDate,
  formatNumber,
  formatUsdc,
  pct,
} from "@/lib/format";
import type { DevelopmentListItem } from "@/lib/types";

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "rascunho", label: "Draft" },
  { value: "pendente", label: "Pending" },
  { value: "aprovado", label: "Approved" },
  { value: "venda_aberta", label: "Sale open" },
  { value: "em_construcao", label: "Under construction" },
  { value: "distribuindo_yield", label: "Distributing yield" },
  { value: "aguardando_burn", label: "Awaiting burn" },
  { value: "finalizado", label: "Completed" },
  { value: "recusado", label: "Rejected" },
];

export default function IncorporatorDevelopmentsPage() {
  const [items, setItems] = useState<DevelopmentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const data = await apiGet<DevelopmentListItem[]>("/developments/mine");
        if (alive) setItems(data ?? []);
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

  const filtered = useMemo(() => {
    let list = items;
    if (status) list = list.filter((i) => i.status === status);
    if (q) {
      const term = q.toLowerCase();
      list = list.filter((i) =>
        [i.nome, i.nome_comercial, i.municipio, i.uf]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(term)),
      );
    }
    return list;
  }, [items, q, status]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <Link href="/incorporadora/novo-empreendimento">
            <Button size="sm" leftIcon={<PlusCircle className="size-4" />}>
              New project
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Name, city, state…"
            rightSlot={<Search className="size-4" />}
          />
          <Select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={STATUS_FILTERS}
          />
        </CardContent>
      </Card>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Empty
          icon={Building2}
          title="No projects"
          description="Register your first project or adjust the filters."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((d) => {
            const target = Number(d.captacao_target_brl ?? 0);
            const raised = Number(d.amount_raised_usdc ?? 0);
            const filledPct = pct(raised * 5, target);
            return (
              <Link
                key={d.id}
                href={`/incorporadora/empreendimentos/${d.id}`}
                className="group flex flex-col gap-4 rounded-2xl border border-dark-600 bg-dark-900/50 p-4 transition hover:border-purple-500/40 hover:bg-purple-500/5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-heading text-base font-semibold text-white group-hover:text-orange-300">
                      {d.nome_comercial ?? d.nome}
                    </p>
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-gray-500">
                      {d.municipio} · {d.uf} · {formatNumber(d.numero_unidades, 0)} un.
                    </p>
                  </div>
                  <DevelopmentStatusBadge status={d.status} />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Cell label="Fundraising" value={formatUsdc(target, { compact: true })} />
                  <Cell label="Raised" value={formatUsdc(raised, { compact: true })} />
                  <Cell
                    label="Sold"
                    value={`${d.units_sold}/${d.numero_unidades}`}
                  />
                </div>
                <div>
                  <ProgressBar value={filledPct} />
                  <div className="mt-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.18em] text-gray-500">
                    <span>{filledPct.toFixed(0)}% raised</span>
                    <span>
                      {d.previsao_habite_se
                        ? `Completion ${formatDate(d.previsao_habite_se)}`
                        : ""}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-dark-600 bg-dark-800/60 p-2.5">
      <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-gray-500">
        {label}
      </p>
      <p className="mt-0.5 font-heading text-sm font-semibold text-white tabular-nums">
        {value}
      </p>
    </div>
  );
}
