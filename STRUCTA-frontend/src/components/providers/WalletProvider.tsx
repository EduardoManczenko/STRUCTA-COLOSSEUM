"use client";

import { useCallback, useMemo, type ReactNode } from "react";
import {
  ConnectionProvider,
  WalletProvider as SolanaWalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { WalletAdapterNetwork, WalletError } from "@solana/wallet-adapter-base";
import { clusterApiUrl } from "@solana/web3.js";
import { config } from "@/lib/config";

import "@solana/wallet-adapter-react-ui/styles.css";

// Errors that come from the user explicitly cancelling/rejecting an action in
// their wallet. These are *expected* and should never bubble up as red console
// errors / Next.js dev overlays / Sentry events.
const EXPECTED_USER_CANCEL_NAMES = new Set([
  "WalletSignMessageError",
  "WalletSignTransactionError",
  "WalletSendTransactionError",
  "WalletConnectionError",
  "WalletNotConnectedError",
  "WalletNotReadyError",
  "WalletDisconnectedError",
  "WalletWindowClosedError",
  "WalletWindowBlockedError",
]);

function isExpectedWalletError(err: unknown): boolean {
  if (!err) return false;
  const name = (err as { name?: string })?.name ?? "";
  const message = (err as { message?: string })?.message ?? "";
  if (EXPECTED_USER_CANCEL_NAMES.has(name)) return true;
  if (/user rejected|user cancel|window closed|user denied/i.test(message)) {
    return true;
  }
  return false;
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const network =
    config.solanaNetwork === "mainnet-beta"
      ? WalletAdapterNetwork.Mainnet
      : config.solanaNetwork === "testnet"
        ? WalletAdapterNetwork.Testnet
        : WalletAdapterNetwork.Devnet;

  const endpoint = useMemo(
    () => config.solanaRpcUrl || clusterApiUrl(network),
    [network],
  );

  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    [],
  );

  // The default `onError` of @solana/wallet-adapter-react logs every error to
  // console.error, which Next.js dev overlay (and Sentry, etc.) escalate as
  // an unhandled crash. We want user-driven cancellations to be silent — they
  // are not bugs.
  const handleWalletError = useCallback((err: WalletError) => {
    if (isExpectedWalletError(err)) {
      // Soft log only in development, never show a red overlay.
      if (process.env.NODE_ENV !== "production") {
        console.info(`[wallet] user cancelled: ${err.name}`);
      }
      return;
    }
    console.warn("[wallet] error:", err);
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider
        wallets={wallets}
        autoConnect
        onError={handleWalletError}
      >
        <WalletModalProvider>{children}</WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
}
