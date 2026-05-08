"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  MapPin,
} from "lucide-react";
import { apiGet } from "@/lib/api";
import { formatUsdc, pct } from "@/lib/format";
import type { DevelopmentListItem } from "@/lib/types";

const TYPE_LABEL: Record<DevelopmentListItem["tipo"], string> = {
  residencial_vertical: "Residential",
  residencial_horizontal: "Residential",
  misto: "Mixed use",
  comercial: "Commercial",
};

function formatDelivery(date: string | null): string {
  if (!date) return "—";
  const d = new Date(date);
  const quarter = Math.floor(d.getUTCMonth() / 3) + 1;
  return `Delivery Q${quarter} / ${d.getUTCFullYear()}`;
}

export function LiveDeal() {
  const [deals, setDeals] = useState<DevelopmentListItem[] | null | undefined>(
    undefined,
  );
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);

  useEffect(() => {
    apiGet<DevelopmentListItem[]>(`/public/developments?status=venda_aberta`, {
      noAuth: true,
    })
      .then((items) => setDeals(items.length > 0 ? items : null))
      .catch(() => setDeals(null));
  }, []);

  const total = deals?.length ?? 0;

  const goTo = useCallback(
    (next: number) => {
      setDirection(next > index ? 1 : -1);
      setIndex(next);
    },
    [index],
  );

  const prev = useCallback(() => {
    if (total < 2) return;
    goTo((index - 1 + total) % total);
  }, [goTo, index, total]);

  const next = useCallback(() => {
    if (total < 2) return;
    goTo((index + 1) % total);
  }, [goTo, index, total]);

  const activeDeal = deals ? deals[index] : null;

  return (
    <section className="relative overflow-hidden border-t border-dark-700 bg-dark-950/50 py-32">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-30" />

      <div className="relative mx-auto max-w-7xl px-6 md:px-12">
        <div className="mb-14 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="section-label mb-4"
            >
              04 — Open deals
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.05 }}
              className="font-heading text-[44px] font-bold leading-[1.05] tracking-[-0.025em] text-white md:text-[56px]"
            >
              Live investments,{" "}
              <span className="gradient-text">open for funding.</span>
            </motion.h2>
          </div>

          {deals && deals.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/5 px-4 py-2"
            >
              <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-400">
                Active fundraising
              </span>
            </motion.div>
          )}
        </div>

        {/* Loading skeleton */}
        {deals === undefined && (
          <div className="card-base h-[440px] animate-pulse" />
        )}

        {/* Empty state */}
        {deals === null && (
          <div className="card-base flex flex-col items-center justify-center gap-3 px-6 py-20 text-center">
            <Building2 className="size-8 text-purple-400/60" />
            <div className="font-heading text-xl text-white">
              No active deals right now.
            </div>
            <p className="max-w-md text-sm text-gray-400">
              We&apos;re curating the next listings. Browse approved projects or
              come back soon.
            </p>
            <Link href="/empreendimentos" className="btn-secondary mt-2">
              Browse marketplace
            </Link>
          </div>
        )}

        {/* Carousel */}
        {activeDeal && (
          <div className="relative">
            {/* Side nav arrows */}
            {total > 1 && (
              <>
                <button
                  onClick={prev}
                  aria-label="Previous deal"
                  className="absolute -left-5 top-1/2 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-dark-600 bg-dark-900/90 text-gray-300 shadow-lg backdrop-blur-sm transition hover:border-orange-500/60 hover:text-orange-300 md:-left-6"
                >
                  <ChevronLeft className="size-5" />
                </button>
                <button
                  onClick={next}
                  aria-label="Next deal"
                  className="absolute -right-5 top-1/2 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-dark-600 bg-dark-900/90 text-gray-300 shadow-lg backdrop-blur-sm transition hover:border-orange-500/60 hover:text-orange-300 md:-right-6"
                >
                  <ChevronRight className="size-5" />
                </button>
              </>
            )}

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={activeDeal.id}
                initial={{ opacity: 0, x: direction * 60 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction * -60 }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
              >
                <DealCard deal={activeDeal} />
              </motion.div>
            </AnimatePresence>

            {/* Dot indicators */}
            {total > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                {deals!.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    aria-label={`Go to deal ${i + 1}`}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === index
                        ? "w-6 bg-orange-500"
                        : "w-1.5 bg-dark-600 hover:bg-dark-500"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function DealCard({ deal }: { deal: DevelopmentListItem }) {
  const targetBrl = Number(deal.captacao_target_brl ?? 0);
  const targetUsdcApprox = targetBrl / 5;
  const raisedUsdc = Number(deal.amount_raised_usdc ?? 0);
  const filledPct = pct(raisedUsdc, targetUsdcApprox);
  const totalUnits = deal.numero_unidades ?? 0;
  const soldUnits = deal.units_sold ?? 0;
  const developerName =
    deal.incorporator?.nome_fantasia ?? deal.incorporator?.razao_social ?? "—";
  const tokenId =
    deal.token_symbol ??
    `STRCT-${new Date().getFullYear()}-${deal.id.slice(0, 4).toUpperCase()}`;
  const projectHref = `/empreendimentos/${deal.slug ?? deal.id}`;

  return (
    <div className="card-base relative overflow-hidden p-7 md:p-10">
      <div className="pointer-events-none absolute -right-20 -top-20 size-80 rounded-full bg-purple-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 size-80 rounded-full bg-orange-500/10 blur-3xl" />

      <div className="relative grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
        {/* LEFT — deal info */}
        <div className="flex flex-col gap-6">
          {deal.cover_image_url && (
            <div className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-dark-600">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={deal.cover_image_url}
                alt={deal.nome}
                className="size-full object-cover"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-dark-900/80 via-transparent to-transparent" />
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded border border-orange-500/40 bg-orange-500/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-orange-400">
              {TYPE_LABEL[deal.tipo]}
            </span>
            <span className="rounded border border-purple-500/40 bg-purple-500/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-purple-300">
              Solana SPL
            </span>
            <span className="font-mono text-[10px] text-gray-600">
              TOKEN_ID: {tokenId}
            </span>
          </div>

          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-gray-500">
              By {developerName}
            </div>
            <h3 className="mt-2 font-heading text-4xl font-bold leading-[1.05] tracking-[-0.02em] text-white md:text-5xl">
              {deal.nome_comercial ?? deal.nome}
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-400">
            <span className="flex items-center gap-2">
              <MapPin className="size-4 text-orange-400" />
              {deal.municipio}, {deal.uf}
            </span>
            <span className="flex items-center gap-2">
              <Calendar className="size-4 text-orange-400" />
              {formatDelivery(deal.previsao_habite_se)}
            </span>
            <span className="font-mono text-xs text-gray-600">
              · {totalUnits} units
              {deal.prazo_total_token_meses
                ? ` · ${deal.prazo_total_token_meses} months token`
                : ""}
            </span>
          </div>

          <p className="max-w-xl text-[14px] leading-[1.7] text-gray-400">
            Multi-family residential development with a dedicated SPE and asset
            ring-fencing. Yield distributed proportionally to unit sales, in
            USDC, monthly to all token holders.
          </p>

          <div className="grid grid-cols-3 gap-4 border-t border-dark-600 pt-6">
            <DealMetric
              label="VGV"
              value={formatUsdc(targetBrl, { compact: true })}
              subtle="Total"
            />
            <DealMetric
              label="Unit share"
              value={
                deal.token_price_usdc
                  ? formatUsdc(deal.token_price_usdc, { compact: true })
                  : "—"
              }
              subtle="USDC"
            />
            <DealMetric
              label="Target APY"
              value={
                deal.yield_apy_percent ? `${deal.yield_apy_percent}%` : "—"
              }
              highlight
            />
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <Link href={projectHref} className="btn-primary group">
              Invest now
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link href={projectHref} className="btn-secondary">
              View due diligence
            </Link>
          </div>
        </div>

        {/* RIGHT — units grid + progress */}
        <div className="flex flex-col gap-6">
          <div className="rounded-2xl border border-dark-600 bg-dark-800/60 p-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-gray-500">
                Fundraising
              </span>
              <span className="font-mono text-[11px] text-orange-400">
                {filledPct.toFixed(0)}% ·{" "}
                {formatUsdc(raisedUsdc, { compact: true })} /{" "}
                {formatUsdc(targetUsdcApprox, { compact: true })}
              </span>
            </div>
            <div className="relative h-3 overflow-hidden rounded-full bg-dark-700">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${filledPct}%` }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-purple-500 via-purple-400 to-orange-400"
              />
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] text-gray-500">
              <span>
                {deal.prazo_captacao_dias
                  ? `${deal.prazo_captacao_dias}-day window`
                  : "Open window"}
              </span>
              <span>{deal.sale_open ? "Sale open" : "Sale paused"}</span>
            </div>
          </div>

          {totalUnits > 0 && (
            <div className="rounded-2xl border border-dark-600 bg-dark-800/60 p-5">
              <div className="mb-4 flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-gray-500">
                  Units
                </span>
                <span className="font-mono text-[11px] text-purple-300">
                  <strong>{soldUnits}</strong> / {totalUnits} sold
                </span>
              </div>
              <UnitsGrid total={totalUnits} sold={soldUnits} />
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[10.5px] text-gray-500">
                <span className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded bg-orange-500" />
                  Sold
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded border border-orange-500 bg-orange-500/20" />
                  On sale
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded border border-dark-500 bg-dark-700/50" />
                  Available
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function UnitsGrid({ total, sold }: { total: number; sold: number }) {
  const cap = Math.min(total, 80);
  const cells = Array.from({ length: cap });
  const cols = cap <= 20 ? 5 : cap <= 40 ? 8 : 10;
  const soldCap = Math.min(sold, cap);
  const activeIndex = soldCap < cap ? soldCap : -1;
  return (
    <div
      className="grid gap-1.5"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {cells.map((_, i) => {
        const isSold = i < soldCap;
        const isActive = i === activeIndex;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: i * 0.01 }}
            className={`aspect-square rounded ${
              isSold
                ? "bg-gradient-to-br from-orange-500 to-orange-600"
                : isActive
                  ? "border border-orange-500 bg-orange-500/20 vault-pulse"
                  : "border border-dark-500 bg-dark-700/50"
            }`}
          />
        );
      })}
    </div>
  );
}

function DealMetric({
  label,
  value,
  subtle,
  highlight,
}: {
  label: string;
  value: string;
  subtle?: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <div className="mb-1 font-mono text-[9px] uppercase tracking-[0.2em] text-gray-500">
        {label}
      </div>
      <div
        className={`font-heading text-2xl font-bold tabular-nums ${highlight ? "text-orange-500" : "text-white"}`}
      >
        {value}
      </div>
      {subtle && (
        <div className="font-mono text-[10px] text-gray-600">{subtle}</div>
      )}
    </div>
  );
}
