"use client";

import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/cn";

export function MultisigProgress({
  signed,
  required,
  total,
  className,
}: {
  signed: number;
  required: number;
  total?: number;
  className?: string;
}) {
  const pct = Math.min(100, Math.round((signed / Math.max(required, 1)) * 100));
  const reached = signed >= required;
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative h-1.5 w-20 overflow-hidden rounded-full bg-dark-600">
        <div
          className={cn(
            "absolute inset-y-0 left-0 rounded-full transition-all",
            reached
              ? "bg-emerald-400"
              : "bg-gradient-to-r from-purple-500 to-orange-400",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-gray-300">
        <ShieldCheck
          className={cn(
            "mr-0.5 inline size-3",
            reached ? "text-emerald-400" : "text-purple-300",
          )}
        />
        {signed}/{required}
        {total ? ` of ${total}` : ""}
      </span>
    </div>
  );
}
