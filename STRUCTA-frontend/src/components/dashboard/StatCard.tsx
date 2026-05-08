"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

type Tone = "purple" | "orange" | "emerald" | "sky" | "rose" | "amber";

const TONE: Record<
  Tone,
  { border: string; icon: string; ring: string; gradient: string }
> = {
  purple: {
    border: "border-purple-500/30",
    icon: "bg-purple-500/15 text-purple-300",
    ring: "shadow-purple-500/10",
    gradient: "from-purple-500/10 via-transparent to-transparent",
  },
  orange: {
    border: "border-orange-500/30",
    icon: "bg-orange-500/15 text-orange-300",
    ring: "shadow-orange-500/10",
    gradient: "from-orange-500/10 via-transparent to-transparent",
  },
  emerald: {
    border: "border-emerald-500/30",
    icon: "bg-emerald-500/15 text-emerald-300",
    ring: "shadow-emerald-500/10",
    gradient: "from-emerald-500/10 via-transparent to-transparent",
  },
  sky: {
    border: "border-sky-500/30",
    icon: "bg-sky-500/15 text-sky-300",
    ring: "shadow-sky-500/10",
    gradient: "from-sky-500/10 via-transparent to-transparent",
  },
  rose: {
    border: "border-rose-500/30",
    icon: "bg-rose-500/15 text-rose-300",
    ring: "shadow-rose-500/10",
    gradient: "from-rose-500/10 via-transparent to-transparent",
  },
  amber: {
    border: "border-amber-500/30",
    icon: "bg-amber-500/15 text-amber-300",
    ring: "shadow-amber-500/10",
    gradient: "from-amber-500/10 via-transparent to-transparent",
  },
};

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  trend?: { value: string; positive?: boolean };
  icon?: LucideIcon;
  tone?: Tone;
  className?: string;
  index?: number;
}

export function StatCard({
  label,
  value,
  hint,
  trend,
  icon: Icon,
  tone = "purple",
  className,
  index = 0,
}: StatCardProps) {
  const t = TONE[tone];
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.04 }}
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-dark-800/70 p-5 backdrop-blur-md shadow-lg",
        t.border,
        t.ring,
        className,
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-60",
          t.gradient,
        )}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-gray-400">
            {label}
          </span>
          <div className="mt-2 font-heading text-2xl font-bold tracking-tight text-white tabular-nums sm:text-3xl">
            {value}
          </div>
          {hint && <p className="mt-1 text-[12px] text-gray-500">{hint}</p>}
        </div>
        {Icon && (
          <div
            className={cn(
              "flex size-10 items-center justify-center rounded-xl border border-dark-600",
              t.icon,
            )}
          >
            <Icon className="size-5" />
          </div>
        )}
      </div>
      {trend && (
        <div
          className={cn(
            "relative mt-3 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em]",
            trend.positive
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border-rose-500/30 bg-rose-500/10 text-rose-300",
          )}
        >
          {trend.value}
        </div>
      )}
    </motion.div>
  );
}
