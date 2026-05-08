"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Building2, ChevronRight, Inbox, Users } from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Empty } from "@/components/ui/Empty";
import { apiGet } from "@/lib/api";
import { formatDate, formatUsdc } from "@/lib/format";
import type {
  DevelopmentListItem,
  IncorporatorListItem,
} from "@/lib/types";

export default function AdminApprovalsPage() {
  const [devs, setDevs] = useState<DevelopmentListItem[]>([]);
  const [incs, setIncs] = useState<(IncorporatorListItem & { data_submissao?: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const [d, i] = await Promise.all([
          apiGet<DevelopmentListItem[]>("/admin/developments?status=pendente"),
          apiGet<IncorporatorListItem[]>("/admin/incorporators?status=pendente"),
        ]);
        if (!alive) return;
        setDevs(d ?? []);
        setIncs(i ?? []);
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
          <CardTitle>Pending projects ({devs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-20 rounded-xl" />
          ) : devs.length === 0 ? (
            <Empty
              icon={Inbox}
              title="No pending projects"
              description="All submissions have been processed."
            />
          ) : (
            <ul className="space-y-2">
              {devs.map((d) => (
                <Link
                  key={d.id}
                  href={`/admin/empreendimentos/${d.id}`}
                  className="group flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dark-600 bg-dark-900/40 p-3 transition hover:border-orange-500/40"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-300">
                      <Building2 className="size-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {d.nome_comercial ?? d.nome}
                      </p>
                      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-gray-500">
                        {d.incorporator?.razao_social} · {d.municipio} · {d.uf}{" "}
                        · target {formatUsdc(d.captacao_target_brl, { compact: true })}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="size-4 text-gray-500 transition group-hover:text-orange-300" />
                </Link>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pending developers ({incs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-20 rounded-xl" />
          ) : incs.length === 0 ? (
            <Empty
              icon={Inbox}
              title="No pending developers"
              description="All submissions have been processed."
            />
          ) : (
            <ul className="space-y-2">
              {incs.map((inc) => (
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
                        className="size-10 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex size-10 items-center justify-center rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-300">
                        <Users className="size-5" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {inc.razao_social}
                      </p>
                      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-gray-500">
                        {inc.municipio} · {inc.uf}{" "}
                        {inc.data_submissao
                          ? `· submitted ${formatDate(inc.data_submissao)}`
                          : ""}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="size-4 text-gray-500 transition group-hover:text-purple-300" />
                </Link>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
