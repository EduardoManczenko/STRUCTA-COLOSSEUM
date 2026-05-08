"use client";

import { motion } from "framer-motion";

const STEPS = [
  {
    n: "01",
    title: "Registration",
    sub: "Project on-chain",
    desc: "The developer submits the project. STRUCTA mints a unique SPL Token (V_XYZ) and provisions two vaults: Principal and Yield.",
    color: "orange",
  },
  {
    n: "02",
    title: "Listing",
    sub: "Deal open to holders",
    desc: "The project goes live with hard cap, soft cap, deadline and goal. Unit share of $100 USDC.",
    color: "orange",
  },
  {
    n: "03",
    title: "Fundraising",
    sub: "USDC → Principal Vault",
    desc: "Holders deposit USDC after KYT. On success → off-ramp and capital reaches the developer. On failure → automatic refund.",
    color: "purple",
  },
  {
    n: "04",
    title: "Execution",
    sub: "Construction + monthly deposit",
    desc: "During construction, the developer deposits the monthly yield in fiat. STRUCTA on-ramps and routes it to the Yield Vault.",
    color: "purple",
  },
  {
    n: "05",
    title: "Distribution & Burn",
    sub: "USDC to holders + redemption",
    desc: "The Yield Vault distributes USDC to all wallets holding the token. At project completion, burn-for-redemption returns $100 of principal.",
    color: "orange",
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="relative overflow-hidden border-t border-dark-700 py-32"
    >
      <div className="pointer-events-none absolute right-0 top-1/3 size-[500px] glow-orange" />

      <div className="relative mx-auto max-w-7xl px-6 md:px-12">
        <div className="mb-16">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="section-label mb-4"
          >
            03 — How it works
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="max-w-3xl font-heading text-[44px] font-bold leading-[1.05] tracking-[-0.025em] text-white md:text-[56px]"
          >
            5 steps, <span className="gradient-text">1 on-chain cycle.</span>
          </motion.h2>
        </div>

        {/* Vertical timeline on mobile / horizontal on desktop */}
        <div className="relative">
          {/* connector line */}
          <div className="pointer-events-none absolute left-7 top-0 hidden h-full w-px bg-gradient-to-b from-transparent via-dark-500 to-transparent lg:left-0 lg:right-0 lg:top-[60px] lg:h-px lg:w-full lg:bg-gradient-to-r" />

          <div className="grid gap-6 lg:grid-cols-5 lg:gap-4">
            {STEPS.map((step, idx) => (
              <motion.div
                key={step.n}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                className="relative flex gap-5 lg:flex-col lg:gap-0"
              >
                {/* Hex badge */}
                <div className="relative z-10 shrink-0">
                  <div
                    className={`relative flex size-14 items-center justify-center ${
                      step.color === "orange"
                        ? "drop-shadow-[0_0_18px_rgba(249,115,22,0.3)]"
                        : "drop-shadow-[0_0_18px_rgba(124,58,237,0.3)]"
                    }`}
                  >
                    <svg viewBox="0 0 100 100" className="size-14">
                      <polygon
                        points="50,8 88,29 88,71 50,92 12,71 12,29"
                        fill="#13131A"
                        stroke={step.color === "orange" ? "#F97316" : "#7C3AED"}
                        strokeWidth="3"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span
                      className={`absolute font-mono text-sm font-bold ${
                        step.color === "orange"
                          ? "text-orange-400"
                          : "text-purple-300"
                      }`}
                    >
                      {step.n}
                    </span>
                  </div>
                </div>

                <div className="card-base flex-1 p-5 lg:mt-5">
                  <div className="mb-1 font-heading text-lg font-bold text-white">
                    {step.title}
                  </div>
                  <div
                    className={`mb-3 font-mono text-[10px] uppercase tracking-[0.18em] ${
                      step.color === "orange"
                        ? "text-orange-400"
                        : "text-purple-300"
                    }`}
                  >
                    {step.sub}
                  </div>
                  <p className="text-[13px] leading-[1.6] text-gray-500">
                    {step.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
