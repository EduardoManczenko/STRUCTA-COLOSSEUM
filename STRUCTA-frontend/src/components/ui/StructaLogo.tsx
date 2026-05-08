import { cn } from "@/lib/cn";

type StructaLogoProps = {
  className?: string;
  strokeColor?: string;
  variant?: "color" | "mono-orange" | "mono-white";
};

export function StructaLogo({
  className,
  strokeColor = "#F97316",
  variant = "color",
}: StructaLogoProps) {
  const cubeTop =
    variant === "mono-orange"
      ? "#F97316"
      : variant === "mono-white"
        ? "#FFFFFF"
        : "#8B5CF6";
  const cubeLeft =
    variant === "mono-orange"
      ? "#EA580C"
      : variant === "mono-white"
        ? "rgba(255,255,255,0.7)"
        : "#7C3AED";
  const cubeRight =
    variant === "mono-orange"
      ? "#C2410C"
      : variant === "mono-white"
        ? "rgba(255,255,255,0.4)"
        : "#5B21B6";

  return (
    <svg
      viewBox="0 0 292 215"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-auto w-auto", className)}
      aria-label="STRUCTA logo"
    >
      <line x1="146" y1="105" x2="146" y2="10" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="146" y1="105" x2="228" y2="58" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="146" y1="105" x2="228" y2="152" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="146" y1="105" x2="146" y2="200" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="146" y1="105" x2="64" y2="152" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="146" y1="105" x2="64" y2="58" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" />
      <polygon
        points="146,10 228,58 228,152 146,200 64,152 64,58"
        stroke={strokeColor}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* cubo direito */}
      <polygon points="177,52 207,70 207,105 177,88" fill={cubeLeft} />
      <polygon points="237,52 237,88 207,105 207,70" fill={cubeRight} />
      <polygon points="207,35 237,52 207,70 177,52" fill={cubeTop} />
      {/* cubo central */}
      <polygon points="116,87 146,105 146,140 116,123" fill={cubeLeft} />
      <polygon points="176,87 176,123 146,140 146,105" fill={cubeRight} />
      <polygon points="146,70 176,87 146,105 116,87" fill={cubeTop} />
      {/* cubo esquerdo */}
      <polygon points="55,122 85,140 85,175 55,158" fill={cubeLeft} />
      <polygon points="115,122 115,158 85,175 85,140" fill={cubeRight} />
      <polygon points="85,105 115,122 85,140 55,122" fill={cubeTop} />
    </svg>
  );
}

export function StructaWordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "font-heading text-[13px] font-bold uppercase tracking-[0.32em] text-white",
        className,
      )}
    >
      STRUCT<span className="text-orange-500">A</span>
    </span>
  );
}
