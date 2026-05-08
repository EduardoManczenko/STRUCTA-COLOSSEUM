"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  Coins,
  ExternalLink,
  Loader2,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ConnectWalletButton } from "@/components/wallet/ConnectWalletButton";
import { useAuth } from "@/components/providers/AuthProvider";
import { apiPost } from "@/lib/api";
import {
  formatNumber,
  formatPercent,
  formatUsdc,
  shortAddress,
} from "@/lib/format";
import {
  buildBuyCotasTx,
  getDevnetUsdcMint,
  getStructaProgramId,
} from "@/lib/solana";
import type {
  ChainalysisResult,
  DevelopmentDetail,
} from "@/lib/types";

interface BuyCotaModalProps {
  open: boolean;
  onClose: () => void;
  development: DevelopmentDetail;
  onPurchased?: () => void;
}

interface QuoteResponse {
  developmentId: string;
  tokenSymbol: string | null;
  cotasAmount: number;
  pricePerCotaUsdc: number;
  totalUsdc: number;
  platformFeeUsdc: number;
  grandTotalUsdc: number;
  vaultPrincipalAddress: string | null;
  walletAddress: string | null;
  onChain?: {
    program_id: string;
    usdc_mint: string;
    project_account_address: string;
    cota_mint_address: string;
    vault_principal_address: string;
    vault_yield_address: string;
    burn_pool_address: string;
    project_authority_pda: string;
    tokenPriceUsdcBaseUnits: number;
    seedNonce?: number;
  };
}

interface PurchaseResponse {
  purchase: {
    id: string;
    cotas_amount: number;
    total_usdc: number;
  };
  tx_signature: string | null;
  total_raised_usdc: number;
  on_chain_cota_balance?: string;
}

type Step = "amount" | "compliance" | "review" | "success";

const RISK_BADGE = {
  low: { label: "Low risk", cls: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300" },
  medium: { label: "Medium risk", cls: "border-amber-500/40 bg-amber-500/10 text-amber-300" },
  high: { label: "High risk", cls: "border-orange-500/40 bg-orange-500/10 text-orange-300" },
  severe: { label: "Severe risk", cls: "border-rose-500/40 bg-rose-500/10 text-rose-300" },
} as const;

export function BuyCotaModal({
  open,
  onClose,
  development,
  onPurchased,
}: BuyCotaModalProps) {
  const { user } = useAuth();
  const router = useRouter();
  const wallet = useWallet();
  const { connection } = useConnection();
  const [step, setStep] = useState<Step>("amount");
  const [cotas, setCotas] = useState<number>(1);
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [compliance, setCompliance] = useState<
    (ChainalysisResult & { id: string }) | null
  >(null);
  const [loadingCompliance, setLoadingCompliance] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [purchase, setPurchase] = useState<PurchaseResponse | null>(null);

  const isAuthenticated = user?.role === "investor";
  const walletReady =
    isAuthenticated &&
    wallet.connected &&
    wallet.publicKey?.toBase58() === user?.walletAddress;

  const price = Number(development.token_price_usdc ?? 0);
  const tokenSymbol = development.token_symbol ?? "COTA";

  const totalEstimate = useMemo(() => {
    if (!cotas || cotas <= 0 || !price) return 0;
    return +(cotas * price).toFixed(6);
  }, [cotas, price]);

  useEffect(() => {
    if (!open) {
      setStep("amount");
      setQuote(null);
      setCompliance(null);
      setPurchase(null);
      setCotas(1);
    }
  }, [open]);

  async function fetchQuote() {
    if (!walletReady) {
      toast.error("Connect and authenticate your wallet first.");
      return;
    }
    if (cotas <= 0) {
      toast.error("Please enter the number of shares.");
      return;
    }
    setLoadingQuote(true);
    try {
      const res = await apiPost<QuoteResponse>("/purchases/quote", {
        developmentId: development.id,
        cotasAmount: cotas,
      });
      setQuote(res);
      setStep("compliance");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Quote error");
    } finally {
      setLoadingQuote(false);
    }
  }

  async function runCompliance() {
    if (!walletReady || !user?.walletAddress) return;
    setLoadingCompliance(true);
    try {
      const res = await apiPost<ChainalysisResult & { id: string }>(
        "/compliance/screen",
        {
          walletAddress: user.walletAddress,
          developmentId: development.id,
          amountUsdc: quote?.totalUsdc,
        },
      );
      setCompliance(res);
      if (res.status === "rejected") {
        toast.error("Wallet blocked by Chainalysis. Purchase not allowed.");
      } else {
        toast.success("Compliance approved");
        setStep("review");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Compliance error");
    } finally {
      setLoadingCompliance(false);
    }
  }

  async function confirmPurchase() {
    if (!compliance || compliance.status !== "approved") return;
    if (!wallet.publicKey || !wallet.signTransaction) {
      toast.error("Wallet disconnected.");
      return;
    }
    setConfirming(true);
    try {
      // 1) Build the on-chain buy_cotas transaction. We prefer the program
      //    id / USDC mint returned by /quote, falling back to the env vars.
      const programId = quote?.onChain?.program_id
        ? new PublicKey(quote.onChain.program_id)
        : getStructaProgramId();
      const usdcMint = quote?.onChain?.usdc_mint
        ? new PublicKey(quote.onChain.usdc_mint)
        : getDevnetUsdcMint();

      const tx = await buildBuyCotasTx({
        connection,
        wallet: {
          publicKey: wallet.publicKey,
          signTransaction: wallet.signTransaction,
        },
        programId,
        developmentId: development.id,
        usdcMint,
        amount: BigInt(cotas),
        seedNonce: quote?.onChain?.seedNonce ?? 0,
      });

      // 2) Investor signs.
      const signed = await wallet.signTransaction(tx);

      // 3) Submit & confirm.
      const sig = await connection.sendRawTransaction(signed.serialize(), {
        skipPreflight: false,
      });
      await connection.confirmTransaction(sig, "confirmed");

      // 4) Notify backend so it persists the purchase row + ledger update.
      const res = await apiPost<PurchaseResponse>("/purchases/confirm", {
        developmentId: development.id,
        cotasAmount: cotas,
        complianceCheckId: compliance.id,
        clientTxSignature: sig,
      });
      setPurchase({ ...res, tx_signature: res.tx_signature ?? sig });
      setStep("success");
      onPurchased?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Purchase failed");
    } finally {
      setConfirming(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={`Buy Shares · ${development.nome_comercial ?? development.nome}`}
      description={
        development.token_symbol
          ? `Token ${development.token_symbol} · ${formatUsdc(price)} per share`
          : "Acquire tokenized shares in USDC"
      }
    >
      <Stepper step={step} />

      {!walletReady && (
        <div className="mt-4 rounded-2xl border border-orange-500/30 bg-orange-500/5 p-4">
          <div className="flex items-start gap-3">
            <Wallet className="size-5 text-orange-300" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">
                Connect and authenticate your Solana wallet
              </p>
              <p className="mt-1 text-[12px] text-gray-400">
                You need to sign a message with your wallet to authenticate
                the purchase.
              </p>
              <div className="mt-3">
                <ConnectWalletButton />
              </div>
            </div>
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {step === "amount" && (
          <motion.div
            key="amount"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.25 }}
            className="mt-4 grid gap-4"
          >
            <Input
              label="Number of shares"
              type="number"
              min={1}
              step={1}
              value={cotas || ""}
              onChange={(e) => setCotas(Math.max(0, Number(e.target.value)))}
              hint={`Each share costs ${formatUsdc(price)} (estimated price)`}
            />
            <div className="grid grid-cols-2 gap-3">
              {[1, 5, 10, 25].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setCotas(n)}
                  className={`rounded-xl border px-3 py-2 text-sm transition ${
                    cotas === n
                      ? "border-orange-500/60 bg-orange-500/10 text-orange-200"
                      : "border-dark-600 bg-dark-900/60 text-gray-300 hover:border-purple-500/40"
                  }`}
                >
                  {n} share{n > 1 ? "s" : ""}
                </button>
              ))}
            </div>
            <div className="rounded-2xl border border-dark-600 bg-dark-900/60 p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-gray-500">
                Estimated total
              </p>
              <p className="mt-1 font-heading text-3xl font-bold text-white tabular-nums">
                {formatUsdc(totalEstimate)}
              </p>
              <p className="mt-1 text-[12px] text-gray-500">
                {formatNumber(cotas, 0)} {tokenSymbol} ·{" "}
                {formatPercent(development.yield_apy_percent ?? 0, 1)} target APY
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-dark-700 pt-4">
              <Button variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={fetchQuote}
                loading={loadingQuote}
                disabled={!walletReady || cotas <= 0}
              >
                Get Quote
              </Button>
            </div>
          </motion.div>
        )}

        {step === "compliance" && quote && (
          <motion.div
            key="compliance"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.25 }}
            className="mt-4 grid gap-4"
          >
            <SummaryCard quote={quote} />
            <div className="rounded-2xl border border-purple-500/30 bg-purple-500/5 p-5">
              <div className="flex items-start gap-3">
                <ShieldCheck className="size-6 text-purple-300" />
                <div className="flex-1">
                  <p className="font-heading text-base font-semibold text-white">
                    Compliance Verification
                  </p>
                  <p className="mt-1 text-[13px] text-gray-400">
                    Before processing the purchase, your wallet will be analyzed
                    by the Chainalysis API. This verification is mandatory and
                    will check exposure to sanctions (OFAC), mixers, and
                    illicit activities.
                  </p>
                </div>
              </div>
              {compliance && (
                <div className="mt-4 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] ${RISK_BADGE[compliance.riskLevel].cls}`}
                    >
                      <ShieldCheck className="size-3" />
                      {RISK_BADGE[compliance.riskLevel].label}
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-gray-400">
                      Risk score: {compliance.riskScore}/100
                    </span>
                  </div>
                  {compliance.identifications.length > 0 && (
                    <ul className="space-y-1.5 rounded-xl border border-dark-600 bg-dark-900/60 p-3 text-[12px] text-gray-300">
                      {compliance.identifications.map((id) => (
                        <li key={id.name} className="flex gap-2">
                          <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-300" />
                          <span>
                            <strong className="text-white">{id.name}</strong>{" "}
                            ({id.category}) — {id.description}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {compliance.status === "rejected" && (
                    <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-[12px] text-rose-200">
                      Your wallet was rejected during compliance verification.
                      The purchase cannot be completed.
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-dark-700 pt-4">
              <Button variant="secondary" onClick={() => setStep("amount")}>
                Back
              </Button>
              <Button
                onClick={runCompliance}
                loading={loadingCompliance}
                disabled={compliance?.status === "rejected"}
              >
                {compliance ? "Retry Verification" : "Start Verification"}
              </Button>
            </div>
          </motion.div>
        )}

        {step === "review" && quote && compliance && (
          <motion.div
            key="review"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.25 }}
            className="mt-4 grid gap-4"
          >
            <SummaryCard quote={quote} />
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="size-5 text-emerald-300" />
                <div>
                  <p className="text-sm text-emerald-200">
                    Compliance approved · {RISK_BADGE[compliance.riskLevel].label}
                  </p>
                  <p className="text-[11px] text-gray-400">
                    Wallet {shortAddress(user?.walletAddress, 6)} ·
                    score {compliance.riskScore}/100
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-dark-600 bg-dark-900/60 p-4 text-[12px] text-gray-400">
              By confirming you authorize the transfer of{" "}
              <strong className="text-white">
                {formatUsdc(quote.totalUsdc)}
              </strong>{" "}
              in USDC to the project&apos;s principal vault. The transaction is
              recorded on-chain and your shares will be minted to your connected
              wallet address.
            </div>
            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-dark-700 pt-4">
              <Button variant="secondary" onClick={() => setStep("compliance")}>
                Back
              </Button>
              <Button
                onClick={confirmPurchase}
                loading={confirming}
                rightIcon={<Sparkles className="size-4" />}
              >
                Confirm and buy
              </Button>
            </div>
          </motion.div>
        )}

        {step === "success" && purchase && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.3 }}
            className="mt-4 grid gap-4 text-center"
          >
            <div className="mx-auto flex size-14 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
              <CheckCircle2 className="size-7" />
            </div>
            <h3 className="font-heading text-2xl font-bold text-white">
              Purchase confirmed
            </h3>
            <p className="text-sm text-gray-400">
              {formatNumber(purchase.purchase.cotas_amount, 0)} {tokenSymbol}{" "}
              have been minted to your wallet for{" "}
              {formatUsdc(purchase.purchase.total_usdc)}.
            </p>
            {purchase.tx_signature && (
              <a
                href={`https://solscan.io/tx/${purchase.tx_signature}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-dark-600 bg-dark-900/60 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-purple-300 hover:text-orange-300"
              >
                {shortAddress(purchase.tx_signature, 8)}
                <ExternalLink className="size-3" />
              </a>
            )}
            <div className="mt-2 flex flex-wrap items-center justify-center gap-3 border-t border-dark-700 pt-4">
              <Button variant="secondary" onClick={onClose}>
                Close
              </Button>
              <Button
                onClick={() => { onClose(); router.push("/dashboard/cotas"); }}
                rightIcon={<Coins className="size-4" />}
              >
                View my shares
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
}

function SummaryCard({ quote }: { quote: QuoteResponse }) {
  return (
    <div className="grid grid-cols-2 gap-2 rounded-2xl border border-dark-600 bg-dark-900/60 p-4 text-sm">
      <Row label="Shares" value={formatNumber(quote.cotasAmount, 0)} />
      <Row label="Unit price" value={formatUsdc(quote.pricePerCotaUsdc)} />
      <Row
        label="Total to pay"
        value={formatUsdc(quote.totalUsdc)}
        highlight
      />
      {quote.vaultPrincipalAddress && (
        <Row
          label="Principal vault"
          value={shortAddress(quote.vaultPrincipalAddress, 6)}
          mono
        />
      )}
    </div>
  );
}

function Row({
  label,
  value,
  highlight,
  mono,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col">
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-gray-500">
        {label}
      </span>
      <span
        className={`mt-0.5 ${highlight ? "font-heading text-lg font-bold text-orange-300" : "text-white"} ${mono ? "font-mono text-[12px]" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}

function Stepper({ step }: { step: Step }) {
  const steps: Array<{ id: Step; label: string }> = [
    { id: "amount", label: "Amount" },
    { id: "compliance", label: "Compliance" },
    { id: "review", label: "Review" },
    { id: "success", label: "Confirmation" },
  ];
  const currentIndex = steps.findIndex((s) => s.id === step);
  return (
    <div className="flex flex-wrap items-center gap-2">
      {steps.map((s, i) => {
        const active = i === currentIndex;
        const done = i < currentIndex;
        return (
          <div
            key={s.id}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] ${
              active
                ? "border-orange-500/40 bg-orange-500/10 text-orange-200"
                : done
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                  : "border-dark-600 bg-dark-900/60 text-gray-500"
            }`}
          >
            <span
              className={`flex size-4 items-center justify-center rounded-full border ${
                active
                  ? "border-orange-500/60"
                  : done
                    ? "border-emerald-500/40"
                    : "border-dark-500"
              }`}
            >
              {done ? <CheckCircle2 className="size-3" /> : i + 1}
            </span>
            {s.label}
            {loadingFor(step, s.id) && (
              <Loader2 className="size-3 animate-spin" />
            )}
          </div>
        );
      })}
    </div>
  );
}

function loadingFor(_current: Step, _of: Step) {
  return false;
}
