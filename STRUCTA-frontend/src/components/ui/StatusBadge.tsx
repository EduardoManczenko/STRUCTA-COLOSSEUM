import { cn } from "@/lib/cn";
import type {
  DevelopmentStatus,
  IncorporatorStatus,
} from "@/lib/types";

type Tone = "purple" | "orange" | "emerald" | "rose" | "amber" | "sky" | "gray";

const TONE_CLASSES: Record<Tone, string> = {
  purple: "bg-purple-500/15 text-purple-300 border-purple-500/30",
  orange: "bg-orange-500/15 text-orange-300 border-orange-500/30",
  emerald: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  rose: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  amber: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  sky: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  gray: "bg-dark-600/60 text-gray-300 border-dark-500",
};

const DEVELOPMENT_LABELS: Record<DevelopmentStatus, { label: string; tone: Tone }> = {
  rascunho: { label: "Draft", tone: "gray" },
  pendente: { label: "Under review", tone: "amber" },
  aprovado: { label: "Approved", tone: "emerald" },
  recusado: { label: "Rejected", tone: "rose" },
  venda_aberta: { label: "Sale open", tone: "orange" },
  em_construcao: { label: "Under construction", tone: "sky" },
  distribuindo_yield: { label: "Distributing yield", tone: "purple" },
  aguardando_burn: { label: "Awaiting burn", tone: "purple" },
  finalizado: { label: "Finalized", tone: "emerald" },
  cancelado: { label: "Cancelled", tone: "gray" },
};

const INCORPORATOR_LABELS: Record<IncorporatorStatus, { label: string; tone: Tone }> = {
  pendente: { label: "Pending", tone: "amber" },
  aprovada: { label: "Approved", tone: "emerald" },
  recusada: { label: "Rejected", tone: "rose" },
  suspensa: { label: "Suspended", tone: "gray" },
};

export function DevelopmentStatusBadge({ status }: { status: DevelopmentStatus }) {
  const cfg = DEVELOPMENT_LABELS[status];
  return <Badge tone={cfg.tone}>{cfg.label}</Badge>;
}

export function IncorporatorStatusBadge({
  status,
}: {
  status: IncorporatorStatus;
}) {
  const cfg = INCORPORATOR_LABELS[status];
  return <Badge tone={cfg.tone}>{cfg.label}</Badge>;
}

export function Badge({
  tone = "gray",
  children,
  className,
}: {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.16em]",
        TONE_CLASSES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
