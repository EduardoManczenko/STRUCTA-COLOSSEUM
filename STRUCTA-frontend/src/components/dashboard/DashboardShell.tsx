"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useState } from "react";
import { LogOut, Menu, X, type LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { StructaLogo, StructaWordmark } from "@/components/ui/StructaLogo";
import { useAuth } from "@/components/providers/AuthProvider";
import { cn } from "@/lib/cn";
import { useWallet } from "@solana/wallet-adapter-react";
import { toast } from "sonner";

export interface DashboardNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string | number;
  exact?: boolean;
}

interface DashboardShellProps {
  navItems: DashboardNavItem[];
  title: string;
  subtitle?: string;
  variant?: "investor" | "incorporator" | "admin";
  rightSlot?: ReactNode;
  children: ReactNode;
}

const VARIANT_BADGE: Record<NonNullable<DashboardShellProps["variant"]>, { label: string; cls: string }> = {
  investor: {
    label: "Investor",
    cls: "border-orange-500/30 text-orange-300 bg-orange-500/5",
  },
  incorporator: {
    label: "Developer",
    cls: "border-purple-500/30 text-purple-300 bg-purple-500/5",
  },
  admin: {
    label: "Admin",
    cls: "border-rose-500/30 text-rose-300 bg-rose-500/5",
  },
};

export function DashboardShell({
  navItems,
  title,
  subtitle,
  variant = "investor",
  rightSlot,
  children,
}: DashboardShellProps) {
  const pathname = usePathname() ?? "/";
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, signOut } = useAuth();

  const wallet = useWallet();
  const badge = VARIANT_BADGE[variant];

  const isActive = (item: DashboardNavItem) => {
    if (item.exact) return pathname === item.href;
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  };

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-dark-900 text-white md:flex-row">
      {/* Ambient background — fixed to viewport so it's behind everything */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -left-24 top-10 size-[320px] glow-purple opacity-40 md:size-[420px]" />
        <div className="absolute right-0 top-1/2 size-[320px] glow-orange opacity-25 md:right-10 md:size-[420px]" />
        <div className="absolute inset-0 bg-grid-sm opacity-30" />
      </div>

      {/* Mobile top header — only visible below md */}
      <header className="relative z-30 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-dark-700/80 bg-dark-900/85 px-4 backdrop-blur-xl md:hidden">
        <Link href="/" className="flex items-center gap-2">
          <StructaLogo className="h-6 w-7" />
          <StructaWordmark className="text-sm" />
        </Link>
        <div className="flex items-center gap-2">
          {rightSlot}
          <button
            onClick={() => setSidebarOpen((s) => !s)}
            className="rounded-lg border border-dark-600 bg-dark-800 p-2 text-gray-300"
            aria-label="Open menu"
          >
            {sidebarOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </header>

      {/* Sidebar — fixed full height on desktop, slide-over on mobile */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 shrink-0 flex-col border-r border-dark-700/80 bg-dark-900/95 backdrop-blur-xl transition-transform md:relative md:z-20 md:h-dvh md:translate-x-0 md:bg-transparent md:backdrop-blur-none",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-dark-700/80 px-5 py-4">
          <Link
            href="/"
            className="flex items-center gap-2.5"
            onClick={() => setSidebarOpen(false)}
          >
            <StructaLogo className="h-7 w-9" />
            <StructaWordmark className="text-base" />
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg border border-dark-600 bg-dark-800 p-1.5 text-gray-400 md:hidden"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="shrink-0 border-b border-dark-700/80 px-5 py-4">
          <span
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em]",
              badge.cls,
            )}
          >
            <span className="size-1.5 animate-pulse rounded-full bg-current" />
            {badge.label}
          </span>
          <p className="mt-3 truncate text-sm text-gray-300">
            {user?.email ?? user?.walletAddress ?? "Guest"}
          </p>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition",
                  active
                    ? "border-purple-500/40 bg-purple-500/10 text-white"
                    : "border-transparent text-gray-400 hover:border-dark-600 hover:bg-dark-800/60 hover:text-gray-200",
                )}
              >
                {active && (
                  <motion.span
                    layoutId={`dashboard-active-${variant}`}
                    className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-orange-400"
                    transition={{ type: "spring", stiffness: 220, damping: 24 }}
                  />
                )}
                <Icon className="size-4 shrink-0" />
                <span className="flex-1 truncate">{item.label}</span>
                {item.badge && (
                  <span className="rounded-md bg-dark-700 px-1.5 py-0.5 font-mono text-[10px] text-gray-300">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="shrink-0 border-t border-dark-700/80 p-4">
          <button
            onClick={async () => {
              try {
                await wallet.disconnect();
              } catch {}
              signOut();
              toast.message("Signed out");
            }}
            className="flex w-full items-center gap-2 rounded-xl border border-dark-600 bg-dark-800/60 px-3 py-2.5 text-sm text-gray-300 transition hover:border-rose-500/40 hover:text-rose-300"
          >
            <LogOut className="size-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-dark-950/70 backdrop-blur-sm md:hidden"
        />
      )}

      {/* Main scrollable content */}
      <main className="relative z-10 flex-1 overflow-y-auto px-4 py-6 sm:px-6 md:h-dvh md:px-10 md:py-10">
        <div className="mx-auto w-full max-w-[1100px]">
          <div className="hidden items-end justify-between gap-4 md:flex">
            <div>
              <h1 className="font-heading text-3xl font-bold tracking-tight text-white md:text-4xl">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-1 max-w-2xl text-sm text-gray-400">{subtitle}</p>
              )}
            </div>
            <div className="flex items-center gap-2">{rightSlot}</div>
          </div>

          <div className="md:hidden">
            <h1 className="font-heading text-2xl font-bold tracking-tight text-white">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-1 text-sm text-gray-400">{subtitle}</p>
            )}
          </div>

          <div className="mt-6 md:mt-8">{children}</div>
        </div>
      </main>
    </div>
  );
}
