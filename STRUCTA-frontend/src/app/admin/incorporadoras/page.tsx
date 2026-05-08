"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Users } from "lucide-react";
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
import { IncorporatorStatusBadge } from "@/components/ui/StatusBadge";
import { apiGet } from "@/lib/api";
import { formatDate, formatUsdc } from "@/lib/format";
import type { IncorporatorListItem, IncorporatorStatus } from "@/lib/types";

interface Item extends IncorporatorListItem {
  status: IncorporatorStatus;
  data_submissao?: string;
}

const STATUS = [
  { value: "", label: "All" },
  { value: "pendente", label: "Pending" },
  { value: "aprovada", label: "Approved" },
  { value: "recusada", label: "Rejected" },
  { value: "suspensa", label: "Suspended" },
];

export default function AdminIncorporatorsPage() {
  return (
    <Suspense fallback={<div className="text-sm text-gray-400">Loading…</div>}>
      <AdminIncorporatorsPageInner />
    </Suspense>
  );
}

function AdminIncorporatorsPageInner() {
  const params = useSearchParams();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(params?.get("status") ?? "");
  const [q, setQ] = useState("");

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        setLoading(true);
        const url = `/admin/incorporators${status ? `?status=${status}` : ""}`;
        const data = await apiGet<Item[]>(url);
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
      [i.razao_social, i.nome_fantasia, i.municipio, i.uf]
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
            placeholder="Name, city…"
            rightSlot={<Search className="size-4" />}
          />
          <Select
            label="Status"
            options={STATUS}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
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
          icon={Users}
          title="No developers found"
          description="Try adjusting the filters."
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((inc) => (
            <Link
              key={inc.id}
              href={`/admin/incorporadoras/${inc.id}`}
              className="group flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-dark-600 bg-dark-900/50 p-4 transition hover:border-purple-500/40"
            >
              <div className="flex items-center gap-3">
                {inc.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={inc.logo_url}
                    alt={inc.razao_social}
                    className="size-11 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex size-11 items-center justify-center rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-300">
                    <Users className="size-5" />
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-white group-hover:text-orange-300">
                    {inc.razao_social}
                  </p>
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-gray-500">
                    {inc.municipio} · {inc.uf} ·{" "}
                    {inc.iso_9001_certificada ? "ISO 9001" : ""}
                    {inc.pbqp_h_nivel ? ` · PBQP-H ${inc.pbqp_h_nivel}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-right">
                <div className="hidden sm:block">
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-gray-500">
                    Delivered VGV
                  </p>
                  <p className="font-heading text-sm font-semibold text-white tabular-nums">
                    {formatUsdc(inc.vgv_total_entregue_brl, { compact: true })}
                  </p>
                </div>
                {inc.data_submissao && (
                  <p className="hidden font-mono text-[10px] uppercase tracking-[0.18em] text-gray-500 sm:block">
                    Submitted
                    <br />
                    {formatDate(inc.data_submissao)}
                  </p>
                )}
                <IncorporatorStatusBadge status={inc.status} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
