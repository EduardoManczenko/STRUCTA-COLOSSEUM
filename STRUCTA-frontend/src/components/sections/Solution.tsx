"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import {
  Calculator,
  TrendingUp,
  Wallet,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

const MIN_AMOUNT = 100;
const MAX_AMOUNT = 250_000;
const MIN_APY = 16;
const MAX_APY = 22;

function formatUsdc(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatUsdcDetailed(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function Solution() {
  const [amount, setAmount] = useState(10_000);
  const [apy, setApy] = useState(19);
  const [rawInput, setRawInput] = useState("10,000");

  const projection = useMemo(() => {
    const monthlyRate = apy / 100 / 12;
    const yearly = amount * (apy / 100);
    const monthly = amount * monthlyRate;
    const total = amount + yearly;
    return { yearly, monthly, total };
  }, [amount, apy]);

  return (
    <section className="relative overflow-hidden border-t border-dark-700 bg-dark-950/30 py-32">
      <div className="pointer-events-none absolute inset-0 bg-grid-sm opacity-30" />

      <div className="relative mx-auto max-w-7xl px-6 md:px-12">
        <div className="mb-14 flex flex-col items-start lg:items-center lg:text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="section-label mb-4"
          >
            02 — The bridge
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="font-heading text-[44px] font-bold leading-[1.05] tracking-[-0.025em] text-white md:text-[56px]"
          >
            Crypto capital.{" "}
            <span className="gradient-text">Brazilian concrete.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-6 max-w-2xl text-lg leading-[1.7] text-gray-400"
          >
            STRUCTA is the protocol that connects global crypto liquidity to
            the scarcest funding in the real estate market: construction
            start capital. You finance the most expensive part of the cycle
            and capture the highest yield.
          </motion.p>
        </div>

        {/* Interactive yield simulator */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="relative mx-auto max-w-5xl overflow-hidden"
        >
          {/* Glow accents */}
          <div className="pointer-events-none absolute -left-12 top-10 size-48 rounded-full bg-purple-500/15 blur-3xl md:-left-24 md:size-72" />
          <div className="pointer-events-none absolute -right-12 bottom-10 size-48 rounded-full bg-orange-500/15 blur-3xl md:-right-24 md:size-72" />

          <div className="card-base relative overflow-hidden p-6 md:p-10">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl border border-orange-500/30 bg-orange-500/10">
                  <Calculator className="size-5 text-orange-400" />
                </div>
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-orange-400">
                    Yield simulator
                  </div>
                  <div className="font-heading text-lg font-bold text-white">
                    Calculate your earnings
                  </div>
                </div>
              </div>
              <span className="hidden items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-emerald-300 sm:inline-flex">
                <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
                Live preview
              </span>
            </div>

            <div className="grid gap-8 lg:grid-cols-[1.05fr_1fr]">
              {/* LEFT — controls */}
              <div className="space-y-7">
                {/* Amount input */}
                <div>
                  <div className="mb-3 flex items-end justify-between">
                    <label
                      htmlFor="sim-amount"
                      className="font-mono text-[10px] uppercase tracking-[0.18em] text-gray-400"
                    >
                      <Wallet className="mr-1.5 inline size-3 text-purple-400" />
                      Amount to invest
                    </label>
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-gray-500">
                      USDC
                    </span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-heading text-2xl font-bold text-gray-500">
                      $
                    </span>
                    <input
                      id="sim-amount"
                      type="text"
                      inputMode="numeric"
                      value={rawInput}
                      onChange={(e) => {
                        // strip everything except digits
                        const digits = e.target.value.replace(/[^\d]/g, "");
                        const v = digits === "" ? 0 : parseInt(digits, 10);
                        const clamped = Math.min(v, MAX_AMOUNT);
                        setRawInput(clamped.toLocaleString("en-US"));
                        setAmount(clamped);
                      }}
                      onBlur={() => {
                        const clamped = Math.max(MIN_AMOUNT, Math.min(amount, MAX_AMOUNT));
                        setAmount(clamped);
                        setRawInput(clamped.toLocaleString("en-US"));
                      }}
                      className="w-full rounded-xl border border-dark-500 bg-dark-900/70 py-4 pl-10 pr-4 font-heading text-2xl font-bold text-white tabular-nums outline-none transition focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/20"
                    />
                  </div>
                  <input
                    type="range"
                    min={MIN_AMOUNT}
                    max={MAX_AMOUNT}
                    step={100}
                    value={amount}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setAmount(v);
                      setRawInput(v.toLocaleString("en-US"));
                    }}
                    className="structa-slider mt-4 w-full"
                  />
                  <div className="mt-2 flex justify-between font-mono text-[10px] uppercase tracking-[0.15em] text-gray-500">
                    <span>{formatUsdc(MIN_AMOUNT)}</span>
                    <span>{formatUsdc(MAX_AMOUNT)}</span>
                  </div>

                  {/* Quick presets */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {[1_000, 5_000, 10_000, 50_000, 100_000].map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => { setAmount(v); setRawInput(v.toLocaleString("en-US")); }}
                        className={`rounded-lg border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.15em] transition ${
                          amount === v
                            ? "border-purple-500/60 bg-purple-500/10 text-purple-200"
                            : "border-dark-500 bg-dark-800/50 text-gray-400 hover:border-purple-500/30 hover:text-purple-300"
                        }`}
                      >
                        {formatUsdc(v)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* APY slider */}
                <div>
                  <div className="mb-3 flex items-end justify-between">
                    <label
                      htmlFor="sim-apy"
                      className="font-mono text-[10px] uppercase tracking-[0.18em] text-gray-400"
                    >
                      <TrendingUp className="mr-1.5 inline size-3 text-orange-400" />
                      Target APY
                    </label>
                    <span className="font-heading text-2xl font-bold tabular-nums text-orange-500">
                      {apy.toFixed(1)}%
                      <span className="ml-1 font-mono text-[10px] font-normal text-gray-500">
                        a.a.
                      </span>
                    </span>
                  </div>
                  <input
                    id="sim-apy"
                    type="range"
                    min={MIN_APY}
                    max={MAX_APY}
                    step={0.5}
                    value={apy}
                    onChange={(e) => setApy(Number(e.target.value))}
                    className="structa-slider w-full"
                  />
                  <div className="mt-2 flex justify-between font-mono text-[10px] uppercase tracking-[0.15em] text-gray-500">
                    <span>{MIN_APY}% min</span>
                    <span>{MAX_APY}% max</span>
                  </div>
                </div>
              </div>

              {/* RIGHT — projection */}
              <div className="relative flex flex-col rounded-2xl border border-orange-500/20 bg-gradient-to-br from-orange-500/5 via-dark-900/40 to-purple-500/5 p-6">
                <div className="mb-1 flex items-center gap-2">
                  <Sparkles className="size-3.5 text-orange-400" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-orange-400">
                    Projected return
                  </span>
                </div>
                <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-gray-500">
                  After 12 months
                </div>

                <div className="mt-4 flex items-baseline gap-3">
                  <div className="break-all font-heading text-[30px] font-bold leading-none tabular-nums text-white sm:text-[36px] md:text-[44px]">
                    {formatUsdcDetailed(projection.total)}
                  </div>
                </div>

                <div className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 font-mono text-[11px] tabular-nums text-emerald-300">
                  + {formatUsdcDetailed(projection.yearly)} earned
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-dark-600 bg-dark-900/50 p-3.5">
                    <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-gray-500">
                      Monthly yield
                    </div>
                    <div className="mt-1 font-heading text-lg font-bold text-emerald-300 tabular-nums">
                      {formatUsdcDetailed(projection.monthly)}
                    </div>
                  </div>
                  <div className="rounded-xl border border-dark-600 bg-dark-900/50 p-3.5">
                    <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-gray-500">
                      Yearly yield
                    </div>
                    <div className="mt-1 font-heading text-lg font-bold text-orange-300 tabular-nums">
                      {formatUsdcDetailed(projection.yearly)}
                    </div>
                  </div>
                </div>

                <Link
                  href="/empreendimentos"
                  className="group mt-6 inline-flex items-center justify-center gap-2 rounded-xl border border-orange-500/40 bg-gradient-to-br from-orange-500 to-orange-600 px-5 py-3 text-sm font-semibold uppercase tracking-[0.06em] text-white shadow-lg shadow-orange-500/20 transition hover:shadow-orange-500/40"
                >
                  Explore live deals
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Custom slider styles */}
      <style jsx>{`
        .structa-slider {
          -webkit-appearance: none;
          appearance: none;
          height: 6px;
          background: linear-gradient(
            to right,
            #a855f7 0%,
            #f97316 100%
          );
          border-radius: 999px;
          outline: none;
        }
        .structa-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #ffffff;
          border: 3px solid #f97316;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(249, 115, 22, 0.4);
          transition: transform 0.15s ease;
        }
        .structa-slider::-webkit-slider-thumb:hover {
          transform: scale(1.12);
        }
        .structa-slider::-moz-range-thumb {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #ffffff;
          border: 3px solid #f97316;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(249, 115, 22, 0.4);
        }
        .structa-slider::-webkit-inner-spin-button,
        .structa-slider::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
      `}</style>
    </section>
  );
}
