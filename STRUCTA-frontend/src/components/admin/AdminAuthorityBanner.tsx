"use client";

import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { ShieldAlert, Wallet, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAdminWallet } from "./AdminWalletPill";
import { shortAddress } from "@/lib/format";

interface Props {
  /** When true, only renders if there is a problem (not connected / wrong wallet) */
  onlyOnProblem?: boolean;
  className?: string;
}

export function AdminAuthorityBanner({ onlyOnProblem = true, className }: Props) {
  const walletModal = useWalletModal();
  const { isConnected, isAuthority, walletAddress, expectedAuthority } =
    useAdminWallet();

  if (onlyOnProblem && isConnected && isAuthority) return null;

  if (!isConnected) {
    return (
      <div
        className={`flex flex-wrap items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100 ${className ?? ""}`}
      >
        <ShieldAlert className="size-5 shrink-0 text-amber-300" />
        <div className="flex-1">
          <p className="font-semibold text-amber-100">Wallet not connected</p>
          <p className="mt-0.5 text-xs text-amber-200/80">
            Connect the protocol authority wallet (
            <span className="font-mono">{shortAddress(expectedAuthority)}</span>
            ) to approve projects, deploy contracts and run on-chain operations.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => walletModal.setVisible(true)}
          leftIcon={<Wallet className="size-3.5" />}
          className="border border-amber-400/40 bg-amber-500/20 text-amber-100 hover:bg-amber-500/30"
        >
          Connect wallet
        </Button>
      </div>
    );
  }

  if (!isAuthority) {
    return (
      <div
        className={`flex flex-wrap items-center gap-3 rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100 ${className ?? ""}`}
      >
        <ShieldAlert className="size-5 shrink-0 text-rose-300" />
        <div className="flex-1">
          <p className="font-semibold text-rose-100">Wrong wallet connected</p>
          <p className="mt-0.5 text-xs text-rose-200/80">
            You are connected as{" "}
            <span className="font-mono">{shortAddress(walletAddress)}</span> —
            but admin actions require the protocol authority{" "}
            <span className="font-mono">{shortAddress(expectedAuthority)}</span>
            . Switch wallet in Phantom or disconnect to choose another.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-wrap items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100 ${className ?? ""}`}
    >
      <ShieldCheck className="size-5 shrink-0 text-emerald-300" />
      <div className="flex-1">
        <p className="font-semibold text-emerald-100">
          Admin authority connected
        </p>
        <p className="mt-0.5 text-xs text-emerald-200/80">
          Connected as{" "}
          <span className="font-mono">{shortAddress(walletAddress)}</span> — you
          can approve projects and execute on-chain operations.
        </p>
      </div>
    </div>
  );
}
