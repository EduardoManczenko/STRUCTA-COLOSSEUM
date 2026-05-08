"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  KeyRound,
  Wallet,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { apiPost, apiGet, auth, ApiError } from "@/lib/api";
import { useAuth } from "@/components/providers/AuthProvider";
import { StructaLogo, StructaWordmark } from "@/components/ui/StructaLogo";
import type { AuthUser } from "@/lib/types";

interface LoginResponse {
  access_token: string;
  user: AuthUser;
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-dark-900 text-gray-400">
          Loading…
        </main>
      }
    >
      <LoginPageInner />
    </Suspense>
  );
}

const PERKS = [
  "Tokenize your real estate projects on Solana",
  "Raise capital in USDC from global investors",
  "Full on-chain transparency for your buyers",
  "Automated yield distribution — no manual work",
  "Compliance-ready: Chainalysis integration built-in",
];

function LoginPageInner() {
  const router = useRouter();
  const search = useSearchParams();
  const { setUser, refetch } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const warmedRef = useRef(false);

  // Warm up the serverless backend so first login doesn't hit a cold start.
  // We retry up to 4 times with backoff so a slow Vercel boot doesn't surface
  // as an error to the user.
  useEffect(() => {
    if (warmedRef.current) return;
    warmedRef.current = true;
    apiGet("/health", { retries: 4, timeoutMs: 30_000 }).catch(() => {
      // best-effort — login will retry on demand
    });
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

  async function doLogin() {
    // apiPost auto-retries network errors and 5xx responses, with a 25s
    // per-attempt timeout — enough to survive a serverless cold start.
    const res = await apiPost<LoginResponse>(
      "/auth/login",
      {
        email: email.trim().toLowerCase(),
        password,
      },
      { retries: 3, timeoutMs: 30_000 },
    );

    // Account exists but is awaiting admin approval
    if (res.user.role === "pending_incorporator") {
      toast.info(
        "Your registration is under review. We'll notify you once approved.",
        { duration: 8000 },
      );
      return;
    }

    auth.setToken(res.access_token);
    setUser(res.user);
    await refetch();
    toast.success(`Welcome back${res.user.full_name ? `, ${res.user.full_name}` : ""}!`);
    const redirect = search?.get("redirect");
    if (redirect) {
      router.replace(redirect);
    } else if (res.user.role === "admin") {
      router.replace("/admin");
    } else if (res.user.role === "incorporator") {
      router.replace("/incorporadora");
    } else {
      router.replace("/dashboard");
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter your email and password");
      return;
    }
    setSubmitting(true);
    try {
      await doLogin();
    } catch (err) {
      toast.error(friendlyError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-dark-900">
      {/* Background */}
      <div className="pointer-events-none absolute -left-40 top-0 size-[400px] glow-purple opacity-30 lg:size-[600px]" />
      <div className="pointer-events-none absolute -right-40 bottom-0 size-[400px] glow-orange opacity-25 lg:size-[500px]" />
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-25" />

      <div className="relative z-10 mx-auto grid min-h-screen max-w-7xl px-5 sm:px-8 md:px-12 lg:grid-cols-2">
        {/* LEFT — value prop */}
        <div className="flex flex-col justify-center py-14 lg:py-24 lg:pr-16">
          <Link
            href="/"
            className="mb-10 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-gray-500 transition hover:text-orange-400"
          >
            <ArrowLeft className="size-3.5" />
            Back to site
          </Link>

          <Link href="/" className="mb-8 flex items-center gap-3">
            <StructaLogo className="h-9 w-11" />
            <StructaWordmark className="text-lg" />
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/5 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-purple-400">
              <Building2 className="size-3.5" />
              For real estate developers
            </span>

            <h1 className="break-words font-heading text-[34px] font-bold leading-[1.05] tracking-[-0.03em] text-white sm:text-[40px] md:text-[52px]">
              Tokenize your{" "}
              <span className="gradient-text">real estate projects</span> and
              reach global investors.
            </h1>

            <p className="mt-5 max-w-lg text-base leading-relaxed text-gray-400">
              Join Structa as a verified developer and raise capital on-chain —
              USDC fundraising, automated yield distribution, and full
              transparency for your buyers.
            </p>

            <ul className="mt-8 space-y-3">
              {PERKS.map((perk) => (
                <li key={perk} className="flex min-w-0 items-start gap-3 text-sm text-gray-300">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-400" />
                  <span className="min-w-0 break-words">{perk}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Register CTA */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-10"
          >
            <div className="rounded-2xl border border-orange-500/20 bg-gradient-to-br from-orange-500/10 to-orange-600/5 p-6">
              <p className="font-heading text-lg font-semibold text-white">
                New to Structa?
              </p>
              <p className="mt-1 text-sm text-gray-400">
                Apply to list your projects — our team reviews every submission
                and will contact you within 48 hours.
              </p>
              <Link href="/cadastro/incorporadora" className="mt-4 inline-flex">
                <Button
                  variant="primary"
                  rightIcon={<ArrowRight className="size-4" />}
                >
                  Apply as a developer
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* RIGHT — login form */}
        <div className="flex flex-col items-center justify-center py-10 lg:border-l lg:border-dark-700/60 lg:py-24 lg:pl-16">
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="w-full max-w-sm"
          >
            <div className="mb-8">
              <h2 className="font-heading text-2xl font-bold tracking-tight text-white">
                Sign in
              </h2>
              <p className="mt-1 text-sm text-gray-400">
                Access your developer or admin dashboard.
              </p>
            </div>

            <Card>
              <CardContent className="pt-6">
                <form onSubmit={submit} className="grid gap-4">
                  <Input
                    label="Email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    rightSlot={<Building2 className="size-4" />}
                  />
                  <Input
                    label="Password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    rightSlot={<KeyRound className="size-4" />}
                  />
                  <Button fullWidth size="lg" loading={submitting} type="submit">
                    Sign in
                  </Button>
                </form>

                <div className="mt-5 flex items-start gap-3 rounded-xl border border-dark-600 bg-dark-900/60 p-3">
                  <Wallet className="mt-0.5 size-4 shrink-0 text-orange-400" />
                  <p className="text-[12px] leading-relaxed text-gray-400">
                    <span className="font-semibold text-white">Investor?</span>{" "}
                    Use{" "}
                    <Link
                      href="/"
                      className="text-orange-400 hover:text-orange-300"
                    >
                      Connect Wallet
                    </Link>{" "}
                    on the homepage — authentication is via Solana signature, no
                    password needed.
                  </p>
                </div>
              </CardContent>
            </Card>

            <p className="mt-6 text-center text-[12px] text-gray-500">
              Don&apos;t have an account yet?{" "}
              <Link
                href="/cadastro/incorporadora"
                className="font-semibold text-purple-300 hover:text-orange-300"
              >
                Apply as a developer →
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
