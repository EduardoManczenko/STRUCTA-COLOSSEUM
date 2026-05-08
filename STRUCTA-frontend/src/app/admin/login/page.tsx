"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ShieldCheck, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { apiPost, apiGet, auth, ApiError } from "@/lib/api";
import { useAuth } from "@/components/providers/AuthProvider";
import type { AuthUser } from "@/lib/types";
import { AdminWalletPill } from "@/components/admin/AdminWalletPill";
import { useAdminWallet } from "@/components/admin/AdminWalletPill";
import { shortAddress } from "@/lib/format";

interface LoginResponse {
  access_token: string;
  user: AuthUser;
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <AdminLoginInner />
    </Suspense>
  );
}

function LoadingScreen() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
      <Loader2 className="size-5 animate-spin text-purple-400" />
    </main>
  );
}

function AdminLoginInner() {
  const router = useRouter();
  const search = useSearchParams();
  const { user, loading, setUser } = useAuth();
  const { isConnected: walletConnected, isAuthority, expectedAuthority } =
    useAdminWallet();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [warming, setWarming] = useState(false);
  const warmedRef = useRef(false);

  // Already logged in as admin → go to admin panel
  useEffect(() => {
    if (!loading && user?.role === "admin") {
      const redirect = search?.get("redirect") ?? "/admin";
      router.replace(redirect);
    }
  }, [loading, user, router, search]);

  // Warm up the serverless backend with multiple retries so the first
  // login request never hits a cold-start delay.
  useEffect(() => {
    if (warmedRef.current) return;
    warmedRef.current = true;
    setWarming(true);
    apiGet("/health", { retries: 4, timeoutMs: 30_000 })
      .catch(() => {/* warm-up best-effort */})
      .finally(() => setWarming(false));
  }, []);

  function friendlyError(err: unknown): string {
    if (err instanceof ApiError && err.status === 0) {
      return "Couldn't reach the server. Please check your connection and try again.";
    }
    if (err instanceof ApiError && err.status >= 500) {
      return "The server is temporarily unavailable. Please try again in a moment.";
    }
    if (err instanceof Error) return err.message;
    return "Something went wrong. Please try again.";
  }

  async function attemptLogin(): Promise<void> {
    // apiPost auto-retries network errors + 5xx with backoff and 25s timeout.
    const res = await apiPost<LoginResponse>(
      "/auth/login",
      {
        email: email.trim().toLowerCase(),
        password,
      },
      { retries: 3, timeoutMs: 30_000 },
    );

    if (res.user.role !== "admin") {
      toast.error("This account does not have admin access.");
      return;
    }

    auth.setToken(res.access_token);
    setUser(res.user);
    toast.success("Welcome back!");
    const redirect = search?.get("redirect") ?? "/admin";
    router.replace(redirect);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error("Enter your email and password");
      return;
    }
    setSubmitting(true);
    try {
      await attemptLogin();
    } catch (err) {
      toast.error(friendlyError(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingScreen />;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-4">
      <div className="w-full max-w-sm">
        {/* Logo mark */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl border border-purple-500/30 bg-purple-500/10">
            <ShieldCheck className="size-6 text-purple-400" />
          </div>
          <div className="text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-purple-400">
              Structa Admin
            </p>
            <h1 className="mt-1 font-heading text-xl font-bold text-white">
              Sign in to continue
            </h1>
          </div>
        </div>

        {/* Form */}
        <form
          onSubmit={(e) => void handleSubmit(e)}
          className="space-y-4 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 backdrop-blur-sm"
        >
          <div className="space-y-1.5">
            <label className="block font-mono text-[11px] uppercase tracking-widest text-gray-500">
              Email
            </label>
            <input
              type="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@structa.io"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none transition focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/20"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block font-mono text-[11px] uppercase tracking-widest text-gray-500">
              Password
            </label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 pr-11 text-sm text-white placeholder:text-gray-600 outline-none transition focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/20"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-300"
              >
                {showPw ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || warming}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-500 disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Signing in…
              </>
            ) : warming ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Connecting…
              </>
            ) : (
              "Sign in"
            )}
          </button>

          {/* Wallet section — separate from email/password sign-in */}
          <div className="mt-3 border-t border-white/10 pt-4">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-gray-500">
              Protocol authority wallet
            </p>
            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <p className="text-[11px] text-gray-400">
                Required to approve projects and run on-chain operations:
              </p>
              <p className="mt-1 break-all font-mono text-[11px] text-purple-300">
                {shortAddress(expectedAuthority, 6)}
              </p>
              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="font-mono text-[10px] uppercase tracking-widest text-gray-500">
                  {walletConnected
                    ? isAuthority
                      ? "Authority connected"
                      : "Wrong wallet"
                    : "Not connected"}
                </span>
                <AdminWalletPill compact />
              </div>
            </div>
          </div>
        </form>

        <p className="mt-6 text-center font-mono text-[10px] uppercase tracking-widest text-gray-700">
          Admin access only · Not a public area
        </p>
      </div>
    </main>
  );
}
