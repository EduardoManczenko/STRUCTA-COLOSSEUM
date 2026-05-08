"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Coins,
  Copy,
  Droplet,
  ExternalLink,
  Github,
  Globe,
  Loader2,
  ScanLine,
  Sparkles,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ConnectWalletButton } from "@/components/wallet/ConnectWalletButton";
import { useAuth } from "@/components/providers/AuthProvider";
import { apiPost } from "@/lib/api";
import { config } from "@/lib/config";
import { deserializeBackendTx } from "@/lib/solana";
import { formatNumber, shortAddress } from "@/lib/format";
import { cn } from "@/lib/cn";

interface FaucetMintResponse {
  transactionBase64: string;
  amountHuman: number;
  amountBaseUnits: string;
  usdcMint: string;
  recipient: string;
  recipientAta: string;
}

const SOLANA_FAUCET_URL = "https://faucet.solana.com/";
const PHANTOM_DEVNET_HELP =
  "https://help.phantom.com/hc/en-us/articles/4406399317011-How-do-I-change-my-network";
const SOLFLARE_DEVNET_HELP =
  "https://docs.solflare.com/solflare/general/install-solflare/install-solflare";
const USDC_DECIMALS = 6;
const DEFAULT_MINT_AMOUNT = 100_000;

export default function InvestorDevnetPage() {
  const { user } = useAuth();
  const wallet = useWallet();
  const { connection } = useConnection();

  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [usdcBalance, setUsdcBalance] = useState<number | null>(null);
  const [loadingBalances, setLoadingBalances] = useState(false);
  const [minting, setMinting] = useState(false);
  const [lastMintSig, setLastMintSig] = useState<string | null>(null);

  const walletAddress = wallet.publicKey?.toBase58() ?? null;
  const isInvestor = user?.role === "investor";
  const walletReady =
    isInvestor &&
    wallet.connected &&
    walletAddress &&
    walletAddress === user?.walletAddress;

  const usdcMint = useMemo(() => new PublicKey(config.usdcMint), []);

  const refreshBalances = useCallback(async () => {
    if (!wallet.publicKey) {
      setSolBalance(null);
      setUsdcBalance(null);
      return;
    }
    setLoadingBalances(true);
    try {
      const [lamports, parsed] = await Promise.all([
        connection.getBalance(wallet.publicKey, "confirmed"),
        connection.getParsedTokenAccountsByOwner(wallet.publicKey, {
          mint: usdcMint,
        }),
      ]);
      setSolBalance(lamports / 1_000_000_000);
      const total = parsed.value.reduce((acc, { account }) => {
        const info = account.data.parsed?.info?.tokenAmount;
        const ui = info?.uiAmount;
        return acc + (typeof ui === "number" ? ui : 0);
      }, 0);
      setUsdcBalance(total);
    } catch (err) {
      console.warn("[devnet] failed to refresh balances", err);
    } finally {
      setLoadingBalances(false);
    }
  }, [connection, wallet.publicKey, usdcMint]);

  useEffect(() => {
    void refreshBalances();
  }, [refreshBalances]);

  async function copy(text: string, label = "Copied") {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(label);
    } catch {
      toast.error("Failed to copy");
    }
  }

  async function handleMintUsdc() {
    if (!walletReady || !wallet.publicKey || !wallet.signTransaction) {
      toast.error("Connect and authenticate your wallet first.");
      return;
    }
    setMinting(true);
    setLastMintSig(null);
    try {
      const res = await apiPost<FaucetMintResponse>("/faucet/usdc", {
        walletAddress: wallet.publicKey.toBase58(),
        amountHuman: String(DEFAULT_MINT_AMOUNT),
      });

      const tx = deserializeBackendTx(res.transactionBase64);
      const signed = await wallet.signTransaction(tx);
      const sig = await connection.sendRawTransaction(signed.serialize(), {
        skipPreflight: false,
      });
      await connection.confirmTransaction(sig, "confirmed");

      setLastMintSig(sig);
      toast.success(
        `+${formatNumber(res.amountHuman, 0)} fake USDC added to your wallet`,
      );
      await refreshBalances();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Mint failed";
      toast.error(message);
    } finally {
      setMinting(false);
    }
  }

  const enoughSol = (solBalance ?? 0) >= 0.05;
  const hasUsdc = (usdcBalance ?? 0) > 0;

  const stepStatus: Record<1 | 2 | 3 | 4, "done" | "pending" | "active"> = {
    1: walletReady ? "done" : "active",
    2: walletReady ? "done" : "pending",
    3: walletReady ? (enoughSol ? "done" : "active") : "pending",
    4: walletReady && enoughSol ? (hasUsdc ? "done" : "active") : "pending",
  };

  return (
    <div className="space-y-8">
      {/* ── Hero ────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-3xl border border-purple-500/30 bg-gradient-to-br from-purple-500/15 via-dark-800/70 to-orange-500/10 p-6 backdrop-blur-md sm:p-8"
      >
        <div className="pointer-events-none absolute -right-20 -top-20 size-[260px] rounded-full bg-orange-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 bottom-0 size-[260px] rounded-full bg-purple-500/15 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-purple-200">
              <Sparkles className="size-3" />
              Devnet · {config.solanaNetwork}
            </span>
            <h2 className="mt-4 font-heading text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Set up your wallet to test STRUCTA
            </h2>
            <p className="mt-2 text-sm text-gray-300 sm:text-base">
              Before buying tokenized shares you need to be on{" "}
              <strong className="text-purple-200">devnet</strong> with SOL for
              gas fees and fake USDC to invest. Follow the 4 steps below — it
              takes less than 2 minutes.
            </p>
          </div>
          <div className="grid w-full max-w-[280px] grid-cols-2 gap-3 sm:w-auto">
            <BalancePill
              label="SOL devnet"
              value={
                solBalance === null
                  ? "—"
                  : `${formatNumber(solBalance, 3)} SOL`
              }
              tone={enoughSol ? "emerald" : "amber"}
              loading={loadingBalances}
            />
            <BalancePill
              label="Fake USDC"
              value={
                usdcBalance === null
                  ? "—"
                  : `${formatNumber(usdcBalance, 2)}`
              }
              tone={hasUsdc ? "emerald" : "amber"}
              loading={loadingBalances}
            />
          </div>
        </div>
      </motion.div>

      {/* ── Step 1: Switch to devnet ────────────────────────────────── */}
      <StepCard
        number={1}
        status={stepStatus[1]}
        icon={Globe}
        title="Switch your wallet to devnet"
        description="Phantom and Solflare default to mainnet. Switch the network to devnet before connecting."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <ProviderHelp
            name="Phantom"
            steps={[
              "Open the extension and click the settings icon (⚙️).",
              "Go to 'Developer Settings' → 'Testnet Mode' → enable it.",
              "Return to the main screen and select 'Solana Devnet' in the network selector.",
            ]}
            href={PHANTOM_DEVNET_HELP}
          />
          <ProviderHelp
            name="Solflare"
            steps={[
              "Click the avatar in the top-right corner.",
              "Select 'Settings' → 'Network'.",
              "Choose 'Devnet' and return to the wallet home.",
            ]}
            href={SOLFLARE_DEVNET_HELP}
          />
        </div>
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-[12px] text-amber-200">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <span>
            Your wallet <strong>must</strong> be on devnet when you connect. If
            you accidentally connect on mainnet, switch the network and
            reconnect.
          </span>
        </div>
      </StepCard>

      {/* ── Step 2: Connect wallet ──────────────────────────────────── */}
      <StepCard
        number={2}
        status={stepStatus[2]}
        icon={Wallet}
        title="Connect your wallet to STRUCTA"
        description="You will sign a message (no cost) to authenticate your wallet with our backend."
      >
        {walletReady ? (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="size-5 text-emerald-300" />
                <div className="min-w-0">
                  <p className="text-sm text-emerald-100">
                    Wallet connected and authenticated
                  </p>
                  <code className="mt-0.5 block break-all font-mono text-[11px] text-emerald-200/80">
                    {walletAddress}
                  </code>
                </div>
              </div>
              <Button
                size="sm"
                variant="secondary"
                leftIcon={<Copy className="size-3.5" />}
                onClick={() =>
                  walletAddress && copy(walletAddress, "Address copied")
                }
              >
                Copy address
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dark-600 bg-dark-900/60 p-4">
            <div className="text-[13px] text-gray-300">
              Click <strong>Connect Wallet</strong> and approve the signature
              request that appears in your extension.
            </div>
            <ConnectWalletButton size="md" redirectTo={false} />
          </div>
        )}
      </StepCard>

      {/* ── Step 3: SOL faucet ──────────────────────────────────────── */}
      <StepCard
        number={3}
        status={stepStatus[3]}
        icon={Droplet}
        title="Get 5 SOL from the official Solana faucet"
        description="SOL covers transaction gas fees. The official faucet authenticates via GitHub to prevent abuse."
      >
        <ol className="space-y-2 text-[13px] text-gray-300">
          <Bullet n={1}>
            Go to{" "}
            <a
              href={SOLANA_FAUCET_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-purple-300 underline-offset-4 hover:underline"
            >
              faucet.solana.com
            </a>{" "}
            and click <strong className="text-white">Sign in with GitHub</strong>.
          </Bullet>
          <Bullet n={2}>
            Paste your wallet address in the main input field:
          </Bullet>
          {walletAddress && (
            <li className="ml-7">
              <button
                type="button"
                onClick={() => copy(walletAddress, "Wallet address copied")}
                className="group flex w-full items-center justify-between gap-3 rounded-xl border border-dark-600 bg-dark-900/60 px-3 py-2 font-mono text-[11px] text-purple-200 hover:border-purple-500/40"
              >
                <span className="truncate">{walletAddress}</span>
                <Copy className="size-3.5 shrink-0 text-gray-500 transition group-hover:text-purple-300" />
              </button>
            </li>
          )}
          <Bullet n={3}>
            Select <strong className="text-white">5 SOL</strong> and click{" "}
            <strong className="text-white">Confirm Airdrop</strong>. The balance
            arrives within a few seconds.
          </Bullet>
        </ol>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <a
            href={SOLANA_FAUCET_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex"
          >
            <Button
              variant="primary"
              leftIcon={<Github className="size-4" />}
              rightIcon={<ExternalLink className="size-3.5 opacity-80" />}
            >
              Open official Solana faucet
            </Button>
          </a>
          <Button
            variant="secondary"
            size="md"
            onClick={refreshBalances}
            loading={loadingBalances}
            leftIcon={<ScanLine className="size-4" />}
          >
            Refresh balance
          </Button>
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-gray-500">
            Current balance:{" "}
            <strong
              className={cn(
                "font-heading tabular-nums",
                enoughSol ? "text-emerald-300" : "text-amber-300",
              )}
            >
              {solBalance === null
                ? "—"
                : `${formatNumber(solBalance, 3)} SOL`}
            </strong>
          </span>
        </div>
      </StepCard>

      {/* ── Step 4: Mint fake USDC ──────────────────────────────────── */}
      <StepCard
        number={4}
        status={stepStatus[4]}
        icon={Coins}
        title="Mint 100,000 fake USDC to start testing"
        description="STRUCTA uses a devnet SPL token to represent USDC. You only pay the gas in SOL — we handle the mint authority."
      >
        <div className="grid gap-3 rounded-2xl border border-dark-600 bg-dark-900/60 p-4 text-[12px] sm:grid-cols-3">
          <KvRow label="Fake USDC mint address" mono>
            <CopyChip
              value={config.usdcMint}
              displayValue={shortAddress(config.usdcMint, 6)}
              onCopy={() => copy(config.usdcMint, "Mint address copied")}
            />
          </KvRow>
          <KvRow label="Decimals" mono>
            {USDC_DECIMALS}
          </KvRow>
          <KvRow label="Mint amount" mono>
            <span className="font-heading text-lg font-bold tabular-nums text-orange-300">
              {formatNumber(DEFAULT_MINT_AMOUNT, 0)} USDC
            </span>
          </KvRow>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-dark-700 pt-4">
          <div className="text-[12px] text-gray-400">
            Current balance:{" "}
            <strong
              className={cn(
                "font-heading tabular-nums",
                hasUsdc ? "text-emerald-300" : "text-gray-300",
              )}
            >
              {usdcBalance === null
                ? "—"
                : `${formatNumber(usdcBalance, 2)} fake USDC`}
            </strong>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="secondary"
              size="md"
              onClick={refreshBalances}
              loading={loadingBalances}
              leftIcon={<ScanLine className="size-4" />}
            >
              Refresh balance
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleMintUsdc}
              loading={minting}
              disabled={!walletReady || !enoughSol}
              leftIcon={<Coins className="size-4" />}
              rightIcon={<Sparkles className="size-3.5 opacity-90" />}
            >
              Mint 100,000 fake USDC
            </Button>
          </div>
        </div>

        {!walletReady && (
          <p className="mt-3 text-[11px] text-amber-300">
            You need to connect and authenticate your wallet (Step 2) before
            minting.
          </p>
        )}
        {walletReady && !enoughSol && (
          <p className="mt-3 text-[11px] text-amber-300">
            You need at least 0.05 SOL on devnet to cover the gas fee (Step 3).
          </p>
        )}

        {lastMintSig && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 text-[12px]"
          >
            <div className="flex items-center gap-2 text-emerald-200">
              <CheckCircle2 className="size-4" />
              Mint confirmed on-chain.
            </div>
            <a
              href={`https://solscan.io/tx/${lastMintSig}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-dark-600 bg-dark-900/70 px-2.5 py-1 font-mono text-[11px] text-purple-300 hover:text-orange-300"
            >
              {shortAddress(lastMintSig, 8)}
              <ExternalLink className="size-3" />
            </a>
          </motion.div>
        )}
      </StepCard>

      {/* ── Wrap-up CTA ─────────────────────────────────────────────── */}
      <Card className="overflow-hidden">
        <CardHeader>
          <div>
            <CardTitle>All set?</CardTitle>
            <CardDescription>
              With SOL for gas and fake USDC in your wallet, you can now
              purchase tokenized shares in any open fundraising project.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Link href="/dashboard/explore">
            <Button
              variant="primary"
              rightIcon={<ArrowRight className="size-4" />}
            >
              Explore investments
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="secondary">Back to overview</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

// ── helpers ────────────────────────────────────────────────────────

interface StepCardProps {
  number: number;
  status: "done" | "pending" | "active";
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  children: React.ReactNode;
}

function StepCard({
  number,
  status,
  icon: Icon,
  title,
  description,
  children,
}: StepCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: number * 0.04 }}
    >
      <Card
        className={cn(
          "relative overflow-hidden",
          status === "done"
            ? "border-emerald-500/30"
            : status === "active"
              ? "border-orange-500/40"
              : "border-dark-600",
        )}
      >
        <div
          className={cn(
            "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-60",
            status === "done"
              ? "from-emerald-500/10 via-transparent to-transparent"
              : status === "active"
                ? "from-orange-500/10 via-transparent to-transparent"
                : "from-purple-500/5 via-transparent to-transparent",
          )}
        />
        <CardHeader className="relative">
          <div className="flex items-start gap-4">
            <div
              className={cn(
                "flex size-11 shrink-0 items-center justify-center rounded-2xl border font-heading text-base font-bold",
                status === "done"
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                  : status === "active"
                    ? "border-orange-500/40 bg-orange-500/10 text-orange-200"
                    : "border-dark-600 bg-dark-800/60 text-gray-400",
              )}
            >
              {status === "done" ? (
                <CheckCircle2 className="size-5" />
              ) : (
                <Icon className="size-5" />
              )}
            </div>
            <div className="min-w-0">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-gray-500">
                Step {number}
              </span>
              <CardTitle className="mt-0.5">{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
          </div>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em]",
              status === "done"
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                : status === "active"
                  ? "border-orange-500/40 bg-orange-500/10 text-orange-200"
                  : "border-dark-600 bg-dark-900/40 text-gray-400",
            )}
          >
            {status === "done"
              ? "Completed"
              : status === "active"
                ? "In progress"
                : "Waiting"}
          </span>
        </CardHeader>
        <CardContent className="relative">{children}</CardContent>
      </Card>
    </motion.div>
  );
}

function ProviderHelp({
  name,
  steps,
  href,
}: {
  name: string;
  steps: string[];
  href: string;
}) {
  return (
    <div className="rounded-2xl border border-dark-600 bg-dark-900/40 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="font-heading text-sm font-bold text-white">{name}</p>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.18em] text-purple-300 hover:text-orange-300"
        >
          Help
          <ExternalLink className="size-3" />
        </a>
      </div>
      <ol className="mt-3 space-y-2 text-[12px] text-gray-300">
        {steps.map((s, i) => (
          <Bullet key={i} n={i + 1}>
            {s}
          </Bullet>
        ))}
      </ol>
    </div>
  );
}

function Bullet({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full border border-purple-500/30 bg-purple-500/10 font-mono text-[10px] font-bold text-purple-200">
        {n}
      </span>
      <span className="flex-1">{children}</span>
    </li>
  );
}

function BalancePill({
  label,
  value,
  tone,
  loading,
}: {
  label: string;
  value: string;
  tone: "emerald" | "amber";
  loading?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border bg-dark-900/60 p-3 backdrop-blur-md",
        tone === "emerald" ? "border-emerald-500/30" : "border-amber-500/30",
      )}
    >
      <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-gray-400">
        {label}
      </p>
      <div className="mt-1 flex items-center gap-2">
        <span
          className={cn(
            "font-heading text-base font-bold tabular-nums",
            tone === "emerald" ? "text-emerald-300" : "text-amber-300",
          )}
        >
          {value}
        </span>
        {loading && (
          <Loader2 className="size-3.5 animate-spin text-gray-500" />
        )}
      </div>
    </div>
  );
}

function KvRow({
  label,
  children,
  mono,
}: {
  label: string;
  children: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-gray-500">
        {label}
      </p>
      <div
        className={cn(
          "mt-0.5 truncate text-white",
          mono && "font-mono text-[12px]",
        )}
      >
        {children}
      </div>
    </div>
  );
}

function CopyChip({
  value,
  displayValue,
  onCopy,
}: {
  value: string;
  displayValue: string;
  onCopy: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onCopy}
      title={value}
      className="group inline-flex items-center gap-1.5 rounded-md border border-dark-600 bg-dark-800/60 px-2 py-1 font-mono text-[11px] text-purple-200 hover:border-purple-500/40 hover:text-orange-300"
    >
      {displayValue}
      <Copy className="size-3 text-gray-500 transition group-hover:text-orange-300" />
    </button>
  );
}
