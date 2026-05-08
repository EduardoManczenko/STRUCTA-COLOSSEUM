"use client";

import { motion } from "framer-motion";
import { Sparkles, TrendingUp } from "lucide-react";

const YIELDS = [
  {
    name: "STRUCTA",
    range: "16–22%",
    avg: 19,
    width: 100,
    asset: "Real estate receivable · Solana",
    color: "orange",
    highlight: true,
  },
  {
    name: "Tokenized T-Bills",
    range: "4.8–5.2%",
    avg: 5,
    width: 36,
    asset: "Ondo, Maple, Backed",
    color: "gray",
  },
  {
    name: "Stablecoin staking",
    range: "3–7%",
    avg: 5,
    width: 36,
    asset: "Aave, Compound, Spark",
    color: "gray",
  },
  {
    name: "RWA Credit",
    range: "6–10%",
    avg: 8,
    width: 56,
    asset: "Centrifuge, Goldfinch",
    color: "gray",
  },
  {
    name: "BTC liquid staking",
    range: "2–4%",
    avg: 3,
    width: 22,
    asset: "Babylon, Lombard",
    color: "gray",
  },
];

export function YieldComparison() {
  return (
    <section
      id="yields"
      className="relative overflow-hidden border-t border-dark-700 bg-dark-950/50 py-32"
    >
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-30" />

      <div className="relative mx-auto max-w-7xl px-6 md:px-12">
        <div className="grid gap-16 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          {/* Left — copy */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="section-label mb-4"
            >
              01 — Yield Comparison
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.05 }}
              className="font-heading text-[44px] font-bold leading-[1.05] tracking-[-0.025em] text-white md:text-[56px]"
            >
              The best RWA yield <br />
              <span className="gradient-text">available today.</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="mt-6 max-w-md text-lg leading-[1.7] text-gray-400"
            >
              Not farming. Not leverage. It&apos;s the real spread between
              the cost of global crypto capital and the rate the Brazilian
              development market has paid for decades.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-[13px] text-gray-400"
            >
              <span className="flex items-center gap-2">
                <span className="size-2.5 rounded-sm bg-orange-500" />
                STRUCTA
              </span>
              <span className="flex items-center gap-2">
                <span className="size-2.5 rounded-sm bg-dark-500" />
                Traditional RWA market
              </span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="mt-8 inline-flex items-start gap-3 rounded-xl border border-purple-500/20 bg-purple-500/5 p-4"
            >
              <Sparkles className="mt-0.5 size-4 shrink-0 text-purple-300" />
              <p className="text-[13px] leading-[1.6] text-gray-300">
                <strong className="text-white">STRUCTA Spread: 6–8%</strong>{" "}
                between the real yield captured from the project and the
                yield distributed to holders — sustained by geographic arbitrage.
              </p>
            </motion.div>
          </div>

          {/* Right — bars */}
          <div className="card-base p-7 md:p-9">
            <div className="mb-6 flex items-center justify-between border-b border-dark-600 pb-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="size-4 text-orange-400" />
                <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-gray-400">
                  APY · paid in USDC
                </span>
              </div>
              <div className="font-mono text-[10px] text-gray-600">
                SOURCE: market data 2026 Q1
              </div>
            </div>

            <div className="flex flex-col gap-5">
              {YIELDS.map((y, idx) => (
                <motion.div
                  key={y.name}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: idx * 0.08 }}
                  className="flex flex-col gap-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`font-heading text-[15px] font-semibold ${
                          y.highlight ? "text-white" : "text-gray-400"
                        }`}
                      >
                        {y.name}
                      </span>
                      {y.highlight && (
                        <span className="rounded border border-orange-500/40 bg-orange-500/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.15em] text-orange-400">
                          Target
                        </span>
                      )}
                    </div>
                    <span
                      className={`font-mono text-[13px] tabular-nums ${
                        y.highlight ? "text-orange-500" : "text-gray-500"
                      }`}
                    >
                      {y.range}
                    </span>
                  </div>
                  <div className="relative h-3 overflow-hidden rounded-full bg-dark-700">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${y.width}%` }}
                      viewport={{ once: true, margin: "-50px" }}
                      transition={{
                        duration: 1.0,
                        delay: 0.2 + idx * 0.08,
                        ease: "easeOut",
                      }}
                      className={`h-full rounded-full ${
                        y.highlight
                          ? "bg-gradient-to-r from-orange-500 via-orange-400 to-purple-400"
                          : "bg-dark-500"
                      }`}
                    />
                  </div>
                  <div className="font-mono text-[10px] text-gray-600">
                    {y.asset}
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-6 border-t border-dark-600 pt-5 text-[11px] text-gray-600">
              * Indicative targets. Real yield depends on project progress
              and unit sales schedule.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
