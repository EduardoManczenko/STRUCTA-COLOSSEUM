"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Building2, Search, Sparkles } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { EmpreendimentoCard } from "@/components/EmpreendimentoCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { Empty } from "@/components/ui/Empty";
import { apiGet, ApiError } from "@/lib/api";
import type { DevelopmentListItem } from "@/lib/types";

const STATUS_FILTERS: Array<{ value: string; label: string }> = [
  { value: "", label: "All" },
  { value: "venda_aberta", label: "Open sale" },
  { value: "aprovado", label: "Approved" },
  { value: "em_construcao", label: "Under construction" },
  { value: "distribuindo_yield", label: "Paying yield" },
];

export default function EmpreendimentosPage() {
  const [developments, setDevelopments] = useState<DevelopmentListItem[] | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        if (status) params.set("status", status);
        const data = await apiGet<DevelopmentListItem[]>(
          `/public/developments?${params.toString()}`,
          { signal: ctrl.signal, noAuth: true },
        );
        setDevelopments(data);
        setError(null);
      } catch (e) {
        if (e instanceof ApiError) setError(e.message);
      }
    }, 250);
    return () => {
      ctrl.abort();
      clearTimeout(t);
    };
  }, [search, status]);

  return (
    <main className="relative min-h-screen bg-dark-900">
      <Navbar />

      <section className="relative overflow-hidden pb-12 pt-32 md:pt-40">
        <div className="pointer-events-none absolute right-0 -top-20 size-[400px] glow-purple md:-right-40 md:size-[600px]" />
        <div className="pointer-events-none absolute left-0 top-40 size-[300px] glow-orange md:-left-40 md:size-[500px]" />
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-50" />

        <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-8 md:px-12">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/5 px-4 py-1.5"
          >
            <Sparkles className="size-3.5 text-orange-400" />
            <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-orange-300">
              Marketplace
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="break-words font-heading text-[34px] font-bold leading-[1.0] tracking-[-0.03em] text-white sm:text-[44px] md:text-[64px]"
          >
            Tokenized{" "}
            <span className="gradient-text">real estate deals</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12 }}
            className="mt-4 max-w-2xl text-base leading-relaxed text-gray-400 md:text-lg"
          >
            Every project undergoes technical and legal review before listing
            here. SPE diligence, ISO 9001 or PBQP-H certification, ring-fenced
            assets. Everything public, everything verifiable.
          </motion.p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-gray-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by project name…"
                className="h-12 w-full rounded-xl border border-dark-500 bg-dark-800/80 pl-11 pr-4 text-sm text-white placeholder:text-gray-500 focus:border-purple-500/60 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setStatus(f.value)}
                  className={`rounded-lg border px-3.5 py-2 font-mono text-[10px] uppercase tracking-[0.18em] transition ${
                    status === f.value
                      ? "border-orange-500/50 bg-orange-500/10 text-orange-300"
                      : "border-dark-600 bg-dark-800/60 text-gray-400 hover:border-dark-500 hover:text-white"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-24 md:px-12">
        {error && (
          <div className="mb-8 rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200">
            Failed to load projects: {error}
          </div>
        )}

        {developments === null && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[460px] rounded-2xl" />
            ))}
          </div>
        )}

        {developments && developments.length === 0 && (
          <Empty
            icon={Building2}
            title="No projects found"
            description="We're curating the first projects. Check back soon — or list your own as a developer."
          />
        )}

        {developments && developments.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {developments.map((d, i) => (
              <EmpreendimentoCard
                key={d.id}
                development={d}
                href={`/empreendimentos/${d.slug ?? d.id}`}
                index={i}
              />
            ))}
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}
