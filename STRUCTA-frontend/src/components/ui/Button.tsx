"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "soft";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-gradient-to-br from-orange-500 to-orange-600 text-white border border-orange-500/40 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 hover:-translate-y-[1px] active:translate-y-0",
  secondary:
    "bg-transparent text-white border border-dark-500 hover:border-purple-500 hover:bg-purple-500/5",
  ghost:
    "bg-transparent text-orange-400 hover:text-orange-300 hover:gap-2 border-none",
  danger:
    "bg-gradient-to-br from-rose-500 to-rose-600 text-white border border-rose-500/40 shadow-lg shadow-rose-500/20 hover:shadow-rose-500/40 hover:-translate-y-[1px]",
  soft:
    "bg-purple-500/10 text-purple-300 border border-purple-500/30 hover:bg-purple-500/15 hover:border-purple-400/50",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-3.5 text-[12px] tracking-[0.06em] rounded-lg",
  md: "h-11 px-5 text-[13px] tracking-[0.06em] rounded-xl",
  lg: "h-12 px-7 text-[14px] tracking-[0.08em] rounded-xl",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
      size = "md",
      loading,
      disabled,
      leftIcon,
      rightIcon,
      fullWidth,
      className,
      children,
      ...rest
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "group relative inline-flex select-none items-center justify-center gap-2 font-semibold uppercase transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50",
          VARIANTS[variant],
          SIZES[size],
          fullWidth && "w-full",
          className,
        )}
        {...rest}
      >
        {loading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          leftIcon && <span className="-ml-0.5 inline-flex">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!loading && rightIcon && (
          <span className="-mr-0.5 inline-flex transition-transform group-hover:translate-x-0.5">
            {rightIcon}
          </span>
        )}
      </button>
    );
  },
);
