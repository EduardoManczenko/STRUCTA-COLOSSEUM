"use client";

import { motion } from "framer-motion";
import {
  AlertTriangle,
  TrendingDown,
  ShieldOff,
  Eye,
  ArrowDownRight,
} from "lucide-react";

const PAINS = [
  {
    icon: TrendingDown,
    title: "Volatile yields",
    desc: "APYs of 30% that drop to 4% in two weeks. Farming became a full-time job.",
  },
  {
    icon: ShieldOff,
    title: "Smart contract risk",
    desc: "Hacks, exploits, depegs. TVL disappears in a single transaction.",
  },
  {
    icon: Eye,
    title: "Pseudo-RWAs",
    desc: "Tokenized T-bills became a commodity. 5% in USD doesn't compete with the risk.",
  },
  {
    icon: AlertTriangle,
    title: "No real backing",
    desc: "Who guarantees the token? In 2024, RWAs without physical assets collapsed.",
  },
];

export function CryptoNativeProblem() {
  return (
    <section id="manifesto" className="relative py-32 overflow-hidden">
      <div className="pointer-events-none absolute -left-32 top-1/2 size-[500px] -translate-y-1/2 glow-purple" />

      <div className="relative mx-auto max-w-7xl px-6 md:px-12">
        <div className="grid gap-16 lg:grid-cols-[0.9fr_1.1fr] lg:gap-24">
          {/* Left — narrative */}
          <div className="flex flex-col">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5 }}
              className="section-label mb-4"
            >
              01 — For the crypto-native
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, delay: 0.05 }}
              className="font-heading text-[44px] font-bold leading-[1.05] tracking-[-0.025em] text-white md:text-[56px]"
            >
              You've farmed everything.
              <br />
              <span className="gradient-text">Tired of fake yields?</span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="mt-7 max-w-[480px] text-lg leading-[1.7] text-gray-400"
            >
              Stable only in name. Backed only in marketing. The next
              frontier of DeFi is not a new exotic LP —{" "}
              <span className="text-purple-300">
                it&apos;s crypto capital financing concrete.
              </span>
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="mt-10 rounded-xl border border-orange-500/20 bg-orange-500/5 p-5"
            >
              <div className="flex items-start gap-3">
                <ArrowDownRight className="mt-0.5 size-5 shrink-0 text-orange-400" />
                <p className="text-[15px] leading-[1.6] text-gray-300">
                  <strong className="text-white">The real opportunity:</strong>{" "}
                  the Brazilian real estate market pays{" "}
                  <span className="text-orange-400">16–22% p.a.</span> in
                  development credit. STRUCTA packages this into an SPL
                  Token — paid in USDC, distributed by contract.
                </p>
              </div>
            </motion.div>
          </div>

          {/* Right — pain grid */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {PAINS.map((pain, idx) => (
              <motion.div
                key={pain.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                className="card-base group relative flex flex-col gap-4 p-6"
              >
                <div className="flex size-10 items-center justify-center rounded-lg border border-dark-500 bg-dark-700">
                  <pain.icon className="size-4 text-orange-400" />
                </div>
                <h3 className="font-heading text-lg font-semibold text-white">
                  {pain.title}
                </h3>
                <p className="text-[13.5px] leading-[1.65] text-gray-500">
                  {pain.desc}
                </p>
                <div className="absolute right-4 top-4 font-mono text-[10px] text-gray-700">
                  0{idx + 1}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
