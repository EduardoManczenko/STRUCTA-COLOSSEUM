"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FileText, Building2, ExternalLink } from "lucide-react";
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
import { formatDate } from "@/lib/format";
import type { DevelopmentDetail, DevelopmentDocument } from "@/lib/types";

export default function IncorporatorDocumentsPage() {
  const [items, setItems] = useState<DevelopmentDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const list = await apiGet<{ id: string }[]>("/developments/mine");
        const detailed = await Promise.all(
          (list ?? []).map((d) => apiGet<DevelopmentDetail>(`/developments/${d.id}`)),
        );
        if (alive) setItems(detailed);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erro ao carregar");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <Empty
        icon={FileText}
        title="Sem documentos"
        description="Register your first project to attach documentation."
      />
    );
  }

  return (
    <div className="space-y-6">
      {items.map((dev) => (
        <Card key={dev.id}>
          <CardHeader>
            <div>
              <CardTitle>{dev.nome_comercial ?? dev.nome}</CardTitle>
              <p className="mt-1 text-sm text-gray-400">
                {(dev.documents?.length ?? 0)} documento(s) anexado(s)
              </p>
            </div>
            <Link href={`/incorporadora/empreendimentos/${dev.id}`}>
              <span className="inline-flex items-center gap-1.5 rounded-md border border-purple-500/40 bg-purple-500/10 px-2.5 py-1 text-[11px] font-semibold text-purple-200 hover:bg-purple-500/15">
                <Building2 className="size-3" />
                Ver empreendimento
              </span>
            </Link>
          </CardHeader>
          <CardContent>
            {(dev.documents?.length ?? 0) === 0 ? (
              <Empty
                icon={FileText}
                title="Nenhum documento"
                description="Attached documents will appear here."
              />
            ) : (
              <ul className="divide-y divide-dark-700 overflow-hidden rounded-xl border border-dark-600">
                {dev.documents?.map((doc: DevelopmentDocument) => (
                  <li
                    key={doc.id}
                    className="flex items-center justify-between gap-3 bg-dark-900/40 px-4 py-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <FileText className="size-4 text-purple-300" />
                      <div className="min-w-0">
                        <p className="truncate text-sm text-white">
                          {doc.label ?? doc.filename}
                        </p>
                        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-gray-500">
                          {doc.type} ·{" "}
                          {(doc.size_bytes / 1024).toFixed(0)} KB ·{" "}
                          {formatDate(doc.created_at)}
                        </p>
                      </div>
                    </div>
                    <ExternalLink className="size-4 text-gray-500" />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
