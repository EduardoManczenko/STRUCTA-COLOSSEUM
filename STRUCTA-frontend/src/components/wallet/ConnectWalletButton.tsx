"use client";

import { useEffect, useRef, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useRouter } from "next/navigation";
import { Wallet, LogOut, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  signInWithWallet,
  inferUserFromInvestor,
  WalletSignCancelledError,
} from "@/lib/wallet-auth";
import { shortAddress } from "@/lib/format";

interface Props {
  variant?: "primary" | "secondary" | "soft";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  className?: string;
  /** When true, only connects the wallet without triggering JWT sign-in */
  connectOnly?: boolean;
  /** Where to redirect after successful authentication. Defaults to /dashboard */
  redirectTo?: string | false;
  onAuthenticated?: () => void;
}

export function ConnectWalletButton({
  variant = "primary",
  size = "md",
  fullWidth,
  className,
  connectOnly,
  redirectTo = "/dashboard",
  onAuthenticated,
}: Props) {
  const wallet = useWallet();
  const walletModal = useWalletModal();
  const router = useRouter();
  const { user, refetch, signOut, setUser } = useAuth();
  const [authenticating, setAuthenticating] = useState(false);
  const triedAutoSignRef = useRef(false);

  const isInvestor = user?.role === "investor";
  const walletAddress = wallet.publicKey?.toBase58() ?? null;

  const handleAuth = async () => {
    try {
      setAuthenticating(true);
      const res = await signInWithWallet(wallet);
      setUser(inferUserFromInvestor(res.investor));
      await refetch();
      toast.success("Wallet connected successfully");
      onAuthenticated?.();
      if (redirectTo) router.push(redirectTo);
    } catch (e) {
      // User explicitly cancelled the signature in their wallet — just hint,
      // don't shout. Disconnect so the next click triggers a fresh prompt.
      if (e instanceof WalletSignCancelledError) {
        toast.message("Signature cancelled. Click again to retry.");
      } else {
        const message =
          e instanceof Error ? e.message : "Failed to authenticate";
        toast.error(message);
      }
      try {
        await wallet.disconnect();
      } catch {}
    } finally {
      setAuthenticating(false);
    }
  };

  // Auto-sign after wallet connects
  useEffect(() => {
    if (connectOnly) return;
    if (!wallet.connected || !walletAddress) return;
    if (isInvestor && user?.walletAddress === walletAddress) return;
    if (triedAutoSignRef.current) return;
    triedAutoSignRef.current = true;
    void handleAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet.connected, walletAddress, isInvestor, user?.walletAddress, connectOnly]);

  // Reset ref when wallet disconnects
  useEffect(() => {
    if (!wallet.connected) {
      triedAutoSignRef.current = false;
    }
  }, [wallet.connected]);

  if (isInvestor && wallet.connected && walletAddress) {
    return (
      <Button
        type="button"
        variant="soft"
        size={size}
        fullWidth={fullWidth}
        className={className}
        leftIcon={<Check className="size-3.5" />}
        rightIcon={<LogOut className="size-3.5 opacity-70" />}
        onClick={async () => {
          try {
            await wallet.disconnect();
          } catch {}
          signOut();
          toast.message("Wallet disconnected");
        }}
      >
        {shortAddress(walletAddress)}
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      fullWidth={fullWidth}
      className={className}
      loading={authenticating}
      leftIcon={<Wallet className="size-3.5" />}
      onClick={async () => {
        if (!wallet.connected) {
          walletModal.setVisible(true);
          return;
        }
        if (connectOnly) return;
        await handleAuth();
      }}
    >
      {authenticating
        ? "Signing…"
        : wallet.connected
          ? "Authenticate wallet"
          : "Connect Wallet"}
    </Button>
  );
}
