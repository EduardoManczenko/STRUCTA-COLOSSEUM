"use client";

import { useState, useCallback } from "react";
import {
  ShieldCheck,
  Wallet,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  ExternalLink,
  Key,
} from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import bs58 from "bs58";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { MultisigProgress } from "./MultisigBadge";
import { apiGet, apiPost } from "@/lib/api";
import { shortAddress } from "@/lib/format";
import type { MultisigProposal, MultisigOwnerWallet } from "@/lib/types";
import { cn } from "@/lib/cn";

interface Props {
  proposal: MultisigProposal;
  ownerWallets: MultisigOwnerWallet[];
  onSigned: (updated: MultisigProposal) => void;
}

export function MultisigSignPanel({ proposal, ownerWallets, onSigned }: Props) {
  const { publicKey, signMessage, connected } = useWallet();
  const [signing, setSigning] = useState(false);

  const walletAddress = publicKey?.toBase58() ?? null;
  const isOwner = walletAddress
    ? ownerWallets.some((w) => w.wallet_address === walletAddress)
    : false;
  const alreadySigned = walletAddress
    ? proposal.signatures.some((s) => s.wallet_address === walletAddress)
    : false;
  const isOpen = proposal.status === "open";
  const reached = proposal.signatures.length >= proposal.required_signatures;

  const handleSign = useCallback(async () => {
    if (!signMessage || !walletAddress) return;
    setSigning(true);
    try {
      // Fetch canonical message from backend
      const { message } = await apiGet<{ message: string; proposalId: string; action: string }>(
        `/admin/proposals/${proposal.id}/signing-message`,
      );

      // Sign with wallet
      const msgBytes = new TextEncoder().encode(message);
      const sigBytes = await signMessage(msgBytes);
      const signature = bs58.encode(sigBytes);

      // Submit to backend
      const updated = await apiPost<MultisigProposal>(
        `/admin/proposals/${proposal.id}/sign`,
        { walletAddress, signature, message },
      );

      toast.success("Signature recorded on-chain successfully.");
      onSigned(updated);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to sign");
    } finally {
      setSigning(false);
    }
  }, [signMessage, walletAddress, proposal.id, onSigned]);

  return (
    <div className="space-y-4 rounded-2xl border border-purple-500/30 bg-purple-500/5 p-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-4 text-purple-400" />
          <span className="font-mono text-xs font-semibold uppercase tracking-widest text-purple-300">
            On-chain Multisig · 3/5
          </span>
        </div>
        <MultisigProgress
          signed={proposal.signatures.length}
          required={proposal.required_signatures}
          total={proposal.total_signers}
        />
      </div>

      {/* Status message */}
      {reached ? (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
          <CheckCircle2 className="size-4 shrink-0" />
          Threshold reached — transaction will execute automatically.
        </div>
      ) : !isOpen ? (
        <div className="flex items-center gap-2 rounded-xl bg-gray-500/10 px-3 py-2 text-xs text-gray-400">
          <AlertCircle className="size-4 shrink-0" />
          This proposal is {proposal.status} and no longer accepting signatures.
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
          <Clock className="size-4 shrink-0" />
          Waiting for {proposal.required_signatures - proposal.signatures.length} more wallet
          signature{proposal.required_signatures - proposal.signatures.length !== 1 ? "s" : ""} to
          execute.
        </div>
      )}

      {/* Signatures collected */}
      {proposal.signatures.length > 0 && (
        <div className="space-y-1.5">
          <p className="font-mono text-[10px] uppercase tracking-widest text-gray-500">
            Signatures collected
          </p>
          {proposal.signatures.map((sig) => {
            const ownerInfo = ownerWallets.find(
              (w) => w.wallet_address === sig.wallet_address,
            );
            return (
              <div
                key={sig.id}
                className="flex items-center gap-2 rounded-lg bg-dark-800/60 px-3 py-2"
              >
                <CheckCircle2 className="size-3.5 shrink-0 text-emerald-400" />
                <span className="font-mono text-xs text-gray-300">
                  {ownerInfo?.label
                    ? `${ownerInfo.label} · `
                    : ""}
                  {shortAddress(sig.wallet_address)}
                </span>
                <span className="ml-auto font-mono text-[10px] text-gray-600">
                  {new Date(sig.signed_at).toLocaleString()}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Owner wallets awaiting */}
      {isOpen && !reached && ownerWallets.length > 0 && (
        <div className="space-y-1.5">
          <p className="font-mono text-[10px] uppercase tracking-widest text-gray-500">
            Authorized signers ({ownerWallets.length})
          </p>
          {ownerWallets.map((w) => {
            const hasSigned = proposal.signatures.some(
              (s) => s.wallet_address === w.wallet_address,
            );
            return (
              <div
                key={w.wallet_address}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2",
                  hasSigned
                    ? "bg-emerald-500/10"
                    : "bg-dark-800/40",
                )}
              >
                {hasSigned ? (
                  <CheckCircle2 className="size-3.5 shrink-0 text-emerald-400" />
                ) : (
                  <Clock className="size-3.5 shrink-0 text-gray-600" />
                )}
                <span className="font-mono text-xs text-gray-300">
                  {w.label ? (
                    <>
                      <span className="text-gray-200">{w.label}</span>
                      <span className="text-gray-600"> · {shortAddress(w.wallet_address)}</span>
                    </>
                  ) : (
                    shortAddress(w.wallet_address)
                  )}
                </span>
                {hasSigned && (
                  <span className="ml-auto font-mono text-[10px] text-emerald-500">signed</span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Sign action */}
      {isOpen && !reached && (
        <div className="border-t border-dark-700 pt-3">
          {!connected ? (
            <div className="space-y-2">
              <p className="text-xs text-gray-400">
                Connect an authorized owner wallet to sign this proposal.
              </p>
              <WalletMultiButton className="!h-9 !rounded-xl !bg-purple-600 !px-4 !py-0 !text-xs !font-semibold hover:!bg-purple-500" />
            </div>
          ) : !isOwner ? (
            <div className="flex items-start gap-2 rounded-xl bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
              <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
              <span>
                <strong>{shortAddress(walletAddress!)}</strong> is not an authorized multisig
                signer. Connect one of the configured owner wallets.
              </span>
            </div>
          ) : alreadySigned ? (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
              <CheckCircle2 className="size-4 shrink-0" />
              You already signed with <strong>{shortAddress(walletAddress!)}</strong>.
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-gray-400">
                Connected as{" "}
                <span className="font-mono text-purple-300">
                  {shortAddress(walletAddress!)}
                </span>{" "}
                — an authorized signer.
              </p>
              <Button
                onClick={handleSign}
                disabled={signing}
                size="sm"
                className="w-full bg-purple-600 hover:bg-purple-500"
              >
                {signing ? (
                  <>
                    <Loader2 className="mr-2 size-3.5 animate-spin" />
                    Signing…
                  </>
                ) : (
                  <>
                    <Key className="mr-2 size-3.5" />
                    Sign with wallet
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Executed TX */}
      {proposal.executed_tx && (
        <a
          href={`https://solscan.io/tx/${proposal.executed_tx}?cluster=devnet`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300"
        >
          <ExternalLink className="size-3" />
          View on Solscan: {shortAddress(proposal.executed_tx, 12)}
        </a>
      )}
    </div>
  );
}
