"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X, LayoutDashboard, Building2, Wallet } from "lucide-react";
import { StructaLogo, StructaWordmark } from "./ui/StructaLogo";
import { cn } from "@/lib/cn";
import { useAuth } from "./providers/AuthProvider";
import { ConnectWalletButton } from "./wallet/ConnectWalletButton";

const NAV_ITEMS = [
  { label: "Investments", href: "/empreendimentos" },
  { label: "How it works", href: "/#how-it-works" },
  { label: "Yields", href: "/#yields" },
  { label: "Vault", href: "/#vault" },
  { label: "Roadmap", href: "/#roadmap" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);


  const dashboardHref =
    user?.role === "admin"
      ? "/admin"
      : user?.role === "incorporator"
        ? "/incorporadora"
        : "/dashboard";

  return (
    <>
      <nav
        className={cn(
          "fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between px-6 transition-all duration-300 md:px-12",
          scrolled
            ? "border-b border-dark-600 bg-dark-900/85 backdrop-blur-xl"
            : "border-b border-transparent bg-transparent",
        )}
      >
        <Link href="/" className="flex items-center gap-3">
          <StructaLogo className="h-8 w-10" />
          <StructaWordmark />
        </Link>

        <ul className="hidden items-center gap-8 lg:flex">
          {NAV_ITEMS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-gray-400 transition-colors hover:text-orange-500"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-2 md:flex">
          {/* Separator */}
          <div className="h-8 w-px bg-dark-600" />

          {/* Developer CTA */}
          <Link
            href="/login"
            className="group flex flex-col items-center gap-0.5 rounded-xl border border-dark-600 bg-dark-800/60 px-4 py-2 transition hover:border-purple-500/40 hover:bg-purple-500/5"
          >
            <span className="font-mono text-[8px] uppercase tracking-[0.22em] text-gray-600 group-hover:text-purple-400">
              Real estate
            </span>
            <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.15em] text-gray-300 group-hover:text-purple-200">
              <Building2 className="size-3" />
              For developers
            </span>
          </Link>

          {/* Investor CTA / Dashboard */}
          {user ? (
            <Link
              href={dashboardHref}
              className="group flex flex-col items-center gap-0.5 rounded-xl border border-orange-500/40 bg-gradient-to-br from-orange-500 to-orange-600 px-4 py-2 shadow-md shadow-orange-500/20 transition hover:shadow-orange-500/30"
            >
              <span className="font-mono text-[8px] uppercase tracking-[0.22em] text-orange-200/70">
                Investor
              </span>
              <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.15em] text-white">
                <LayoutDashboard className="size-3" strokeWidth={2.5} />
                Dashboard
              </span>
            </Link>
          ) : (
            <div className="flex flex-col items-center gap-0.5">
              <span className="font-mono text-[8px] uppercase tracking-[0.22em] text-gray-600">
                Investors
              </span>
              <ConnectWalletButton
                size="sm"
                redirectTo="/dashboard"
                className="!py-1.5"
              />
            </div>
          )}
        </div>

        <button
          onClick={() => setOpen((v) => !v)}
          className="rounded-lg border border-dark-500 bg-dark-800/80 p-2 text-gray-300 md:hidden"
          aria-label="Menu"
        >
          {open ? <X className="size-4" /> : <Menu className="size-4" />}
        </button>
      </nav>

      {/* Mobile menu panel — rendered as sibling of <nav> so it isn't affected by
          the navbar's backdrop-filter (which would otherwise create a new
          containing block for fixed descendants and collapse this panel). */}
      {open && (
        <div className="fixed inset-x-0 bottom-0 top-16 z-[60] overflow-y-auto border-b border-dark-600 bg-dark-900 md:hidden">
          <div className="space-y-1 px-5 py-5">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2.5 font-mono text-[11px] uppercase tracking-[0.2em] text-gray-300 hover:bg-dark-800 hover:text-orange-300"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-3 grid gap-2 border-t border-dark-700 pt-3">
              <div>
                <p className="mb-1 px-1 font-mono text-[9px] uppercase tracking-[0.22em] text-gray-600">
                  Real estate developers
                </p>
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-xl border border-dark-500 bg-dark-800/60 px-3 py-2.5 text-[12px] font-semibold uppercase tracking-[0.08em] text-gray-300"
                >
                  <Building2 className="size-3.5" />
                  For developers
                </Link>
              </div>
              <div>
                <p className="mb-1 px-1 font-mono text-[9px] uppercase tracking-[0.22em] text-gray-600">
                  Investors
                </p>
                {user ? (
                  <Link
                    href={dashboardHref}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-center gap-2 rounded-xl border border-orange-500/40 bg-gradient-to-br from-orange-500 to-orange-600 px-3 py-2.5 text-[12px] font-semibold uppercase tracking-[0.08em] text-white"
                  >
                    <LayoutDashboard className="size-3.5" />
                    Dashboard
                  </Link>
                ) : (
                  <ConnectWalletButton fullWidth size="sm" redirectTo="/dashboard" />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
