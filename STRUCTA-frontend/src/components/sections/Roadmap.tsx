"use client";

import { motion } from "framer-motion";

const STEPS = [
  { ver: "Alpha", keyword: "Pilot + First Raise", quarter: "Q2 / 2026", current: true },
  { ver: "Beta", keyword: "Operational Validation + Contract Audit", quarter: "Q3 / 2026" },
  { ver: "V1", keyword: "Mainnet Deploy + First Listing", quarter: "Q4 / 2026" },
  { ver: "V2", keyword: "Secondary Market", quarter: "Q1 / 2027" },
  { ver: "V3", keyword: "LATAM Developers Expansion", quarter: "Q2 / 2027" },
];

export function Roadmap() {
  return (
    <section
      id="roadmap"
      className="relative overflow-hidden border-t border-dark-700 py-32"
    >
      <div className="pointer-events-none absolute -left-32 top-1/2 size-[500px] -translate-y-1/2 glow-purple" />

      <div className="relative mx-auto max-w-7xl px-6 md:px-12">
        <div className="mb-14 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="section-label mb-4"
          >
            08 — Roadmap
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="font-heading text-[44px] font-bold leading-[1.05] tracking-[-0.025em] text-white md:text-[56px]"
          >
            5 stages to{" "}
            <span className="gradient-text">LatAm.</span>
          </motion.h2>
        </div>

        {/* Ascending blocks */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
          {STEPS.map((step, idx) => (
            <motion.div
              key={step.ver}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: idx * 0.08 }}
              className="flex flex-col items-center gap-3"
              style={{ transform: `translateY(${idx === 0 ? 0 : -idx * 8}px)` }}
            >
              <div
                className={`flex h-32 w-full flex-col items-center justify-center gap-2 rounded-xl border p-4 transition-all ${
                  step.current
                    ? "border-orange-500/40 bg-gradient-to-br from-orange-500/15 to-orange-500/5 shadow-xl shadow-orange-500/10"
                    : "border-dark-600 bg-dark-800/40"
                }`}
              >
                <div
                  className={`font-mono text-[11px] uppercase tracking-[0.2em] ${
                    step.current ? "text-orange-400" : "text-gray-500"
                  }`}
                >
                  {step.ver}
                </div>
                <div className="text-center font-heading text-base font-bold leading-tight text-white">
                  {step.keyword}
                </div>
                {step.current && (
                  <div className="mt-1 flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5">
                    <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
                    <span className="font-mono text-[8.5px] uppercase tracking-[0.15em] text-emerald-400">
                      Now
                    </span>
                  </div>
                )}
              </div>
              <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-gray-500">
                {step.quarter}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
