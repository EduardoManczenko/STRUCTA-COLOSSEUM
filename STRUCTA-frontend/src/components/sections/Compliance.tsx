"use client";

import { motion } from "framer-motion";
import { Shield, FileCheck, Globe, Lock, Building2, Eye } from "lucide-react";

const ITEMS = [
  {
    icon: Building2,
    title: "SPE + Asset Ring-fencing",
    desc: "Each project lives in a special purpose vehicle, with capital legally segregated from the developer's balance sheet.",
  },
  {
    icon: Shield,
    title: "Construction Completion Insurance",
    desc: "Coverage contracted to guarantee project delivery even in adverse scenarios.",
  },
  {
    icon: Lock,
    title: "Audited smart contracts",
    desc: "SPL Vaults with pre-mainnet audit by recognized firms. 3/5 Multisig on critical withdrawals.",
  },
  {
    icon: Eye,
    title: "Chainalysis KYT",
    desc: "Every wallet undergoes Know-Your-Transaction verification before any deposit is confirmed.",
  },
  {
    icon: Globe,
    title: "Geo-restriction",
    desc: "Geographic block for restricted jurisdictions (including the US), activated on the frontend before connect.",
  },
  {
    icon: FileCheck,
    title: "Progressive regulatory layers",
    desc: "Lean offshore MVP, scaling to a full Brazilian institutional structure as traction consolidates.",
  },
];

export function Compliance() {
  return (
    <section className="relative overflow-hidden border-t border-dark-700 bg-dark-950/50 py-32">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-25" />

      <div className="relative mx-auto max-w-7xl px-6 md:px-12">
        <div className="mb-14 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="section-label mb-4"
          >
              07 — Compliance & Security
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="font-heading text-[44px] font-bold leading-[1.05] tracking-[-0.025em] text-white md:text-[56px]"
          >
            6 layers of protection,
            <br />
            <span className="gradient-text">from code to concrete.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mt-5 text-lg leading-[1.7] text-gray-400"
          >
            Tokenization doesn&apos;t replace rigor — it amplifies what the
            real estate market already knows how to do. We combine the legal
            infrastructure of Brazilian real estate with the on-chain
            transparency of Web3.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {ITEMS.map((item, idx) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: idx * 0.07 }}
              className="card-base group flex flex-col gap-4 p-6"
            >
              <div className="flex size-11 items-center justify-center rounded-lg border border-purple-500/30 bg-purple-500/10 transition-colors group-hover:border-orange-500/40 group-hover:bg-orange-500/10">
                <item.icon className="size-5 text-purple-300 transition-colors group-hover:text-orange-400" />
              </div>
              <h3 className="font-heading text-base font-semibold leading-snug text-white">
                {item.title}
              </h3>
              <p className="text-[13px] leading-[1.65] text-gray-500">
                {item.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
