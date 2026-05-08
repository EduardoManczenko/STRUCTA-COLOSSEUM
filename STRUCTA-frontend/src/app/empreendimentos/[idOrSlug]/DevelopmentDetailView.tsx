"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
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
  MapPin,
  Receipt,
  Shield,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { DevelopmentStatusBadge, Badge } from "@/components/ui/StatusBadge";
import { BuyCotaModal } from "@/components/purchase/BuyCotaModal";
import { useAuth } from "@/components/providers/AuthProvider";
import { ConnectWalletButton } from "@/components/wallet/ConnectWalletButton";
import {
  formatDate,
  formatDateLong,
  formatNumber,
  formatPercent,
  formatUsdc,
  pct,
  shortAddress,
} from "@/lib/format";
import type { DevelopmentDetail } from "@/lib/types";

const TYPE_LABEL = {
  residencial_vertical: "Residential vertical",
  residencial_horizontal: "Residential horizontal",
  misto: "Mixed use",
  comercial: "Commercial",
} as const;

const PERIODICITY_LABEL = {
  mensal: "Monthly",
  trimestral: "Quarterly",
  semestral: "Semi-annual",
  anual: "Annual",
} as const;

const SALE_STATE_LABEL: Record<string, string> = {
  rascunho: "Draft — not yet submitted",
  pendente: "Pending approval",
  recusado: "Project rejected",
  aprovado: "Coming soon · awaiting sale launch",
  venda_aberta: "Sale open",
  em_construcao: "Sale closed · under construction",
  distribuindo_yield: "Distributing yield · sale closed",
  aguardando_burn: "Redemption available · sale closed",
  finalizado: "Project completed",
  cancelado: "Project cancelled",
};

const DOC_LABELS: Record<string, string> = {
  memorial_incorporacao: "Incorporation Memorial",
  matricula_terreno: "Land Registry Certificate",
  patrimonio_afetacao: "Earmarked Equity Registration",
  alvara_construcao: "Building Permit",
  projeto_aprovado: "City-approved Building Plan",
  art_rrt: "ART/RRT — Technical Responsible",
  cronograma: "Physical-Financial Schedule",
  orcamento: "Detailed Budget (BDI)",
  contrato_social_spe: "SPE Articles of Incorporation",
  certidao_negativa_spe: "SPE Tax Clearance Certificate",
  iso_9001: "ISO 9001 Certificate",
  pbqp_h: "PBQP-H Certificate",
  pcmat: "PCMAT",
  estudo_viabilidade: "Economic Feasibility Study",
  pesquisa_mercado: "Market Research",
  planta_localizacao: "Location & Site Plan",
  memorial_descritivo: "Unit Descriptive Memorial",
};

export function DevelopmentDetailView({
  development,
}: {
  development: DevelopmentDetail;
}) {
  const [activeImage, setActiveImage] = useState(0);
  const [buyOpen, setBuyOpen] = useState(false);
  const { user } = useAuth();
  const isInvestor = user?.role === "investor";
  const inc = development.incorporator;
  const target = Number(development.captacao_target_brl ?? 0);
  const raised = Number(development.amount_raised_usdc ?? 0);
  const filledPct = pct(raised * 5, target); // FX heuristic for cosmetic %
  const images = (development.images ?? []).slice().sort(
    (a, b) => a.order_index - b.order_index,
  );
  const cover =
    images[activeImage]?.url ?? development.cover_image_url ?? null;

  const totalYieldDistributed = (development.yield_history ?? []).reduce(
    (sum, y) => sum + Number(y.amount_usdc ?? 0),
    0,
  );

  return (
    <>
      <section className="relative overflow-hidden pt-28 pb-16 md:pt-36">
        <div className="pointer-events-none absolute -right-40 -top-20 size-[600px] glow-purple" />
        <div className="pointer-events-none absolute -left-40 top-40 size-[500px] glow-orange" />
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-50" />

        <div className="relative z-10 mx-auto max-w-7xl px-6 md:px-12">
          <Link
            href="/empreendimentos"
            className="mb-6 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-gray-400 transition hover:text-orange-400"
          >
            <ArrowLeft className="size-3.5" />
            All properties
          </Link>

          <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
            {/* LEFT: Hero & gallery */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex flex-wrap items-center gap-2">
                <DevelopmentStatusBadge status={development.status} />
                <Badge tone="purple">{TYPE_LABEL[development.tipo]}</Badge>
                {development.token_symbol && (
                  <Badge tone="orange">
                    <Coins className="size-3" />
                    {development.token_symbol}
                  </Badge>
                )}
              </div>

              <h1 className="mt-4 font-heading text-[40px] font-bold leading-[1.05] tracking-[-0.03em] text-white md:text-[56px]">
                {development.nome_comercial ?? development.nome}
              </h1>
              {development.nome_comercial &&
                development.nome_comercial !== development.nome && (
                  <p className="mt-1.5 font-mono text-[11px] uppercase tracking-[0.2em] text-gray-500">
                    Legal name: {development.nome}
                  </p>
                )}

              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-400">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-3.5 text-purple-400" />
                  {development.endereco_terreno}, {development.municipio} ·{" "}
                  {development.uf}
                </span>
                {development.previsao_habite_se && (
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="size-3.5 text-purple-400" />
                    Expected occupancy permit:{" "}
                    {formatDateLong(development.previsao_habite_se)}
                  </span>
                )}
              </div>

              <div className="mt-7 overflow-hidden rounded-2xl border border-dark-600 bg-dark-800">
                <div className="relative aspect-[16/10] bg-dark-700">
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={cover}
                      alt={development.nome}
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center bg-gradient-to-br from-purple-900/30 via-dark-700 to-orange-900/20">
                      <Building2 className="size-16 text-purple-400/50" />
                    </div>
                  )}
                </div>
                {images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto p-3">
                    {images.map((img, i) => (
                      <button
                        key={img.id}
                        onClick={() => setActiveImage(i)}
                        className={`relative aspect-[4/3] w-24 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                          activeImage === i
                            ? "border-orange-500"
                            : "border-transparent hover:border-purple-500/40"
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img.url}
                          alt={img.caption ?? `Photo ${i + 1}`}
                          className="size-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {development.description && (
                <p className="mt-6 whitespace-pre-line text-[15px] leading-[1.75] text-gray-300">
                  {development.description}
                </p>
              )}
            </motion.div>

            {/* RIGHT: Investment summary */}
            <motion.aside
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="lg:sticky lg:top-24 lg:self-start"
            >
              <Card className="overflow-hidden">
                <div className="border-b border-dark-700 bg-gradient-to-br from-purple-500/10 via-transparent to-orange-500/10 p-5 sm:p-6">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-orange-400">
                      Fundraising
                    </span>
                    <DevelopmentStatusBadge status={development.status} />
                  </div>
                  <div className="mt-3 font-heading text-3xl font-bold tabular-nums text-white">
                    {formatUsdc(target, { compact: false })}
                  </div>
                  <div className="mt-1 text-[12px] text-gray-400">
                    Fundraising target · {development.prazo_captacao_dias}-day
                    window
                  </div>
                  {target > 0 && (
                    <div className="mt-4">
                      <ProgressBar value={filledPct} height={8} />
                      <div className="mt-2 flex items-center justify-between text-[11px]">
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
                <CardContent className="grid grid-cols-2 gap-3 p-5 sm:p-6">
                  <Stat
                    icon={TrendingUp}
                    label="Target APY"
                    value={
                      development.yield_apy_percent
                        ? formatPercent(development.yield_apy_percent, 2)
                        : "—"
                    }
                    accent
                  />
                  <Stat
                    icon={Calendar}
                    label="Token term"
                    value={
                      development.prazo_total_token_meses
                        ? `${development.prazo_total_token_meses} months`
                        : "—"
                    }
                  />
                  <Stat
                    icon={Receipt}
                    label="Payment"
                    value={
                      development.yield_periodicidade
                        ? PERIODICITY_LABEL[development.yield_periodicidade]
                        : "—"
                    }
                  />
                </CardContent>
                <div className="border-t border-dark-700 p-5 sm:p-6">
                  {development.token_symbol && development.token_price_usdc && (
                    <div className="mb-4 flex items-center justify-between rounded-xl border border-dark-600 bg-dark-900/60 p-3">
                      <div>
                        <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-gray-500">
                          1 {development.token_symbol}
                        </div>
                        <div className="mt-0.5 font-heading text-lg font-bold tabular-nums text-white">
                          {formatUsdc(development.token_price_usdc)}
                        </div>
                      </div>
                      <Badge tone="emerald">USDC</Badge>
                    </div>
                  )}

                  {development.sale_open && development.status === "venda_aberta" ? (
                    isInvestor ? (
                      <Button
                        fullWidth
                        size="lg"
                        rightIcon={<Coins className="size-4" />}
                        onClick={() => setBuyOpen(true)}
                      >
                        Buy tokens
                      </Button>
                    ) : (
                      <ConnectWalletButton
                        fullWidth
                        size="lg"
                        redirectTo={false}
                      />
                    )
                  ) : (
                    <Button
                      fullWidth
                      size="lg"
                      variant="secondary"
                      disabled
                    >
                      {SALE_STATE_LABEL[development.status] ?? "Sale unavailable"}
                    </Button>
                  )}
                  <p className="mt-3 text-center text-[11px] leading-relaxed text-gray-500">
                    Investments require on-chain compliance verification via
                    Chainalysis. Unavailable for US and Brazilian residents.
                  </p>
                </div>
              </Card>

              {totalYieldDistributed > 0 && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle>Yield distributed</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="font-heading text-2xl font-bold tabular-nums text-emerald-400">
                      +{formatUsdc(totalYieldDistributed)}
                    </div>
                    <div className="space-y-2">
                      {(development.yield_history ?? []).slice(0, 5).map((y, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between rounded-lg border border-dark-700 bg-dark-900/40 px-3 py-2 text-[12px]"
                        >
                          <span className="text-gray-400">
                            {y.reference_period ?? formatDate(y.distributed_at)}
                          </span>
                          <span className="font-mono text-emerald-300">
                            +{formatUsdc(y.amount_usdc)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.aside>
          </div>
        </div>
      </section>

      {/* Detailed sections */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-24 md:px-12">
        <div className="grid gap-6 lg:grid-cols-2">
          <Section title="Property identification" icon={Building2}>
            <DataRow label="Name" value={development.nome} />
            {development.nome_comercial && (
              <DataRow label="Commercial name" value={development.nome_comercial} />
            )}
            <DataRow label="Type" value={TYPE_LABEL[development.tipo]} />
            <DataRow label="Address" value={development.endereco_terreno} />
            <DataRow
              label="City / State"
              value={`${development.municipio} · ${development.uf}`}
            />
            <DataRow label="ZIP code" value={development.cep} />
            {development.matricula_cri && (
              <DataRow label="CRI registration" value={development.matricula_cri} />
            )}
            {development.area_terreno_m2 && (
              <DataRow
                label="Land area"
                value={`${formatNumber(development.area_terreno_m2)} m²`}
              />
            )}
            {development.area_construida_total_m2 && (
              <DataRow
                label="Total built area"
                value={`${formatNumber(development.area_construida_total_m2)} m²`}
              />
            )}
            <DataRow
              label="Units"
              value={`${development.numero_unidades} ${development.numero_unidades > 1 ? "units" : "unit"}${development.padrao ? ` · ${development.padrao}` : ""}`}
            />
            {development.previsao_inicio_obra && (
              <DataRow
                label="Construction start"
                value={formatDateLong(development.previsao_inicio_obra)}
              />
            )}
            {development.previsao_habite_se && (
              <DataRow
                label="Expected occupancy permit"
                value={formatDateLong(development.previsao_habite_se)}
              />
            )}
          </Section>

          <Section title="SPE — Special Purpose Entity" icon={Landmark}>
            <DataRow label="Legal name" value={development.spe_razao_social} />
            <DataRow label="CNPJ" value={development.spe_cnpj} />
            <DataRow
              label="Incorporation date"
              value={formatDate(development.spe_data_constituicao)}
            />
            {development.spe_nire && (
              <DataRow label="NIRE" value={development.spe_nire} />
            )}
            {development.spe_endereco && (
              <DataRow label="Address" value={development.spe_endereco} />
            )}
            {development.spe_cartorio && (
              <DataRow
                label="Registry office"
                value={`${development.spe_cartorio}${development.spe_registro ? ` · No. ${development.spe_registro}` : ""}`}
              />
            )}
            <DataRow
              label="Earmarked equity (affectation equity)"
              value={
                development.spe_patrimonio_afetacao
                  ? `Yes${development.spe_patrimonio_afetacao_registro ? ` · ${development.spe_patrimonio_afetacao_registro}` : ""}`
                  : "No"
              }
              accent={development.spe_patrimonio_afetacao ?? false}
            />
            <DataRow
              label="RET active"
              value={development.spe_ret_ativo ? "Yes" : "No"}
              accent={development.spe_ret_ativo ?? false}
            />
          </Section>

          <Section title="Financials" icon={TrendingUp}>
            <DataRow label="GDV (VGV)" value={formatUsdc(development.vgv_brl)} />
            <DataRow
              label="Total construction cost"
              value={formatUsdc(development.custo_total_construcao_brl)}
            />
            {development.custo_terreno_brl && (
              <DataRow
                label="Land cost"
                value={formatUsdc(development.custo_terreno_brl)}
              />
            )}
            {development.cub_referencia_mes_ano && (
              <DataRow
                label="CUB reference"
                value={`${development.cub_referencia_mes_ano}${development.cub_sinduscon ? ` · ${development.cub_sinduscon}` : ""}`}
              />
            )}
            {development.bdi_percent && (
              <DataRow
                label="BDI applied"
                value={formatPercent(development.bdi_percent)}
              />
            )}
            <DataRow
              label="Fundraising target"
              value={formatUsdc(development.captacao_target_brl)}
              accent
            />
            <DataRow
              label="Fundraising window"
              value={`${development.prazo_captacao_dias} days`}
            />
            {development.percentual_custo_construcao_coberto && (
              <DataRow
                label="% of construction cost covered"
                value={formatPercent(
                  development.percentual_custo_construcao_coberto,
                )}
              />
            )}
          </Section>

          <Section title="Tokenomics & Yield" icon={Coins}>
            {development.token_symbol && (
              <DataRow label="Token symbol" value={development.token_symbol} />
            )}
            {development.token_name && (
              <DataRow label="Token name" value={development.token_name} />
            )}
            {development.token_supply && (
              <DataRow
                label="Total supply"
                value={formatNumber(development.token_supply, 0)}
              />
            )}
            {development.token_price_usdc && (
              <DataRow
                label="Price per token"
                value={formatUsdc(development.token_price_usdc)}
              />
            )}
            {development.yield_apy_percent && (
              <DataRow
                label="Target APY"
                value={formatPercent(development.yield_apy_percent)}
                accent
              />
            )}
            {development.yield_periodicidade && (
              <DataRow
                label="Payment frequency"
                value={PERIODICITY_LABEL[development.yield_periodicidade]}
              />
            )}
            {development.prazo_total_token_meses && (
              <DataRow
                label="Total term"
                value={`${development.prazo_total_token_meses} months`}
              />
            )}
          </Section>

          <Section
            title="Smart contracts (Solana)"
            icon={Database}
            className="lg:col-span-2"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <ContractAddress
                label="Cota mint"
                address={development.cota_mint_address}
              />
              <ContractAddress
                label="Vault principal"
                address={development.vault_principal_address}
              />
              <ContractAddress
                label="Vault yield"
                address={development.vault_yield_address}
              />
              <ContractAddress
                label="Burn pool"
                address={development.burn_pool_address}
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge tone={development.sale_open ? "emerald" : "gray"}>
                {development.sale_open ? "Sale open" : "Sale closed"}
              </Badge>
              <Badge tone={development.burn_unlocked ? "emerald" : "gray"}>
                {development.burn_unlocked ? "Burn unlocked" : "Burn locked"}
              </Badge>
              <Badge tone={development.refund_enabled ? "amber" : "gray"}>
                {development.refund_enabled ? "Refund enabled" : "No refund"}
              </Badge>
            </div>
          </Section>

          {inc && (
            <Section
              title="Developer"
              icon={Building2}
              className="lg:col-span-2"
            >
              <div className="flex flex-wrap items-center gap-4">
                {inc.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={inc.logo_url}
                    alt={inc.razao_social}
                    className="size-14 rounded-xl border border-dark-600 object-cover"
                  />
                ) : (
                  <div className="flex size-14 items-center justify-center rounded-xl border border-dark-600 bg-dark-900">
                    <Building2 className="size-6 text-purple-300" />
                  </div>
                )}
                <div className="flex-1">
                  <div className="font-heading text-lg font-bold text-white">
                    {inc.nome_fantasia ?? inc.razao_social}
                  </div>
                  <div className="text-[12px] text-gray-400">
                    {inc.razao_social} · {inc.municipio}/{inc.uf} · Est.{" "}
                    {inc.ano_fundacao}
                  </div>
                </div>
                {inc.site && (
                  <a
                    href={inc.site}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-[12px] text-orange-300 hover:text-orange-200"
                  >
                    Website <ExternalLink className="size-3" />
                  </a>
                )}
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat
                  label="Completed projects"
                  value={String(inc.empreendimentos_entregues)}
                />
                <Stat
                  label="Total GDV delivered"
                  value={formatUsdc(inc.vgv_total_entregue_brl, { compact: true })}
                />
                <Stat
                  label="ISO 9001"
                  value={inc.iso_9001_certificada ? "Active" : "—"}
                  icon={Award}
                  accent={inc.iso_9001_certificada}
                />
                <Stat
                  label="PBQP-H"
                  value={inc.pbqp_h_nivel ? `Level ${inc.pbqp_h_nivel}` : "—"}
                  icon={Shield}
                  accent={!!inc.pbqp_h_nivel}
                />
              </div>
            </Section>
          )}

          {development.documents && development.documents.length > 0 && (
            <Section
              title="Legal documentation (on-chain hashes)"
              icon={FileText}
              className="lg:col-span-2"
            >
              <div className="grid gap-3 sm:grid-cols-2">
                {development.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-start gap-3 rounded-xl border border-dark-600 bg-dark-900/40 p-3"
                  >
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-300">
                      <FileText className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-semibold text-white">
                        {DOC_LABELS[doc.type] ?? doc.label ?? doc.type}
                      </div>
                      <div className="truncate text-[11px] text-gray-500">
                        {doc.filename} · {(doc.size_bytes / 1024).toFixed(0)} KB
                      </div>
                      {doc.sha256_hash && (
                        <div className="mt-1.5 flex items-center gap-1.5 font-mono text-[10px] text-gray-600">
                          <Hash className="size-3" />
                          <span className="truncate">{doc.sha256_hash}</span>
                        </div>
                      )}
                    </div>
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-400" />
                  </div>
                ))}
              </div>
            </Section>
          )}

          {development.units && development.units.length > 0 && (
            <Section
              title="Units"
              icon={Building2}
              className="lg:col-span-2"
            >
              <div className="overflow-hidden rounded-xl border border-dark-600">
                <table className="w-full text-left text-sm">
                  <thead className="bg-dark-900 font-mono text-[10px] uppercase tracking-[0.18em] text-gray-500">
                    <tr>
                      <th className="px-4 py-2.5">Identifier</th>
                      <th className="px-4 py-2.5">Area</th>
                      <th className="px-4 py-2.5">Price</th>
                      <th className="px-4 py-2.5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-700">
                    {development.units.map((u) => (
                      <tr key={u.id} className="text-gray-300">
                        <td className="px-4 py-2.5 font-medium text-white">
                          {u.identifier}
                        </td>
                        <td className="px-4 py-2.5">
                          {u.metragem_m2 ? `${formatNumber(u.metragem_m2)} m²` : "—"}
                        </td>
                        <td className="px-4 py-2.5">
                          {u.preco_brl ? formatUsdc(u.preco_brl) : "—"}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <Badge
                            tone={
                              u.status === "vendida"
                                ? "emerald"
                                : u.status === "reservada"
                                  ? "amber"
                                  : "gray"
                            }
                          >
                            {u.status === "vendida" ? "Sold" : u.status === "reservada" ? "Reserved" : u.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          )}
        </div>
      </section>

      <BuyCotaModal
        open={buyOpen}
        onClose={() => setBuyOpen(false)}
        development={development}
      />
    </>
  );
}

function Section({
  title,
  icon: Icon,
  children,
  className,
}: {
  title: string;
  icon: typeof Building2;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader className="border-b border-dark-700">
        <CardTitle className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-300">
            <Icon className="size-4" />
          </span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-5">{children}</CardContent>
    </Card>
  );
}

function DataRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-dark-700/60 py-2.5 text-sm last:border-0">
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-gray-500">
        {label}
      </span>
      <span
        className={`text-right tabular-nums ${
          accent ? "font-semibold text-orange-300" : "text-gray-200"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function Stat({
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
    <div className="rounded-xl border border-dark-600 bg-dark-900/60 p-3">
      <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-gray-500">
        {Icon && <Icon className="size-3 text-purple-400" />}
        {label}
      </div>
      <div
        className={`mt-1 font-heading text-lg font-bold tabular-nums ${
          accent ? "text-orange-400" : "text-white"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function ContractAddress({
  label,
  address,
}: {
  label: string;
  address: string | null;
}) {
  return (
    <div className="rounded-xl border border-dark-600 bg-dark-900/40 p-3">
      <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-gray-500">
        {label}
      </div>
      {address ? (
        <div className="mt-1 flex items-center justify-between gap-2">
          <code className="truncate text-[12px] font-mono text-purple-300">
            {address}
          </code>
          <span className="shrink-0 rounded bg-purple-500/10 px-1.5 py-0.5 font-mono text-[10px] uppercase text-purple-300">
            {shortAddress(address, 4)}
          </span>
        </div>
      ) : (
        <div className="mt-1 text-[12px] text-gray-500">
          Created on project approval
        </div>
      )}
    </div>
  );
}
