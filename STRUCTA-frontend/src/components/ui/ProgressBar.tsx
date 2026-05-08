"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

export function ProgressBar({
  value,
  className,
  height = 6,
  gradient = true,
  showLabel = false,
}: {
  value: number;
  className?: string;
  height?: number;
  gradient?: boolean;
  showLabel?: boolean;
}) {
  const v = Math.min(100, Math.max(0, value));
  return (
    <div className={cn("relative w-full", className)}>
      <div
        className="overflow-hidden rounded-full bg-dark-600"
        style={{ height }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${v}%` }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className={cn(
            "h-full rounded-full",
            gradient
              ? "bg-gradient-to-r from-purple-500 via-purple-400 to-orange-500"
              : "bg-purple-500",
          )}
        />
      </div>
      {showLabel && (
        <div className="mt-1 flex justify-between text-[10px] font-mono uppercase tracking-[0.18em] text-gray-500">
          <span>{v.toFixed(0)}%</span>
          <span>100%</span>
        </div>
      )}
    </div>
  );
}
