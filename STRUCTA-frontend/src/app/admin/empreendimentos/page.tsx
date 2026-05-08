"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Building2, Search } from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { Empty } from "@/components/ui/Empty";
import { DevelopmentStatusBadge } from "@/components/ui/StatusBadge";
import { apiGet } from "@/lib/api";
import { formatNumber, formatUsdc } from "@/lib/format";
import type { DevelopmentListItem } from "@/lib/types";

const STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "rascunho", label: "Draft" },
  { value: "pendente", label: "Pending" },
  { value: "aprovado", label: "Approved" },
  { value: "venda_aberta", label: "Sale open" },
  { value: "em_construcao", label: "Under construction" },
  { value: "distribuindo_yield", label: "Distributing yield" },
  { value: "aguardando_burn", label: "Awaiting burn" },
  { value: "finalizado", label: "Finalized" },
  { value: "recusado", label: "Rejected" },
  { value: "cancelado", label: "Cancelled" },
];

export default function AdminDevelopmentsPage() {
  const [items, setItems] = useState<DevelopmentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        setLoading(true);
        const url = `/admin/developments${status ? `?status=${status}` : ""}`;
        const data = await apiGet<DevelopmentListItem[]>(url);
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
  }, [status]);

  const filtered = useMemo(() => {
    if (!q) return items;
    const term = q.toLowerCase();
    return items.filter((i) =>
      [
        i.nome,
        i.nome_comercial,
        i.municipio,
        i.uf,
        i.incorporator?.razao_social,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term)),
    );
  }, [items, q]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Name, city, developer…"
            rightSlot={<Search className="size-4" />}
          />
          <Select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={STATUS_OPTIONS}
          />
        </CardContent>
      </Card>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
        </div>
      ) : filtered.length === 0 ? (
        <Empty
          icon={Building2}
          title="No projects found"
          description="Try adjusting the filters."
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((d) => (
            <Link
              key={d.id}
              href={`/admin/empreendimentos/${d.id}`}
              className="group flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-dark-600 bg-dark-900/50 p-4 transition hover:border-orange-500/40"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-300">
                  <Building2 className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white group-hover:text-orange-300">
                    {d.nome_comercial ?? d.nome}
                  </p>
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-gray-500">
                    {d.municipio} · {d.uf} ·{" "}
                    {d.incorporator?.razao_social ?? "—"} ·{" "}
                    {formatNumber(d.numero_unidades, 0)} un.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-right">
                <div className="hidden sm:block">
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-gray-500">
                    Target
                  </p>
                  <p className="font-heading text-sm font-semibold text-white tabular-nums">
                    {formatUsdc(d.captacao_target_brl, { compact: true })}
                  </p>
                </div>
                <div className="hidden sm:block">
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-gray-500">
                    Raised
                  </p>
                  <p className="font-heading text-sm font-semibold text-white tabular-nums">
                    {formatUsdc(d.amount_raised_usdc, { compact: true })}
                  </p>
                </div>
                <DevelopmentStatusBadge status={d.status} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
