export function formatUsdc(value: number | null | undefined, opts?: { compact?: boolean }) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    notation: opts?.compact ? "compact" : "standard",
  }).format(Number(value));
}

/** @deprecated All monetary values are displayed in USD. Use formatUsdc instead. */
export function formatBrl(value: number | null | undefined, opts?: { compact?: boolean }) {
  return formatUsdc(value, opts);
}

export function formatNumber(value: number | null | undefined, fraction = 2) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: fraction,
    maximumFractionDigits: fraction,
  }).format(Number(value));
}

export function formatPercent(
  value: number | null | undefined,
  fraction = 2,
) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return `${new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: fraction,
    maximumFractionDigits: fraction,
  }).format(Number(value))}%`;
}

export function formatDate(value: string | null | undefined, lang = "pt-BR") {
  if (!value) return "—";
  return new Intl.DateTimeFormat(lang, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function formatDateLong(value: string | null | undefined, lang = "pt-BR") {
  if (!value) return "—";
  return new Intl.DateTimeFormat(lang, {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export function shortAddress(addr: string | null | undefined, chars = 4) {
  if (!addr) return "—";
  return `${addr.slice(0, chars)}…${addr.slice(-chars)}`;
}

export function pct(part: number, total: number): number {
  if (!total || total <= 0) return 0;
  return Math.min(100, Math.max(0, (part / total) * 100));
}
