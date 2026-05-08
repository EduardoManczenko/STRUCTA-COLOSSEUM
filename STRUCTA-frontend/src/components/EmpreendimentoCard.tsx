"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  Building2,
  Coins,
  MapPin,
  TrendingUp,
} from "lucide-react";
import { Card } from "./ui/Card";
import { ProgressBar } from "./ui/ProgressBar";
import { DevelopmentStatusBadge } from "./ui/StatusBadge";
import { formatPercent, formatUsdc, pct } from "@/lib/format";
import type { DevelopmentListItem } from "@/lib/types";

const TYPE_LABEL: Record<DevelopmentListItem["tipo"], string> = {
  residencial_vertical: "Residential vertical",
  residencial_horizontal: "Residential horizontal",
  misto: "Mixed use",
  comercial: "Commercial",
};

export function EmpreendimentoCard({
  development,
  href,
  index = 0,
}: {
  development: DevelopmentListItem;
  href: string;
  index?: number;
}) {
  const target = Number(development.captacao_target_brl ?? 0);
  // amount_raised is in USDC; for the LP card we display % filled visually.
  // Using a USDC->BRL approximation only matters cosmetically; we keep raw progress in %.
  const raised = Number(development.amount_raised_usdc ?? 0);
  // Heuristic: target is in BRL, raised in USDC. Without a live FX, use a simple 5.0 ratio for visual.
  const filledPct = pct(raised * 5, target);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.5, delay: index * 0.04 }}
    >
      <Link href={href} className="group block">
        <Card className="overflow-hidden hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-500/10">
          <div className="relative aspect-[16/9] overflow-hidden bg-dark-700">
            {development.cover_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={development.cover_image_url}
                alt={development.nome}
                className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            ) : (
              <div className="flex size-full items-center justify-center bg-gradient-to-br from-purple-900/30 via-dark-700 to-orange-900/20">
                <Building2 className="size-10 text-purple-400/60" />
              </div>
            )}
            <div className="absolute left-3 top-3 flex flex-wrap gap-2">
              <DevelopmentStatusBadge status={development.status} />
            </div>
            {development.token_symbol && (
              <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-orange-500/40 bg-dark-900/80 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-orange-300 backdrop-blur">
                <Coins className="size-3" />
                {development.token_symbol}
              </span>
            )}
          </div>

          <div className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-heading text-lg font-bold text-white group-hover:text-orange-300">
                  {development.nome_comercial ?? development.nome}
                </h3>
                <div className="mt-1 flex items-center gap-1.5 text-[12px] text-gray-400">
                  <MapPin className="size-3.5 shrink-0 text-purple-400" />
                  <span className="truncate">
                    {development.municipio} · {development.uf}
                  </span>
                </div>
              </div>
              <ArrowUpRight className="size-5 shrink-0 text-gray-500 transition-all group-hover:text-orange-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>

            <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-gray-500">
              {TYPE_LABEL[development.tipo]} ·             {development.numero_unidades}{" "}
              {development.numero_unidades > 1 ? "units" : "unit"}
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-dark-600 bg-dark-900/60 p-3">
                <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-gray-500">
                  <TrendingUp className="size-3 text-emerald-400" />
                  Target APY
                </div>
                <div className="mt-1 font-heading text-lg font-bold text-white tabular-nums">
                  {development.yield_apy_percent
                    ? formatPercent(development.yield_apy_percent, 1)
                    : "—"}
                </div>
              </div>
              <div className="rounded-xl border border-dark-600 bg-dark-900/60 p-3">
                <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-gray-500">
                  Fundraising target
                </div>
                <div className="mt-1 font-heading text-lg font-bold text-white tabular-nums">
                  {formatUsdc(target, { compact: true })}
                </div>
              </div>
            </div>

            {target > 0 && (
              <div className="mt-4">
                <ProgressBar value={filledPct} />
                <div className="mt-2 flex items-center justify-between text-[11px]">
                  <span className="text-gray-400">
                    {formatUsdc(raised, { compact: true })} raised
                  </span>
                  <span className="font-mono text-orange-400">
                    {filledPct.toFixed(0)}%
                  </span>
                </div>
              </div>
            )}

            {development.incorporator && (
              <div className="mt-4 flex items-center gap-2 border-t border-dark-700 pt-3 text-[11px] text-gray-500">
                {development.incorporator.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={development.incorporator.logo_url}
                    alt={development.incorporator.razao_social}
                    className="size-5 rounded-full object-cover"
                  />
                ) : (
                  <Building2 className="size-3.5 text-purple-400" />
                )}
                <span className="truncate">
                  by{" "}
                  <span className="text-gray-300">
                    {development.incorporator.nome_fantasia ??
                      development.incorporator.razao_social}
                  </span>
                </span>
              </div>
            )}
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}
