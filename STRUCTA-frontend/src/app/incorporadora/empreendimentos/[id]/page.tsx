"use client";

import Link from "next/link";
import { useEffect, useState, use } from "react";
import {
  ArrowLeft,
  Building2,
  Coins,
  ExternalLink,
  FileText,
  Hash,
  Landmark,
  TrendingUp,
  Users,
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
import { ProgressBar } from "@/components/ui/ProgressBar";
import { DevelopmentStatusBadge } from "@/components/ui/StatusBadge";
import { StatCard } from "@/components/dashboard/StatCard";
import { apiGet } from "@/lib/api";
import {
  formatDate,
  formatNumber,
  formatPercent,
  formatUsdc,
  pct,
  shortAddress,
} from "@/lib/format";
import type {
  DevelopmentDetail,
  DevelopmentDocument,
  DevelopmentImage,
} from "@/lib/types";

interface IncorporatorDevDetail extends DevelopmentDetail {
  status_reason: string | null;
  approved_at: string | null;
  purchases?: Array<{
    id: string;
    cotas_amount: number;
    total_usdc: number;
    created_at: string;
    investor: { wallet_address: string } | null;
  }>;
}

export default function IncorporatorDevelopmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [dev, setDev] = useState<IncorporatorDevDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const data = await apiGet<IncorporatorDevDetail>(`/developments/${id}`);
        if (alive) setDev(data);
      } catch (err) {
        if (!alive) return;
        // Only show user-friendly toast for unexpected errors
        const msg =
          err instanceof Error && err.message
            ? err.message.toLowerCase().includes("requires role") ||
              err.message.toLowerCase().includes("forbidden") ||
              err.message.toLowerCase().includes("not found")
              ? null
              : "Could not load this project right now."
            : "Could not load this project right now.";
        if (msg) toast.error(msg);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }
  if (!dev) {
    return (
      <Empty
        icon={Building2}
        title="Project not found"
        description="The requested project is not available."
      />
    );
  }

  const target = Number(dev.captacao_target_brl ?? 0);
  const raised = Number(dev.amount_raised_usdc ?? 0);
  const filledPct = pct(raised * 5, target);
  const isApproved = [
    "aprovado",
    "venda_aberta",
    "em_construcao",
    "distribuindo_yield",
    "aguardando_burn",
    "finalizado",
  ].includes(dev.status);
  const totalCotasSold = (dev.purchases ?? []).reduce(
    (s, p) => s + Number(p.cotas_amount ?? 0),
    0,
  );
  const totalUsdcRaised = (dev.purchases ?? []).reduce(
    (s, p) => s + Number(p.total_usdc ?? 0),
    0,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/incorporadora/empreendimentos"
          className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-gray-400 transition hover:text-orange-400"
        >
          <ArrowLeft className="size-3.5" />
          My projects
        </Link>
        {dev.slug && (
          <Link href={`/empreendimentos/${dev.slug}`} target="_blank">
            <Button
              size="sm"
              variant="secondary"
              rightIcon={<ExternalLink className="size-4" />}
            >
              View public page
            </Button>
          </Link>
        )}
      </div>

      <Card className="overflow-hidden">
        <div className="relative aspect-[16/6] bg-dark-700">
          {dev.cover_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={dev.cover_image_url}
              alt={dev.nome}
              className="size-full object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center bg-gradient-to-br from-purple-900/30 via-dark-700 to-orange-900/20">
              <Building2 className="size-16 text-purple-400/50" />
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-dark-900/95 to-transparent p-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h1 className="font-heading text-2xl font-bold text-white sm:text-3xl">
                  {dev.nome_comercial ?? dev.nome}
                </h1>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-gray-300">
                  {dev.municipio} · {dev.uf} · {formatNumber(dev.numero_unidades, 0)}{" "}
                  unit{dev.numero_unidades > 1 ? "s" : ""}
                </p>
              </div>
              <DevelopmentStatusBadge status={dev.status} />
            </div>
          </div>
        </div>
        {dev.status === "recusado" && dev.status_reason && (
          <div className="border-t border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
            <strong className="text-white">Rejection reason:</strong>{" "}
            {dev.status_reason}
          </div>
        )}
        {dev.status === "pendente" && (
          <div className="border-t border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
            Your proposal is under review. You will be notified by email when a
            decision is made.
          </div>
        )}
      </Card>

      {isApproved && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Fundraising target"
            value={formatUsdc(target, { compact: true })}
            icon={TrendingUp}
            tone="orange"
            index={0}
          />
          <StatCard
            label="Raised (USDC)"
            value={formatUsdc(raised, { compact: true })}
            hint={`${filledPct.toFixed(0)}% of target`}
            tone="emerald"
            index={1}
          />
          <StatCard
            label="Shares sold"
            value={formatNumber(totalCotasSold, 0)}
            hint={
              dev.token_supply
                ? `of ${formatNumber(dev.token_supply, 0)} shares (${pct(totalCotasSold, dev.token_supply).toFixed(1)}%)`
                : ""
            }
            icon={Coins}
            tone="purple"
            index={2}
          />
          <StatCard
            label="Investors"
            value={String(
              new Set(
                (dev.purchases ?? []).map((p) => p.investor?.wallet_address),
              ).size,
            )}
            hint="Unique wallets"
            icon={Users}
            tone="sky"
            index={3}
          />
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Fundraising</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ProgressBar value={filledPct} height={8} />
          <div className="grid gap-2 text-sm sm:grid-cols-3">
            <Field label="Fundraising target" value={formatUsdc(target)} />
            <Field
              label="Raised"
              value={`${formatUsdc(raised)} (${formatUsdc(totalUsdcRaised)} on-chain)`}
            />
            <Field
              label="Fundraising period"
              value={`${dev.prazo_captacao_dias} days`}
            />
          </div>
        </CardContent>
      </Card>

      {isApproved && (
        <Card>
          <CardHeader>
            <CardTitle>Tokenomics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Token" value={dev.token_symbol ?? "—"} />
              <Field
                label="Supply"
                value={dev.token_supply ? formatNumber(dev.token_supply, 0) : "—"}
              />
              <Field
                label="Price per share"
                value={formatUsdc(dev.token_price_usdc)}
              />
              <Field
                label="Target APY"
                value={formatPercent(dev.yield_apy_percent ?? 0, 2)}
              />
              <Field
                label="Frequency"
                value={dev.yield_periodicidade ?? "—"}
              />
              <Field
                label="Total term"
                value={
                  dev.prazo_total_token_meses
                    ? `${dev.prazo_total_token_meses} months`
                    : "—"
                }
              />
            </div>
          </CardContent>
        </Card>
      )}

      {(dev.images?.length ?? 0) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Gallery</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {dev.images?.map((img: DevelopmentImage) => (
                <a
                  key={img.id}
                  href={img.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block overflow-hidden rounded-xl border border-dark-600 bg-dark-900"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={img.caption ?? "Image"}
                    className="aspect-[4/3] w-full object-cover transition hover:scale-105"
                  />
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {(dev.documents?.length ?? 0) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {dev.documents?.map((doc: DevelopmentDocument) => (
                <li
                  key={doc.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-dark-600 bg-dark-900/40 p-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-300">
                      <FileText className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm text-white">
                        {doc.label ?? doc.filename}
                      </p>
                      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-gray-500">
                        {doc.type} · {(doc.size_bytes / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-purple-300">
                    {doc.sha256_hash ? shortAddress(doc.sha256_hash, 4) : "—"}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {isApproved && (
        <Card>
          <CardHeader>
            <CardTitle>Smart contracts</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Address label="Cota Mint (SPL Token)" value={dev.cota_mint_address} />
            <Address label="Vault Principal" value={dev.vault_principal_address} />
            <Address label="Vault Yield" value={dev.vault_yield_address} />
            <Address label="Burn Pool" value={dev.burn_pool_address} />
          </CardContent>
        </Card>
      )}

      {isApproved && (
        <Card>
          <CardHeader>
          <CardTitle>Share purchases</CardTitle>
        </CardHeader>
        <CardContent>
            {(dev.purchases?.length ?? 0) === 0 ? (
              <Empty
                icon={Coins}
                title="No shares sold yet"
                description="Purchases will appear here once investors start depositing USDC."
              />
            ) : (
              <ul className="divide-y divide-dark-700 overflow-hidden rounded-xl border border-dark-600">
                {dev.purchases?.map((p) => (
                  <li
                    key={p.id}
                    className="flex flex-wrap items-center justify-between gap-3 bg-dark-900/40 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm text-white">
                        {formatNumber(p.cotas_amount, 0)} shares
                      </p>
                      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-gray-500">
                        {formatDate(p.created_at)} ·{" "}
                        {p.investor?.wallet_address
                          ? shortAddress(p.investor.wallet_address, 6)
                          : "—"}
                      </p>
                    </div>
                    <span className="font-heading text-sm font-semibold text-white tabular-nums">
                      {formatUsdc(p.total_usdc)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-dark-600 bg-dark-900/40 p-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-gray-500">
        {label}
      </p>
      <p className="mt-0.5 text-sm text-white">{value}</p>
    </div>
  );
}

function Address({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div className="rounded-xl border border-dark-600 bg-dark-900/40 p-3">
      <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-gray-500">
        <Hash className="size-3" />
        {label}
      </p>
      {value ? (
        <code className="mt-1 block truncate font-mono text-[12px] text-purple-300">
          {value}
        </code>
      ) : (
        <p className="mt-1 inline-flex items-center gap-1.5 text-[12px] text-gray-500">
          <Landmark className="size-3" />
          Pending approval
        </p>
      )}
    </div>
  );
}
