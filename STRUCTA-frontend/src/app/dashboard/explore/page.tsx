"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Award,
  Building2,
  Calendar,
  CheckCircle2,
  Coins,
  Database,
  ExternalLink,
  FileText,
  Hash,
  Landmark,
  Loader2,
  MapPin,
  Receipt,
  Search,
  Shield,
  TrendingUp,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Badge, DevelopmentStatusBadge } from "@/components/ui/StatusBadge";
import { Empty } from "@/components/ui/Empty";
import { Skeleton } from "@/components/ui/Skeleton";
import { BuyCotaModal } from "@/components/purchase/BuyCotaModal";
import { ConnectWalletButton } from "@/components/wallet/ConnectWalletButton";
import { useAuth } from "@/components/providers/AuthProvider";
import { apiGet } from "@/lib/api";
import {
  formatDate,
  formatDateLong,
  formatNumber,
  formatPercent,
  formatUsdc,
  pct,
  shortAddress,
} from "@/lib/format";
import type { DevelopmentDetail, DevelopmentListItem } from "@/lib/types";

/* ─── constants ─────────────────────────────────────────────── */

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "venda_aberta", label: "Sale open" },
  { value: "aprovado", label: "Coming soon" },
  { value: "em_construcao", label: "Under construction" },
  { value: "distribuindo_yield", label: "Distributing yield" },
  { value: "aguardando_burn", label: "Awaiting redemption" },
  { value: "finalizado", label: "Completed" },
];

const TYPE_LABEL: Record<string, string> = {
  residencial_vertical: "Residential vertical",
  residencial_horizontal: "Residential horizontal",
  misto: "Mixed use",
  comercial: "Commercial",
};

const PERIODICITY_LABEL: Record<string, string> = {
  mensal: "Monthly",
  trimestral: "Quarterly",
  semestral: "Semi-annual",
  anual: "Annual",
};

const SALE_STATE_LABEL: Record<string, string> = {
  aprovado: "Coming soon · awaiting sale launch",
  em_construcao: "Sale closed · under construction",
  distribuindo_yield: "Distributing yield · sale closed",
  aguardando_burn: "Redemption available",
  finalizado: "Project completed",
  cancelado: "Project cancelled",
};

/* ─── page ───────────────────────────────────────────────────── */

export default function ExplorePage() {
  const { user } = useAuth();
  const isInvestor = user?.role === "investor";

  const [items, setItems] = useState<DevelopmentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<DevelopmentDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [buyOpen, setBuyOpen] = useState(false);
  const detailRef = useRef<HTMLDivElement>(null);

  /* fetch list */
  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (status) params.set("status", status);
        params.set("limit", "80");
        const data = await apiGet<DevelopmentListItem[]>(
          `/public/developments?${params.toString()}`,
          { noAuth: true },
        );
        if (!alive) return;
        setItems(data ?? []);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [status]);

  /* fetch detail when selection changes */
  useEffect(() => {
    if (!selectedId) { setDetail(null); return; }
    let alive = true;
    void (async () => {
      setLoadingDetail(true);
      try {
        const data = await apiGet<DevelopmentDetail>(
          `/public/developments/${selectedId}`,
          { noAuth: true },
        );
        if (!alive) return;
        setDetail(data);
        // scroll detail pane to top
        detailRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load detail");
      } finally {
        if (alive) setLoadingDetail(false);
      }
    })();
    return () => { alive = false; };
  }, [selectedId]);

  const filtered = useMemo(() => {
    if (!q) return items;
    const term = q.toLowerCase();
    return items.filter((i) =>
      [i.nome, i.nome_comercial, i.municipio, i.uf, i.token_symbol,
        i.incorporator?.razao_social, i.incorporator?.nome_fantasia]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term)),
    );
  }, [items, q]);

  const target = Number(detail?.captacao_target_brl ?? 0);
  const raised = Number(detail?.amount_raised_usdc ?? 0);
  const filledPct = pct(raised * 5, target);

  return (
    /* negative margin to bleed to shell edges, then restore horizontal padding internally */
    <div className="-mx-4 -mt-2 flex flex-col md:flex-row md:h-[calc(100dvh-148px)] md:gap-0 md:overflow-hidden sm:-mx-6 md:-mx-10">

      {/* ── LEFT: list (hidden on mobile when detail is open) ─── */}
      <div
        className={`flex flex-col border-dark-700/80 md:w-72 md:shrink-0 md:border-r xl:md:w-80 ${
          selectedId ? "hidden md:flex" : "flex"
        }`}
      >
        {/* filters */}
        <div className="shrink-0 space-y-2 border-b border-dark-700/80 p-3">
          <Input
            placeholder="Search properties…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            rightSlot={<Search className="size-3.5 text-gray-500" />}
          />
          <Select
            options={STATUS_OPTIONS}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          />
        </div>

        {/* cards */}
        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-[104px] rounded-xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <Empty icon={Building2} title="No projects" description="Adjust filters." />
          ) : (
            <div className="space-y-1.5">
              {filtered.map((dev) => (
                <ExploreListCard
                  key={dev.id}
                  dev={dev}
                  selected={selectedId === dev.id}
                  onClick={() => setSelectedId(dev.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT: detail (full-screen on mobile when selected) ─ */}
      <div
        ref={detailRef}
        className={`flex-1 overflow-y-auto md:block ${
          selectedId ? "block" : "hidden md:block"
        }`}
      >
        {!selectedId ? (
          <div className="hidden h-full flex-col items-center justify-center gap-4 px-8 text-center md:flex">
            <div className="flex size-16 items-center justify-center rounded-2xl border border-dark-600 bg-dark-800">
              <Building2 className="size-7 text-purple-400/60" />
            </div>
            <div>
              <p className="font-heading text-lg font-bold text-white">
                Select a property
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Click any project on the left to explore its details and invest.
              </p>
            </div>
          </div>
        ) : loadingDetail ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="size-8 animate-spin text-purple-400" />
          </div>
        ) : detail ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={detail.id}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.25 }}
              className="p-5 xl:p-8"
            >
              {/* header */}
              <button
                onClick={() => setSelectedId(null)}
                className="mb-4 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-gray-500 transition hover:text-orange-400"
              >
                <ArrowLeft className="size-3" /> Back to list
              </button>

              <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
                {/* left col: image + info sections */}
                <div className="space-y-5">
                  {/* hero image */}
                  <div className="overflow-hidden rounded-2xl border border-dark-600">
                    {detail.cover_image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={detail.cover_image_url}
                        alt={detail.nome}
                        className="aspect-[16/7] w-full object-cover"
                      />
                    ) : (
                      <div className="flex aspect-[16/7] items-center justify-center bg-gradient-to-br from-purple-900/30 via-dark-700 to-orange-900/20">
                        <Building2 className="size-10 text-purple-400/50" />
                      </div>
                    )}
                  </div>

                  {/* title */}
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <DevelopmentStatusBadge status={detail.status} />
                      <Badge tone="purple">{TYPE_LABEL[detail.tipo]}</Badge>
                      {detail.token_symbol && (
                        <Badge tone="orange">
                          <Coins className="size-3" />
                          {detail.token_symbol}
                        </Badge>
                      )}
                    </div>
                    <h2 className="mt-3 font-heading text-2xl font-bold text-white xl:text-3xl">
                      {detail.nome_comercial ?? detail.nome}
                    </h2>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-400">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="size-3.5 text-purple-400" />
                        {detail.endereco_terreno}, {detail.municipio} · {detail.uf}
                      </span>
                      {detail.previsao_habite_se && (
                        <span className="flex items-center gap-1.5">
                          <Calendar className="size-3.5 text-purple-400" />
                          Occupancy permit: {formatDateLong(detail.previsao_habite_se)}
                        </span>
                      )}
                    </div>
                    {detail.description && (
                      <p className="mt-3 text-[14px] leading-relaxed text-gray-400">
                        {detail.description}
                      </p>
                    )}
                  </div>

                  {/* property details */}
                  <PanelSection title="Property identification" icon={Building2}>
                    <PRow label="Name" value={detail.nome} />
                    {detail.nome_comercial && <PRow label="Commercial name" value={detail.nome_comercial} />}
                    <PRow label="Type" value={TYPE_LABEL[detail.tipo]} />
                    <PRow label="Address" value={detail.endereco_terreno} />
                    <PRow label="City / State" value={`${detail.municipio} · ${detail.uf}`} />
                    <PRow label="ZIP" value={detail.cep} />
                    {detail.area_terreno_m2 && (
                      <PRow label="Land area" value={`${formatNumber(detail.area_terreno_m2)} m²`} />
                    )}
                    {detail.area_construida_total_m2 && (
                      <PRow label="Built area" value={`${formatNumber(detail.area_construida_total_m2)} m²`} />
                    )}
                    <PRow
                      label="Units"
                      value={`${detail.numero_unidades} ${detail.numero_unidades > 1 ? "units" : "unit"}${detail.padrao ? ` · ${detail.padrao}` : ""}`}
                    />
                    {detail.previsao_inicio_obra && (
                      <PRow label="Construction start" value={formatDateLong(detail.previsao_inicio_obra)} />
                    )}
                    {detail.previsao_habite_se && (
                      <PRow label="Expected occupancy permit" value={formatDateLong(detail.previsao_habite_se)} />
                    )}
                  </PanelSection>

                  <PanelSection title="SPE — Special Purpose Entity" icon={Landmark}>
                    <PRow label="Legal name" value={detail.spe_razao_social} />
                    <PRow label="CNPJ" value={detail.spe_cnpj} />
                    <PRow label="Incorporation date" value={formatDate(detail.spe_data_constituicao)} />
                    {detail.spe_nire && <PRow label="NIRE" value={detail.spe_nire} />}
                    {detail.spe_cartorio && (
                      <PRow
                        label="Registry office"
                        value={`${detail.spe_cartorio}${detail.spe_registro ? ` · No. ${detail.spe_registro}` : ""}`}
                      />
                    )}
                    <PRow
                      label="Earmarked equity"
                      value={detail.spe_patrimonio_afetacao ? "Yes" : "No"}
                      accent={detail.spe_patrimonio_afetacao ?? false}
                    />
                    <PRow
                      label="RET active"
                      value={detail.spe_ret_ativo ? "Yes" : "No"}
                      accent={detail.spe_ret_ativo ?? false}
                    />
                  </PanelSection>

                  <PanelSection title="Financials" icon={TrendingUp}>
                    <PRow label="GDV (VGV)" value={formatUsdc(detail.vgv_brl)} />
                    <PRow label="Total construction cost" value={formatUsdc(detail.custo_total_construcao_brl)} />
                    {detail.custo_terreno_brl && (
                      <PRow label="Land cost" value={formatUsdc(detail.custo_terreno_brl)} />
                    )}
                    {detail.bdi_percent && (
                      <PRow label="BDI applied" value={formatPercent(detail.bdi_percent)} />
                    )}
                    <PRow label="Fundraising target" value={formatUsdc(detail.captacao_target_brl)} accent />
                    <PRow label="Fundraising window" value={`${detail.prazo_captacao_dias} days`} />
                  </PanelSection>

                  {/* smart contracts */}
                  {(detail.cota_mint_address || detail.vault_principal_address) && (
                    <PanelSection title="Smart contracts (Solana)" icon={Database}>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <ContractRow label="Token mint" address={detail.cota_mint_address} />
                        <ContractRow label="Principal vault" address={detail.vault_principal_address} />
                        <ContractRow label="Yield vault" address={detail.vault_yield_address} />
                        <ContractRow label="Burn pool" address={detail.burn_pool_address} />
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge tone={detail.sale_open ? "emerald" : "gray"}>
                          {detail.sale_open ? "Sale open" : "Sale closed"}
                        </Badge>
                        <Badge tone={detail.burn_unlocked ? "emerald" : "gray"}>
                          {detail.burn_unlocked ? "Burn unlocked" : "Burn locked"}
                        </Badge>
                      </div>
                    </PanelSection>
                  )}

                  {/* developer */}
                  {detail.incorporator && (
                    <PanelSection title="Developer" icon={Building2}>
                      <div className="flex flex-wrap items-center gap-3">
                        {detail.incorporator.logo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={detail.incorporator.logo_url}
                            alt={detail.incorporator.razao_social}
                            className="size-12 rounded-xl border border-dark-600 object-cover"
                          />
                        ) : (
                          <div className="flex size-12 items-center justify-center rounded-xl border border-dark-600 bg-dark-900">
                            <Building2 className="size-5 text-purple-300" />
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="font-heading text-base font-bold text-white">
                            {detail.incorporator.nome_fantasia ?? detail.incorporator.razao_social}
                          </p>
                          <p className="text-[12px] text-gray-400">
                            {detail.incorporator.razao_social} · {detail.incorporator.municipio}/{detail.incorporator.uf}
                            {detail.incorporator.ano_fundacao ? ` · Est. ${detail.incorporator.ano_fundacao}` : ""}
                          </p>
                        </div>
                        {detail.incorporator.site && (
                          <a
                            href={detail.incorporator.site}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-[12px] text-orange-300 hover:text-orange-200"
                          >
                            Website <ExternalLink className="size-3" />
                          </a>
                        )}
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {detail.incorporator.empreendimentos_entregues != null && (
                          <MiniStat label="Completed projects" value={String(detail.incorporator.empreendimentos_entregues)} />
                        )}
                        {detail.incorporator.vgv_total_entregue_brl != null && (
                          <MiniStat label="Total GDV" value={formatUsdc(detail.incorporator.vgv_total_entregue_brl, { compact: true })} />
                        )}
                        {detail.incorporator.iso_9001_certificada != null && (
                          <MiniStat
                            label="ISO 9001"
                            value={detail.incorporator.iso_9001_certificada ? "Active" : "—"}
                            icon={Award}
                            accent={detail.incorporator.iso_9001_certificada}
                          />
                        )}
                        {detail.incorporator.pbqp_h_nivel != null && (
                          <MiniStat
                            label="PBQP-H"
                            value={detail.incorporator.pbqp_h_nivel ? `Level ${detail.incorporator.pbqp_h_nivel}` : "—"}
                            icon={Shield}
                            accent={!!detail.incorporator.pbqp_h_nivel}
                          />
                        )}
                      </div>
                    </PanelSection>
                  )}

                  {/* documents */}
                  {detail.documents && detail.documents.length > 0 && (
                    <PanelSection title="Legal documentation (on-chain hashes)" icon={FileText}>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {detail.documents.map((doc) => (
                          <div
                            key={doc.id}
                            className="flex items-start gap-2.5 rounded-xl border border-dark-600 bg-dark-900/40 p-2.5"
                          >
                            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-300">
                              <FileText className="size-3.5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[12px] font-semibold text-white">{doc.label ?? doc.type}</p>
                              <p className="truncate text-[10px] text-gray-500">{doc.filename}</p>
                              {doc.sha256_hash && (
                                <p className="mt-1 flex items-center gap-1 font-mono text-[9px] text-gray-600">
                                  <Hash className="size-2.5" />
                                  <span className="truncate">{doc.sha256_hash}</span>
                                </p>
                              )}
                            </div>
                            <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-400" />
                          </div>
                        ))}
                      </div>
                    </PanelSection>
                  )}
                </div>

                {/* right col: investment card */}
                <div className="lg:sticky lg:top-0 lg:self-start">
                  <Card className="overflow-hidden">
                    <div className="border-b border-dark-700 bg-gradient-to-br from-purple-500/10 via-transparent to-orange-500/10 p-4">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-orange-400">
                          Fundraising
                        </span>
                        <DevelopmentStatusBadge status={detail.status} />
                      </div>
                      <div className="mt-2 font-heading text-2xl font-bold tabular-nums text-white">
                        {formatUsdc(target)}
                      </div>
                      <div className="mt-0.5 text-[11px] text-gray-400">
                        Target · {detail.prazo_captacao_dias}-day window
                      </div>
                      {target > 0 && (
                        <div className="mt-3">
                          <ProgressBar value={filledPct} height={6} />
                          <div className="mt-1.5 flex items-center justify-between text-[10px]">
                            <span className="text-gray-400">
                              {formatUsdc(raised, { compact: true })} raised
                            </span>
                            <span className="font-mono text-orange-400">
                              {filledPct.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <CardContent className="grid grid-cols-2 gap-2 p-4">
                      <InvStat
                        icon={TrendingUp}
                        label="Target APY"
                        value={detail.yield_apy_percent ? formatPercent(detail.yield_apy_percent, 2) : "—"}
                        accent
                      />
                      <InvStat
                        icon={Calendar}
                        label="Token term"
                        value={detail.prazo_total_token_meses ? `${detail.prazo_total_token_meses} months` : "—"}
                      />
                      <InvStat
                        icon={Receipt}
                        label="Payment"
                        value={detail.yield_periodicidade ? PERIODICITY_LABEL[detail.yield_periodicidade] : "—"}
                      />
                    </CardContent>

                    <div className="border-t border-dark-700 p-4">
                      {detail.token_symbol && detail.token_price_usdc && (
                        <div className="mb-3 flex items-center justify-between rounded-xl border border-dark-600 bg-dark-900/60 p-2.5">
                          <div>
                            <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-gray-500">
                              1 {detail.token_symbol}
                            </div>
                            <div className="font-heading text-base font-bold tabular-nums text-white">
                              {formatUsdc(detail.token_price_usdc)}
                            </div>
                          </div>
                          <Badge tone="emerald">USDC</Badge>
                        </div>
                      )}

                      {detail.sale_open && detail.status === "venda_aberta" ? (
                        isInvestor ? (
                          <Button
                            fullWidth
                            rightIcon={<Coins className="size-4" />}
                            onClick={() => setBuyOpen(true)}
                          >
                            Buy tokens
                          </Button>
                        ) : (
                          <ConnectWalletButton fullWidth redirectTo={false} />
                        )
                      ) : (
                        <Button fullWidth variant="secondary" disabled>
                          {SALE_STATE_LABEL[detail.status] ?? "Sale unavailable"}
                        </Button>
                      )}

                      <p className="mt-2.5 text-center text-[10px] leading-relaxed text-gray-500">
                        Investments require on-chain compliance verification via Chainalysis.
                      </p>
                    </div>
                  </Card>

                  {/* yield history */}
                  {(detail.yield_history ?? []).length > 0 && (
                    <Card className="mt-3">
                      <CardHeader>
                        <CardTitle className="text-sm">Yield distributed</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="font-heading text-xl font-bold tabular-nums text-emerald-400">
                          +{formatUsdc((detail.yield_history ?? []).reduce((s, y) => s + Number(y.amount_usdc ?? 0), 0))}
                        </div>
                        {(detail.yield_history ?? []).slice(0, 4).map((y, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between rounded-lg border border-dark-700 bg-dark-900/40 px-2.5 py-1.5 text-[11px]"
                          >
                            <span className="text-gray-400">
                              {y.reference_period ?? formatDate(y.distributed_at)}
                            </span>
                            <span className="font-mono text-emerald-300">
                              +{formatUsdc(y.amount_usdc)}
                            </span>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        ) : null}
      </div>

      {/* buy modal */}
      {detail && (
        <BuyCotaModal
          open={buyOpen}
          onClose={() => setBuyOpen(false)}
          development={detail}
          onPurchased={() => { /* could refresh */ }}
        />
      )}
    </div>
  );
}

/* ─── sub-components ─────────────────────────────────────────── */

function ExploreListCard({
  dev,
  selected,
  onClick,
}: {
  dev: DevelopmentListItem;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-xl border p-3 text-left transition ${
        selected
          ? "border-orange-500/50 bg-orange-500/8"
          : "border-dark-600 bg-dark-900/40 hover:border-purple-500/40 hover:bg-purple-500/5"
      }`}
    >
      <div className="flex items-start gap-2.5">
        <div className="relative size-14 shrink-0 overflow-hidden rounded-lg border border-dark-600 bg-dark-700">
          {dev.cover_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={dev.cover_image_url}
              alt={dev.nome}
              className="size-full object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center">
              <Building2 className="size-5 text-purple-400/50" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className={`truncate text-[13px] font-semibold leading-tight ${selected ? "text-orange-300" : "text-white"}`}>
            {dev.nome_comercial ?? dev.nome}
          </p>
          <p className="mt-0.5 flex items-center gap-1 font-mono text-[10px] text-gray-500">
            <MapPin className="size-2.5 shrink-0" />
            {dev.municipio} · {dev.uf}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <DevelopmentStatusBadge status={dev.status} />
            {dev.token_symbol && (
              <span className="rounded-full border border-orange-500/30 px-1.5 py-0.5 font-mono text-[9px] text-orange-300">
                {dev.token_symbol}
              </span>
            )}
            {dev.yield_apy_percent && (
              <span className="rounded-full border border-emerald-500/30 px-1.5 py-0.5 font-mono text-[9px] text-emerald-300">
                {formatPercent(dev.yield_apy_percent, 0)} APY
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

function PanelSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof Building2;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="border-b border-dark-700 py-3">
        <CardTitle className="flex items-center gap-2 text-[13px]">
          <span className="flex size-6 items-center justify-center rounded-md border border-purple-500/30 bg-purple-500/10 text-purple-300">
            <Icon className="size-3.5" />
          </span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-3">{children}</CardContent>
    </Card>
  );
}

function PRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-0.5 border-b border-dark-700/60 py-2 text-[12px] last:border-0">
      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-gray-500">
        {label}
      </span>
      <span className={`max-w-[60%] break-words text-right tabular-nums ${accent ? "font-semibold text-orange-300" : "text-gray-200"}`}>
        {value}
      </span>
    </div>
  );
}

function InvStat({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  icon?: typeof Building2;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-dark-600 bg-dark-900/60 p-2.5">
      <div className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.18em] text-gray-500">
        {Icon && <Icon className="size-3 text-purple-400" />}
        {label}
      </div>
      <div className={`mt-0.5 font-heading text-base font-bold tabular-nums ${accent ? "text-orange-400" : "text-white"}`}>
        {value}
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  icon?: typeof Building2;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-dark-600 bg-dark-900/60 p-2.5">
      <div className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.16em] text-gray-500">
        {Icon && <Icon className="size-3 text-purple-400" />}
        {label}
      </div>
      <div className={`mt-0.5 font-heading text-sm font-bold tabular-nums ${accent ? "text-orange-400" : "text-white"}`}>
        {value}
      </div>
    </div>
  );
}

function ContractRow({ label, address }: { label: string; address: string | null }) {
  return (
    <div className="rounded-lg border border-dark-600 bg-dark-900/40 p-2.5">
      <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-gray-500">{label}</p>
      {address ? (
        <p className="mt-1 truncate font-mono text-[11px] text-purple-300">{shortAddress(address, 6)}</p>
      ) : (
        <p className="mt-1 text-[11px] text-gray-600">Not deployed</p>
      )}
    </div>
  );
}
