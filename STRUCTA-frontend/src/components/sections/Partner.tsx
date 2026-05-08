"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Award, Building2, CheckCircle2, ShieldCheck } from "lucide-react";

const CREDENTIALS = [
  {
    icon: Building2,
    metric: "12+",
    label: "Projects\ndelivered",
    color: "orange",
  },
  {
    icon: Award,
    metric: "85",
    label: "Units in\nanchor project",
    color: "purple",
  },
  {
    icon: ShieldCheck,
    metric: "ISO 9001",
    label: "Quality\nmanagement",
    color: "purple",
  },
  {
    icon: CheckCircle2,
    metric: "PBQP-H",
    label: "Level A · Housing\nquality",
    color: "orange",
  },
];

export function Partner() {
  return (
    <section
      id="partner"
      className="relative overflow-hidden border-t border-dark-700 py-32"
    >
      <div className="pointer-events-none absolute right-0 top-1/4 size-[500px] glow-orange" />

      <div className="relative mx-auto max-w-7xl px-6 md:px-12">
        <div className="mb-14 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="section-label mb-4"
          >
              06 — Anchor Partner
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="font-heading text-[44px] font-bold leading-[1.05] tracking-[-0.025em] text-white md:text-[56px]"
          >
            We are already{" "}
            <span className="gradient-text">a product.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mt-5 text-lg leading-[1.7] text-gray-400"
          >
            The first project to run on STRUCTA already has a confirmed
            developer — a consolidated operation, with over two decades
            in the market. No promises: crypto capital turning into concrete.
          </motion.p>
        </div>

        {/* Partner card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.7 }}
          className="card-base relative overflow-hidden p-8 md:p-12"
        >
          <div className="pointer-events-none absolute -right-32 -top-32 size-96 rounded-full bg-orange-500/10 blur-3xl" />

          <div className="relative grid gap-10 lg:grid-cols-[auto_1fr_auto] lg:items-center lg:gap-12">
            {/* SETTA logo */}
            <div className="flex justify-start lg:justify-center">
              <div className="rounded-2xl border border-dark-500 bg-white p-6 shadow-2xl shadow-orange-500/10">
                <Image
                  src="/images/setta-logo.png"
                  alt="SETTA Developer"
                  width={140}
                  height={180}
                  className="h-auto w-[120px] md:w-[140px]"
                  priority
                />
              </div>
            </div>

            {/* Info */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span className="rounded border border-orange-500/40 bg-orange-500/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-orange-400">
                  Anchor Partner
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-purple-300">
                  Developer
                </span>
              </div>
              <h3 className="font-heading text-4xl font-bold tracking-[-0.02em] text-white md:text-5xl">
                SETTA Developer
              </h3>
              <p className="max-w-xl text-[15px] leading-[1.7] text-gray-400">
                First developer to tokenize a project via STRUCTA.{" "}
                <strong className="text-white">
                  Consolidated operation, end-to-end banking flow.
                </strong>{" "}
                In 19 years in the market, delivered over a dozen projects
                with certified management.
              </p>
            </div>

            {/* Years badge */}
            <div className="flex items-center justify-start lg:justify-end">
              <div className="flex flex-col items-center rounded-2xl border border-orange-500/30 bg-gradient-to-br from-orange-500/10 to-transparent px-7 py-5">
                <span className="font-heading text-[64px] font-bold leading-none tracking-[-0.05em] text-orange-500">
                  19
                </span>
                <span className="mt-1 text-center text-[11px] uppercase tracking-[0.2em] text-gray-400">
                  Years in
                  <br />
                  market
                </span>
              </div>
            </div>
          </div>

          {/* Credentials */}
          <div className="relative mt-10 grid grid-cols-2 gap-3 border-t border-dark-600 pt-8 md:grid-cols-4">
            {CREDENTIALS.map((c, idx) => (
              <motion.div
                key={c.metric}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.07 }}
                className="flex flex-col gap-2 rounded-xl border border-dark-600 bg-dark-800/60 p-5"
              >
                <c.icon
                  className={`size-5 ${
                    c.color === "orange"
                      ? "text-orange-400"
                      : "text-purple-300"
                  }`}
                />
                <div className="font-heading text-2xl font-bold tabular-nums text-white">
                  {c.metric}
                </div>
                <div className="whitespace-pre-line text-[11.5px] uppercase tracking-[0.1em] text-gray-500">
                  {c.label}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Pipeline tease */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-8 flex items-center justify-center gap-3 text-[12px] uppercase tracking-[0.2em] text-gray-500"
        >
          <span className="h-px w-12 bg-dark-600" />
          <span className="font-mono">+ pipeline with 4 developers in due diligence</span>
          <span className="h-px w-12 bg-dark-600" />
        </motion.div>
      </div>
    </section>
  );
}
