"use client";

import { useEffect, useState } from "react";
import {
  Award,
  Building2,
  CheckCircle2,
  Mail,
  MapPin,
  Phone,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Empty } from "@/components/ui/Empty";
import { IncorporatorStatusBadge } from "@/components/ui/StatusBadge";
import { apiGet } from "@/lib/api";
import { formatDate, formatUsdc } from "@/lib/format";

interface IncorporatorMe {
  id: string;
  razao_social: string;
  nome_fantasia: string | null;
  cnpj: string;
  endereco_sede: string;
  municipio: string;
  uf: string;
  site: string | null;
  social_media: string | null;
  email_comercial: string;
  telefone: string;
  responsavel_nome: string;
  responsavel_cargo: string;
  responsavel_email: string;
  responsavel_whatsapp: string;
  ano_fundacao: number;
  empreendimentos_entregues: number;
  vgv_total_entregue_brl: number;
  estados_atuacao: string[];
  iso_9001_certificada: boolean;
  iso_9001_numero: string | null;
  iso_9001_validade: string | null;
  pbqp_h_nivel: "A" | "B" | null;
  pbqp_h_numero: string | null;
  pbqp_h_validade: string | null;
  status: "pendente" | "aprovada" | "recusada" | "suspensa";
  status_reason: string | null;
  data_submissao: string;
  reviewed_at: string | null;
}

export default function IncorporatorProfilePage() {
  const [me, setMe] = useState<IncorporatorMe | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const data = await apiGet<IncorporatorMe | null>("/incorporators/me");
        setMe(data);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-60 rounded-2xl" />
      </div>
    );
  }
  if (!me) {
    return (
      <Empty
        icon={Building2}
        title="Registration not found"
        description="We could not find your developer company."
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>{me.razao_social}</CardTitle>
            {me.nome_fantasia && (
              <p className="mt-1 text-sm text-gray-400">{me.nome_fantasia}</p>
            )}
          </div>
          <IncorporatorStatusBadge status={me.status} />
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <Field label="CNPJ" value={me.cnpj} />
          <Field
            label="Headquarters"
            value={`${me.endereco_sede}, ${me.municipio} · ${me.uf}`}
            icon={MapPin}
          />
          <Field label="Founded in" value={String(me.ano_fundacao)} />
          <Field label="Commercial" value={me.email_comercial} icon={Mail} />
          <Field label="Phone" value={me.telefone} icon={Phone} />
          <Field label="Site" value={me.site ?? "—"} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Track record</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <Field
            label="Completed projects"
            value={String(me.empreendimentos_entregues)}
          />
          <Field
            label="Total delivered VGV"
            value={formatUsdc(me.vgv_total_entregue_brl, { compact: true })}
          />
          <Field
            label="Operating states"
            value={me.estados_atuacao.join(", ")}
          />
          <Field
            label="Submission"
            value={formatDate(me.data_submissao)}
          />
          {me.reviewed_at && (
            <Field
              label="Review"
              value={formatDate(me.reviewed_at)}
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Certifications</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <CertCard
            label="ISO 9001"
            ok={me.iso_9001_certificada}
            number={me.iso_9001_numero}
            validity={me.iso_9001_validade}
          />
          <CertCard
            label={me.pbqp_h_nivel ? `PBQP-H Level ${me.pbqp_h_nivel}` : "PBQP-H"}
            ok={!!me.pbqp_h_nivel}
            number={me.pbqp_h_numero}
            validity={me.pbqp_h_validade}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact person</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Field label="Name" value={me.responsavel_nome} />
          <Field label="Title" value={me.responsavel_cargo} />
          <Field label="E-mail" value={me.responsavel_email} icon={Mail} />
          <Field label="WhatsApp" value={me.responsavel_whatsapp} icon={Phone} />
        </CardContent>
      </Card>

      {me.status_reason && (
        <Card
          className={
            me.status === "recusada"
              ? "border-rose-500/30 bg-rose-500/5"
              : "border-amber-500/30 bg-amber-500/5"
          }
        >
          <CardContent className="flex items-start gap-3 pt-5">
            {me.status === "recusada" ? (
              <XCircle className="size-5 text-rose-300" />
            ) : (
              <ShieldAlert className="size-5 text-amber-300" />
            )}
            <div>
              <p className="text-sm font-semibold text-white">
                Message from Structa
              </p>
              <p className="mt-1 text-sm text-gray-300">{me.status_reason}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: typeof Building2;
}) {
  return (
    <div className="rounded-xl border border-dark-600 bg-dark-900/40 p-3">
      <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-gray-500">
        {Icon && <Icon className="size-3" />}
        {label}
      </p>
      <p className="mt-1 text-sm text-white">{value}</p>
    </div>
  );
}

function CertCard({
  label,
  ok,
  number,
  validity,
}: {
  label: string;
  ok: boolean;
  number: string | null;
  validity: string | null;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        ok
          ? "border-emerald-500/30 bg-emerald-500/5"
          : "border-dark-600 bg-dark-900/40"
      }`}
    >
      <div className="flex items-center gap-2">
        {ok ? (
          <CheckCircle2 className="size-5 text-emerald-300" />
        ) : (
          <Award className="size-5 text-gray-500" />
        )}
        <p className="font-heading text-base font-semibold text-white">
          {label}
        </p>
      </div>
      {ok ? (
        <div className="mt-2 grid gap-1 text-[12px] text-gray-300">
          <p>No.: {number ?? "—"}</p>
          <p>Validity: {validity ? formatDate(validity) : "—"}</p>
        </div>
      ) : (
        <p className="mt-2 text-[12px] text-gray-500">Not certified</p>
      )}
    </div>
  );
}
