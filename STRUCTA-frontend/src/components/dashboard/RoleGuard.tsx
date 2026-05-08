"use client";

import Link from "next/link";
import { type ReactNode, useEffect } from "react";
import { Wallet, ShieldAlert, ArrowLeft, Loader2 } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ConnectWalletButton } from "@/components/wallet/ConnectWalletButton";
import type { UserRole } from "@/lib/types";

interface RoleGuardProps {
  allow: UserRole[];
  children: ReactNode;
  loginHref?: string;
  loginLabel?: string;
}

const ROLE_LABEL: Record<UserRole, string> = {
  admin: "admin",
  incorporator: "developer",
  investor: "investor",
  pending_incorporator: "pending developer",
};

export function RoleGuard({
  allow,
  children,
  loginHref,
}: RoleGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isInvestorOnly = allow.length === 1 && allow[0] === "investor";

  // Auto-redirect to login for non-investor protected areas
  useEffect(() => {
    if (loading || isInvestorOnly) return;
    if (!user) {
      const destination = loginHref ?? "/login";
      router.replace(`${destination}?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [loading, user, isInvestorOnly, loginHref, pathname, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dark-900 text-gray-400">
        <div className="inline-flex items-center gap-2 text-sm">
          <Loader2 className="size-4 animate-spin text-purple-400" />
          Loading session…
        </div>
      </div>
    );
  }

  if (!user) {
    // Investor-only areas show the wallet connect screen
    if (isInvestorOnly) {
      return (
        <main className="relative min-h-screen bg-dark-900">
          <section className="mx-auto flex min-h-screen max-w-2xl items-center px-6">
            <Card className="w-full p-8 text-center sm:p-12">
              <div className="mx-auto flex size-14 items-center justify-center rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-300">
                <Wallet className="size-7" />
              </div>
              <h1 className="mt-6 font-heading text-3xl font-bold tracking-tight text-white">
                Connect your wallet
              </h1>
              <p className="mx-auto mt-2 max-w-md text-sm text-gray-400">
                To access your investor dashboard, authenticate with your Solana
                wallet (Phantom, Solflare or WalletConnect).
              </p>
              <div className="mt-6 flex justify-center">
                <ConnectWalletButton size="lg" redirectTo="/dashboard" />
              </div>
              <Link
                href="/"
                className="mt-6 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-gray-500 hover:text-orange-300"
              >
                <ArrowLeft className="size-3" /> Back to site
              </Link>
            </Card>
          </section>
        </main>
      );
    }
    // Non-investor areas: redirect is in progress (useEffect above), show spinner
    return (
      <div className="flex min-h-screen items-center justify-center bg-dark-900 text-gray-400">
        <div className="inline-flex items-center gap-2 text-sm">
          <Loader2 className="size-4 animate-spin text-purple-400" />
          Redirecting to login…
        </div>
      </div>
    );
  }

  if (!allow.includes(user.role)) {
    return (
      <main className="relative min-h-screen bg-dark-900">
        <section className="mx-auto flex min-h-screen max-w-2xl items-center px-6">
          <Card className="w-full p-8 text-center sm:p-12">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full border border-rose-500/30 bg-rose-500/10 text-rose-300">
              <ShieldAlert className="size-7" />
            </div>
            <h1 className="mt-6 font-heading text-3xl font-bold tracking-tight text-white">
              Access denied
            </h1>
            <p className="mt-2 text-sm text-gray-400">
              Your account ({ROLE_LABEL[user.role]}) does not have permission to
              access this area.
            </p>
            <div className="mt-6 flex justify-center">
              <Link href="/">
                <Button>Go to site</Button>
              </Link>
            </div>
          </Card>
        </section>
      </main>
    );
  }

  return <>{children}</>;
}
