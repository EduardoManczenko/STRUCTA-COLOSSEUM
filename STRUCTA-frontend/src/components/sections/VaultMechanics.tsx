"use client";

import { motion } from "framer-motion";
import { Wallet, Database, Flame, ArrowDown } from "lucide-react";

export function VaultMechanics() {
  return (
    <section
      id="vault"
      className="relative overflow-hidden border-t border-dark-700 py-32"
    >
      <div className="pointer-events-none absolute -left-32 top-1/2 size-[600px] -translate-y-1/2 glow-purple" />
      <div className="pointer-events-none absolute -right-32 bottom-0 size-[500px] glow-orange" />

      <div className="relative mx-auto max-w-7xl px-6 md:px-12">
        <div className="mb-16 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="section-label mb-4"
          >
            04 — On-chain Architecture
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="font-heading text-[44px] font-bold leading-[1.05] tracking-[-0.025em] text-white md:text-[56px]"
          >
            <span className="gradient-text">3 vaults.</span> Zero
            confusion.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mt-5 text-lg leading-[1.7] text-gray-400"
          >
            Each project lives in three isolated, on-chain auditable
            accounts. Capital never mixes. The mechanics are
            deterministic.
          </motion.p>
        </div>

        {/* Diagram */}
        <div className="grid gap-10 lg:grid-cols-[1fr_320px] lg:items-start">
          {/* Diagram column */}
          <div className="relative">
            {/* Wallet (top) */}
            <DiagramNode
              icon={Wallet}
              tag="HOLDER WALLET"
              title="You"
              subtitle="SPL Token V_XYZ Holder"
              color="purple"
              delay={0}
            />

            <FlowArrow label="USDC DEPOSIT" delay={0.15} />

            {/* Vault Principal */}
            <DiagramNode
              icon={Database}
              tag="VAULT 01 — PRINCIPAL"
              title="Vault Principal V_XYZ"
              subtitle="Custodian of raised capital · goal + deadline"
              color="orange"
              delay={0.2}
              code="0x1A...4F · Solana SPL Vault"
            />

            <FlowArrow label="OFF-RAMP / CONSTRUCTION" delay={0.35} />

            {/* Vault Yield */}
            <DiagramNode
              icon={Database}
              tag="VAULT 02 — YIELD"
              title="Vault Yield V_XYZ"
              subtitle="Receives monthly deposit from the developer"
              color="purple"
              delay={0.4}
              code="0xB7...92 · Auto-distribution"
            />

            <FlowArrow label="PRO-RATA DISTRIBUTION" delay={0.55} />

            {/* Pool de queima */}
            <DiagramNode
              icon={Flame}
              tag="VAULT 03 — BURN POOL"
              title="Burn-for-Redemption Pool"
              subtitle="Replenished with unit sales. Holder burns the token and redeems $100 of principal."
              color="orange"
              delay={0.6}
              code="0xF3...01 · Open redemption"
            />
          </div>

          {/* Side controls panel */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="card-base sticky top-28 flex flex-col gap-4 p-6"
          >
            <div className="flex items-center justify-between border-b border-dark-600 pb-4">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-orange-400">
                On-chain controls
              </span>
              <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
            </div>

            <ControlRow label="Withdrawal to developer" status="MULTISIG 3/5" />
            <ControlRow label="Yield distribution" status="AUTO" />
            <ControlRow label="Burn pool opening" status="ADMIN" />
            <ControlRow label="Refund (on failure)" status="AUTO" />
            <ControlRow label="Sold units marker" status="ORACLE" />

            <div className="mt-2 rounded-lg border border-dark-500 bg-dark-700/50 p-3">
              <div className="mb-1 font-mono text-[9px] uppercase tracking-[0.2em] text-gray-500">
                Compliance
              </div>
              <div className="text-[12px] leading-[1.5] text-gray-400">
                Chainalysis KYT on frontend · US Geo-block ·
                Asset Ring-fencing · Completion Insurance
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function DiagramNode({
  icon: Icon,
  tag,
  title,
  subtitle,
  color,
  delay,
  code,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tag: string;
  title: string;
  subtitle: string;
  color: "purple" | "orange";
  delay: number;
  code?: string;
}) {
  const accent =
    color === "orange"
      ? "border-orange-500/40 from-orange-500/10 to-orange-500/5"
      : "border-purple-500/40 from-purple-500/10 to-purple-500/5";
  const iconColor =
    color === "orange" ? "text-orange-400" : "text-purple-300";
  const tagColor =
    color === "orange" ? "text-orange-400" : "text-purple-300";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay }}
      className={`card-base relative flex items-center gap-5 overflow-hidden border bg-gradient-to-br ${accent} p-5 md:p-6`}
    >
      <div
        className={`flex size-14 shrink-0 items-center justify-center rounded-xl border ${
          color === "orange"
            ? "border-orange-500/40 bg-orange-500/10"
            : "border-purple-500/40 bg-purple-500/10"
        }`}
      >
        <Icon className={`size-6 ${iconColor}`} />
      </div>
      <div className="flex-1">
        <div
          className={`mb-1 font-mono text-[10px] uppercase tracking-[0.2em] ${tagColor}`}
        >
          {tag}
        </div>
        <div className="mb-1 font-heading text-lg font-bold text-white md:text-xl">
          {title}
        </div>
        <div className="text-[13px] leading-[1.55] text-gray-400">
          {subtitle}
        </div>
        {code && (
          <div className="mt-3 inline-block rounded border border-dark-500 bg-dark-800/80 px-2.5 py-1 font-mono text-[10px] text-gray-500">
            {code}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function FlowArrow({ label, delay }: { label: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="my-3 flex flex-col items-center"
    >
      <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-gray-600">
        {label}
      </div>
      <ArrowDown className="size-4 text-orange-500" strokeWidth={2.5} />
    </motion.div>
  );
}

function ControlRow({ label, status }: { label: string; status: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-dark-700 pb-3 last:border-b-0 last:pb-0">
      <span className="text-[12.5px] text-gray-400">{label}</span>
      <span className="rounded border border-dark-500 bg-dark-800 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.15em] text-purple-300">
        {status}
      </span>
    </div>
  );
}
