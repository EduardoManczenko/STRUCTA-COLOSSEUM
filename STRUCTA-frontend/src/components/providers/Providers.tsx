"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { WalletProvider } from "./WalletProvider";
import { AuthProvider } from "./AuthProvider";
import { apiGet } from "@/lib/api";

/**
 * Pings the backend `/health` endpoint as soon as the app mounts so the
 * NestJS serverless function on Vercel is warmed up before the user clicks
 * any login / wallet button. This prevents the "Connection error — the
 * server may be starting up" toast on the first interaction.
 */
function BackendWarmup() {
  const warmedRef = useRef(false);
  useEffect(() => {
    if (warmedRef.current) return;
    warmedRef.current = true;
    apiGet("/health", { retries: 4, timeoutMs: 30_000 }).catch(() => {
      // Best-effort. The login/auth flows will retry on demand.
    });
  }, []);
  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      <WalletProvider>
        <AuthProvider>
          <BackendWarmup />
          {children}
          <Toaster
            theme="dark"
            position="top-right"
            toastOptions={{
              style: {
                background: "rgba(19,19,26,0.95)",
                border: "1px solid #22222F",
                color: "#fff",
              },
            }}
          />
        </AuthProvider>
      </WalletProvider>
    </ThemeProvider>
  );
}
