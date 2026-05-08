"use client";

import { useMemo } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import {
  ShieldCheck,
  ShieldAlert,
  Wallet,
  LogOut,
  Loader2,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import { config } from "@/lib/config";
import { shortAddress } from "@/lib/format";
import { cn } from "@/lib/cn";

interface Props {
  className?: string;
  /** Compact rendering for narrow contexts (header on mobile, etc.) */
  compact?: boolean;
}

export function AdminWalletPill({ className, compact }: Props) {
  const wallet = useWallet();
  const walletModal = useWalletModal();

  const walletAddress = wallet.publicKey?.toBase58() ?? null;
  const isAuthority = walletAddress === config.authorityWallet;

  const status = useMemo(() => {
    if (wallet.connecting || wallet.disconnecting) return "connecting" as const;
    if (!wallet.connected || !walletAddress) return "disconnected" as const;
    return isAuthority ? "authority" : "wrong-wallet";
  }, [
    wallet.connecting,
    wallet.disconnecting,
    wallet.connected,
    walletAddress,
    isAuthority,
  ]);

  const handleClick = async () => {
    if (status === "disconnected") {
      walletModal.setVisible(true);
      return;
    }
    if (status === "wrong-wallet" || status === "authority") {
      try {
        await wallet.disconnect();
        toast.message("Wallet disconnected");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to disconnect");
      }
    }
  };

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!walletAddress) return;
    try {
      await navigator.clipboard.writeText(walletAddress);
      toast.success("Address copied");
    } catch {
      toast.error("Could not copy");
    }
  };

  if (status === "disconnected") {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          "group inline-flex items-center gap-2 rounded-xl border border-purple-500/40 bg-purple-500/10 px-3.5 py-2 text-xs font-semibold text-purple-200 transition hover:border-purple-400 hover:bg-purple-500/20 hover:text-white",
          className,
        )}
      >
        <Wallet className="size-3.5" />
        Connect admin wallet
      </button>
    );
  }

  if (status === "connecting") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-2 rounded-xl border border-purple-500/40 bg-purple-500/10 px-3.5 py-2 text-xs font-semibold text-purple-200",
          className,
        )}
      >
        <Loader2 className="size-3.5 animate-spin" />
        Connecting…
      </span>
    );
  }

  const visualClasses =
    status === "authority"
      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200 hover:border-emerald-400/60"
      : "border-rose-500/40 bg-rose-500/10 text-rose-200 hover:border-rose-400/60";

  return (
    <div
      className={cn(
        "group inline-flex items-center gap-2 rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition",
        visualClasses,
        className,
      )}
    >
      <span
        className={cn(
          "flex size-6 items-center justify-center rounded-lg",
          status === "authority"
            ? "bg-emerald-500/20 text-emerald-300"
            : "bg-rose-500/20 text-rose-300",
        )}
        title={
          status === "authority"
            ? "Connected wallet is the protocol authority"
            : "This wallet is NOT the protocol authority — admin actions will be rejected"
        }
      >
        {status === "authority" ? (
          <ShieldCheck className="size-3.5" />
        ) : (
          <ShieldAlert className="size-3.5" />
        )}
      </span>

      <button
        type="button"
        onClick={handleCopy}
        className="font-mono text-[11px] tracking-wider hover:underline"
        title="Copy full address"
      >
        {compact ? shortAddress(walletAddress!, 3) : shortAddress(walletAddress!, 4)}
      </button>

      {!compact && (
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] opacity-70">
          {status === "authority" ? "authority" : "wrong wallet"}
        </span>
      )}

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          void handleClick();
        }}
        className="ml-1 rounded-md border border-white/10 bg-black/20 p-1 opacity-70 transition hover:opacity-100"
        title="Disconnect"
      >
        <LogOut className="size-3" />
      </button>

      <button
        type="button"
        onClick={handleCopy}
        className="rounded-md border border-white/10 bg-black/20 p-1 opacity-70 transition hover:opacity-100"
        title="Copy address"
      >
        <Copy className="size-3" />
      </button>
    </div>
  );
}

export function useAdminWallet() {
  const wallet = useWallet();
  const walletAddress = wallet.publicKey?.toBase58() ?? null;
  const isAuthority = walletAddress === config.authorityWallet;
  return {
    wallet,
    walletAddress,
    isAuthority,
    isConnected: wallet.connected && walletAddress !== null,
    expectedAuthority: config.authorityWallet,
  };
}
