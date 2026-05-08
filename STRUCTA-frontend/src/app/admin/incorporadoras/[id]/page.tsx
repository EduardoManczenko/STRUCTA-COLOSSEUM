"use client";

import Link from "next/link";
import { useEffect, useState, use } from "react";
import {
  ArrowLeft,
  Award,
  Building2,
  CheckCircle2,
  Mail,
  MapPin,
  Phone,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { Empty } from "@/components/ui/Empty";
import {
  IncorporatorStatusBadge,
  DevelopmentStatusBadge,
} from "@/components/ui/StatusBadge";
import { apiGet, apiPost } from "@/lib/api";
import { formatDate, formatUsdc } from "@/lib/format";
import type { DevelopmentStatus } from "@/lib/types";

interface IncDetail {
  id: string;
  razao_social: string;
  nome_fantasia: string | null;
  cnpj: string;
  endereco_sede: string;
  municipio: string;
  uf: string;
  site: string | null;
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
  iso_9001_organismo: string | null;
  pbqp_h_nivel: "A" | "B" | null;
  pbqp_h_numero: string | null;
  pbqp_h_validade: string | null;
  representante_nome: string;
  representante_cpf: string;
  representante_cargo: string;
  status: "pendente" | "aprovada" | "recusada" | "suspensa";
  status_reason: string | null;
  data_submissao: string;
  reviewed_at: string | null;
  developments: Array<{
    id: string;
    nome: string;
    status: DevelopmentStatus;
    captacao_target_brl: number;
    amount_raised_usdc: number;
    created_at: string;
  }>;
}

export default function AdminIncorporatorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [inc, setInc] = useState<IncDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);
  const [modalOpen, setModalOpen] = useState<"approve" | "reject" | null>(null);
  const [reason, setReason] = useState("");

  async function load() {
    try {
      const data = await apiGet<IncDetail>(`/admin/incorporators/${id}`);
      setInc(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function review(approved: boolean) {
    setReviewing(true);
    try {
      await apiPost(`/admin/incorporators/${id}/review`, {
        approved,
        reason: reason.trim() || undefined,
      });
      toast.success(approved ? "Developer approved" : "Developer rejected");
      setModalOpen(null);
      setReason("");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to review");
    } finally {
      setReviewing(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-40 rounded-lg" />
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-60 rounded-2xl" />
      </div>
    );
  }
  if (!inc) {
    return (
      <Empty
        icon={Building2}
        title="Not found"
        description="This developer is not available."
      />
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href="/admin/incorporadoras"
        className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-gray-400 transition hover:text-orange-400"
      >
        <ArrowLeft className="size-3.5" />
        Back
      </Link>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>{inc.razao_social}</CardTitle>
            {inc.nome_fantasia && (
              <p className="mt-1 text-sm text-gray-400">{inc.nome_fantasia}</p>
            )}
          </div>
          <IncorporatorStatusBadge status={inc.status} />
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <Field label="CNPJ" value={inc.cnpj} />
          <Field
            label="Headquarters"
            value={`${inc.endereco_sede}, ${inc.municipio} · ${inc.uf}`}
            icon={MapPin}
          />
          <Field
            label="Business email"
            value={inc.email_comercial}
            icon={Mail}
          />
          <Field label="Phone" value={inc.telefone} icon={Phone} />
          <Field label="Website" value={inc.site ?? "—"} />
          <Field
            label="Submitted"
            value={formatDate(inc.data_submissao)}
          />
        </CardContent>
        {inc.status === "pendente" && (
          <CardContent className="flex flex-wrap gap-3 border-t border-dark-700 pt-4">
            <Button
              variant="primary"
              leftIcon={<CheckCircle2 className="size-4" />}
              onClick={() => setModalOpen("approve")}
            >
              Approve
            </Button>
            <Button
              variant="danger"
              leftIcon={<XCircle className="size-4" />}
              onClick={() => setModalOpen("reject")}
            >
              Reject
            </Button>
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Track record</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <Field label="Founded" value={String(inc.ano_fundacao)} />
          <Field
            label="Delivered projects"
            value={String(inc.empreendimentos_entregues)}
          />
          <Field
            label="Total delivered VGV"
            value={formatUsdc(inc.vgv_total_entregue_brl, { compact: true })}
          />
          <Field
            label="Operating states"
            value={inc.estados_atuacao.join(", ")}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Certifications</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Cert
            label="ISO 9001"
            ok={inc.iso_9001_certificada}
            number={inc.iso_9001_numero}
            validity={inc.iso_9001_validade}
            organism={inc.iso_9001_organismo}
          />
          <Cert
            label={inc.pbqp_h_nivel ? `PBQP-H Level ${inc.pbqp_h_nivel}` : "PBQP-H"}
            ok={!!inc.pbqp_h_nivel}
            number={inc.pbqp_h_numero}
            validity={inc.pbqp_h_validade}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact & representative</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Field label="Main contact" value={inc.responsavel_nome} />
          <Field label="Title" value={inc.responsavel_cargo} />
          <Field label="Email" value={inc.responsavel_email} icon={Mail} />
          <Field label="WhatsApp" value={inc.responsavel_whatsapp} icon={Phone} />
          <Field label="Legal representative" value={inc.representante_nome} />
          <Field label="CPF" value={inc.representante_cpf} />
          <Field label="Role" value={inc.representante_cargo} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Projects</CardTitle>
        </CardHeader>
        <CardContent>
          {inc.developments.length === 0 ? (
            <Empty
              icon={Building2}
              title="No projects yet"
              description="This developer has not submitted any projects."
            />
          ) : (
            <ul className="space-y-2">
              {inc.developments.map((d) => (
                <Link
                  key={d.id}
                  href={`/admin/empreendimentos/${d.id}`}
                  className="group flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dark-600 bg-dark-900/40 p-3 transition hover:border-orange-500/40"
                >
                  <div>
                    <p className="text-sm text-white group-hover:text-orange-300">
                      {d.nome}
                    </p>
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-gray-500">
                      {formatDate(d.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-heading text-sm font-semibold text-white tabular-nums">
                      {formatUsdc(d.captacao_target_brl, { compact: true })}
                    </span>
                    <DevelopmentStatusBadge status={d.status} />
                  </div>
                </Link>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Modal
        open={modalOpen !== null}
        onClose={() => setModalOpen(null)}
        title={
          modalOpen === "approve"
            ? "Approve developer"
            : "Reject developer"
        }
        size="md"
      >
        <p className="text-sm text-gray-400">
          {modalOpen === "approve"
            ? "Once approved, the developer will be able to log in and submit projects."
            : "The developer will be notified of the rejection reason."}
        </p>
        <div className="mt-4">
          <Textarea
            label={modalOpen === "approve" ? "Notes (optional)" : "Reason (required)"}
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required={modalOpen === "reject"}
          />
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setModalOpen(null)}>
            Cancel
          </Button>
          {modalOpen === "approve" ? (
            <Button onClick={() => review(true)} loading={reviewing}>
              Confirm approval
            </Button>
          ) : (
            <Button
              variant="danger"
              onClick={() => review(false)}
              loading={reviewing}
              disabled={!reason.trim()}
            >
              Confirm rejection
            </Button>
          )}
        </div>
      </Modal>
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

function Cert({
  label,
  ok,
  number,
  validity,
  organism,
}: {
  label: string;
  ok: boolean;
  number: string | null;
  validity: string | null;
  organism?: string | null;
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
          <p>Expiry: {validity ? formatDate(validity) : "—"}</p>
          {organism !== undefined && <p>Body: {organism ?? "—"}</p>}
        </div>
      ) : (
        <p className="mt-2 text-[12px] text-gray-500">Not certified</p>
      )}
    </div>
  );
}
