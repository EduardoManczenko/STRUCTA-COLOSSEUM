"use client";

import Link from "next/link";
import { ArrowRight, Building2, Shield, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { StructaLogo } from "../ui/StructaLogo";

export function Hero() {
  return (
    <section
      id="hero"
      className="relative flex min-h-screen items-center overflow-hidden pt-32"
    >
      {/* Ambient gradients */}
      <div className="pointer-events-none absolute -right-20 -top-20 size-[500px] glow-purple md:-right-40 md:-top-40 md:size-[700px]" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 size-[400px] glow-orange md:-bottom-40 md:-left-40 md:size-[600px]" />

      {/* Grid background */}
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-60" />

      {/* Conic accent */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 size-[1100px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40 conic-bg blur-3xl" />

      <div className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-12 px-5 sm:px-8 md:px-12 lg:grid-cols-[1.1fr_0.9fr]">
        {/* LEFT — copy */}
        <div className="flex flex-col">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 inline-flex w-fit items-center gap-3 rounded-full border border-orange-500/30 bg-orange-500/5 px-4 py-1.5"
          >
            <span className="size-1.5 animate-pulse rounded-full bg-orange-500" />
            <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-orange-400">
              Seed Round Open · 2026 Q2
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.05 }}
            className="break-words font-heading text-[42px] font-bold leading-[0.98] tracking-[-0.035em] text-white sm:text-[56px] md:text-[80px] lg:text-[90px]"
          >
            Real yield,{" "}
            <span className="gradient-text">backed by real estate.</span>
            <br />
            Paid in USDC.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="mt-7 max-w-[560px] text-lg leading-[1.7] text-gray-400"
          >
            Tokenized Brazilian real estate credit on Solana. Escape
            volatile DeFi yields and capture the real arbitrage of the
            development market — with on-chain transparency and auditable
            physical backing.
          </motion.p>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="mt-9 grid w-fit grid-cols-3 gap-x-10 gap-y-2"
          >
            <Stat
              label="APY Target"
              value="19%"
              accent
            />
            <Stat label="Distributed in" value="USDC" />
            <Stat label="Network" value="Solana" />
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35 }}
            className="mt-10 flex flex-wrap items-center gap-4"
          >
            <Link href="/empreendimentos" className="btn-primary group">
              Explore deals
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link href="/login" className="btn-secondary group">
              <Building2 className="size-4" />
              List your project
            </Link>
          </motion.div>

          {/* Trust strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="mt-12 pb-2 flex flex-wrap items-center gap-x-7 gap-y-3 text-[11px] uppercase tracking-[0.2em] text-gray-600"
          >
            <span className="flex items-center gap-2">
              <Shield className="size-3.5 text-purple-400" /> SPE +
              Asset Ring-fencing
            </span>
            <span className="flex items-center gap-2">
              <Zap className="size-3.5 text-purple-400" /> Solana SPL Token
            </span>
          </motion.div>
        </div>

        {/* RIGHT — animated logo + floating cards */}
        <div className="relative flex items-center justify-center">
          {/* Glow halo behind logo */}
          <div className="absolute inset-0 m-auto size-[280px] rounded-full bg-gradient-to-br from-purple-500/20 via-transparent to-orange-500/20 blur-3xl md:size-[420px]" />

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.0, ease: "easeOut" }}
            className="relative"
          >
            <div className="animate-float">
              <StructaLogo className="size-[260px] sm:size-[340px] md:size-[420px] lg:size-[460px]" />
            </div>
          </motion.div>

          {/* Floating mini-card top right */}
          <motion.div
            initial={{ opacity: 0, x: 20, y: -10 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6 }}
            className="absolute right-2 top-12 hidden md:block"
          >
            <div className="card-base flex w-[210px] flex-col gap-3 p-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-gray-500">
                  Vault Yield
                </span>
                <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
              </div>
              <div className="font-heading text-2xl font-bold tabular-nums text-white">
                +1,167.42 <span className="text-orange-500">USDC</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-gray-500">Distributed today</span>
                <span className="rounded bg-emerald-400/10 px-1.5 py-0.5 font-mono text-[10px] text-emerald-400">
                  +19.4%
                </span>
              </div>
            </div>
          </motion.div>

          {/* Floating mini-card bottom left */}
          <motion.div
            initial={{ opacity: 0, x: -20, y: 10 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 0.7, delay: 0.75 }}
            className="absolute -left-2 bottom-12 hidden md:block"
          >
            <div className="card-base flex w-[230px] flex-col gap-3 p-4">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-orange-400">
                  Active fundraising
                </span>
              </div>
              <div className="font-heading text-base font-semibold text-white">
                SETTA Building · #001
              </div>
              <div className="h-[5px] overflow-hidden rounded bg-dark-600">
                <div
                  className="h-full rounded bg-gradient-to-r from-purple-500 to-purple-400"
                  style={{ width: "68%" }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-gray-500">68% raised</span>
                <span className="font-mono text-orange-500">$340K / $500K</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  accent,
  suffix,
}: {
  label: string;
  value: string;
  accent?: boolean;
  suffix?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-mono text-[9.5px] uppercase tracking-[0.25em] text-gray-600">
        {label}
      </span>
      <span
        className={`font-heading text-2xl font-bold tabular-nums ${accent ? "text-orange-500" : "text-white"}`}
      >
        {value}
        {suffix && (
          <span className="ml-1 font-mono text-[10px] font-normal text-gray-500">
            {suffix}
          </span>
        )}
      </span>
    </div>
  );
}
