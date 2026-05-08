"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  Award,
  Building2,
  Shield,
  TrendingUp,
} from "lucide-react";
import { apiGet } from "@/lib/api";
import { config } from "@/lib/config";
import type { IncorporatorListItem } from "@/lib/types";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatUsdc } from "@/lib/format";

export function IncorporatorPartners() {
  const [items, setItems] = useState<IncorporatorListItem[] | null>(null);

  useEffect(() => {
    apiGet<IncorporatorListItem[]>(`/public/incorporators`, { noAuth: true })
      .then(setItems)
      .catch(() => setItems([]));
  }, []);

  return (
    <section
      id="partner"
      className="relative overflow-hidden border-t border-dark-700 px-6 py-24 md:px-12"
    >
      <div className="pointer-events-none absolute -left-32 top-1/2 size-[500px] -translate-y-1/2 glow-purple opacity-50" />
      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div>
            <span className="section-label">05 — Partner developers</span>
            <h2 className="heading-display mt-3 max-w-3xl text-[36px] text-white md:text-[52px]">
              Builders with an auditable track record.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-gray-400">
              Every developer passes through operational, technical and legal
              due diligence before listing on Structa. Only firms holding a
              valid <span className="text-purple-300">ISO 9001</span> or{" "}
              <span className="text-purple-300">PBQP-H</span> certification are
              admitted.
            </p>
          </div>
          <Link
            href="/cadastro/incorporadora"
            className="inline-flex items-center gap-2 rounded-lg border border-orange-500/40 bg-orange-500/5 px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.18em] text-orange-300 transition hover:bg-orange-500/10"
          >
            Apply as a developer
            <ArrowUpRight className="size-3.5" />
          </Link>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items === null &&
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-56 rounded-2xl" />
            ))}
          {items !== null && items.length === 0 && (
            <div className="col-span-full rounded-2xl border border-dashed border-dark-600 bg-dark-800/40 p-10 text-center">
              <Building2 className="mx-auto size-8 text-purple-400/60" />
              <p className="mt-3 text-sm text-gray-400">
                We&apos;re onboarding the first partners.{" "}
                <Link
                  href="/cadastro/incorporadora"
                  className="text-orange-300 hover:text-orange-200"
                >
                  Be the first →
                </Link>
              </p>
            </div>
          )}
          {items?.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="card-base relative flex flex-col gap-4 p-5"
            >
              <div className="flex items-center gap-3">
                {p.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.logo_url}
                    alt={p.razao_social}
                    className="size-12 rounded-xl border border-dark-600 object-cover"
                  />
                ) : (
                  <div className="flex size-12 items-center justify-center rounded-xl border border-dark-600 bg-dark-900">
                    <Building2 className="size-5 text-purple-300" />
                  </div>
                )}
                <div className="min-w-0">
                  <div className="truncate font-heading text-base font-bold text-white">
                    {p.nome_fantasia ?? p.razao_social}
                  </div>
                  <div className="text-[12px] text-gray-500">
                    {p.municipio} · {p.uf} · Since {p.ano_fundacao}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-dark-600 bg-dark-900/50 p-2.5">
                  <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.18em] text-gray-500">
                    <TrendingUp className="size-3 text-emerald-400" />
                    GSV delivered
                  </div>
                  <div className="mt-0.5 font-heading text-sm font-bold tabular-nums text-white">
                    {formatUsdc(p.vgv_total_entregue_brl, { compact: true })}
                  </div>
                </div>
                <div className="rounded-lg border border-dark-600 bg-dark-900/50 p-2.5">
                  <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-gray-500">
                    Delivered projects
                  </div>
                  <div className="mt-0.5 font-heading text-sm font-bold tabular-nums text-white">
                    {p.empreendimentos_entregues}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {p.iso_9001_certificada && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-emerald-300">
                    <Award className="size-2.5" /> ISO 9001
                  </span>
                )}
                {p.pbqp_h_nivel && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-emerald-300">
                    <Shield className="size-2.5" /> PBQP-H {p.pbqp_h_nivel}
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Avoid unused warning for `config`
void config;
