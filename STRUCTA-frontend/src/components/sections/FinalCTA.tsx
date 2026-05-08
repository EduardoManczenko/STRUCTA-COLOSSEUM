"use client";

import { motion } from "framer-motion";
import { ArrowRight, Mail } from "lucide-react";
import { StructaLogo } from "../ui/StructaLogo";

export function FinalCTA() {
  return (
    <section className="relative overflow-hidden border-t border-dark-700 bg-dark-950 py-32">
      <div className="pointer-events-none absolute -left-40 -top-40 size-[700px] glow-purple" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 size-[700px] glow-orange" />
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-50" />

      <div className="relative mx-auto max-w-5xl px-6 text-center md:px-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mb-10 inline-block animate-float"
        >
          <StructaLogo className="mx-auto size-32" />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="font-heading text-[48px] font-bold leading-[1.05] tracking-[-0.03em] text-white md:text-[80px]"
        >
          Credit is <em className="not-italic gradient-text">structure</em>.
          <br />
          Structure is <span className="text-orange-500">foundation</span>.
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mx-auto mt-7 max-w-2xl text-lg leading-[1.7] text-gray-400"
        >
          Let&apos;s build together the funding channel the Brazilian real
          estate market has been waiting for — and the real yield DeFi
          finally deserves.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <button className="btn-primary group">
            Connect wallet
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </button>
          <button className="btn-secondary group">
            <Mail className="size-4" />
            Join the waitlist
          </button>
        </motion.div>

        {/* Pillars */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mx-auto mt-16 grid max-w-3xl grid-cols-1 gap-4 md:grid-cols-3"
        >
          <Pillar
            word="Structure"
            desc="Backed, traceable, auditable token."
          />
          <Pillar
            word="Ascent"
            desc="Developers grow. Investors thrive."
          />
          <Pillar
            word="Trust"
            desc="The protocol that capital trusts."
          />
        </motion.div>
      </div>
    </section>
  );
}

function Pillar({ word, desc }: { word: string; desc: string }) {
  return (
    <div className="card-base p-6 text-left">
      <div className="font-heading text-lg font-bold text-white">
        {word} <span className="text-purple-400">—</span>
      </div>
      <p className="mt-1.5 text-[13px] leading-[1.55] text-gray-400">{desc}</p>
    </div>
  );
}
