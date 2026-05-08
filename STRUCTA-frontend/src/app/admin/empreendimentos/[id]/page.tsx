"use client";

import Link from "next/link";
import { useEffect, useState, use, useCallback } from "react";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Coins,
  Flame,
  Hash,
  Lock,
  PlayCircle,
  ShieldCheck,
  StopCircle,
  Undo2,
  Wallet,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Empty } from "@/components/ui/Empty";
import { Modal } from "@/components/ui/Modal";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { ProgressBar } from "@/components/ui/ProgressBar";
import {
  DevelopmentStatusBadge,
  Badge,
} from "@/components/ui/StatusBadge";
import { StatCard } from "@/components/dashboard/StatCard";
import { apiGet, apiPost } from "@/lib/api";
import {
  formatNumber,
  formatPercent,
  formatUsdc,
  pct,
} from "@/lib/format";
import {
  PROPOSAL_ACTION_LABEL,
  PROPOSAL_ACTION_DESCRIPTION,
} from "@/lib/admin";
import type {
  DevelopmentDetail,
  MultisigProposal,
  ProposalAction,
} from "@/lib/types";
import { useAdminWallet } from "@/components/admin/AdminWalletPill";

interface AdminDevDetail extends DevelopmentDetail {
  status_reason: string | null;
  approved_at: string | null;
  proposals?: MultisigProposal[];
  purchases?: Array<{
    id: string;
    cotas_amount: number;
    total_usdc: number;
    created_at: string;
    investor: { wallet_address: string } | null;
  }>;
}

interface OnChainSnapshot {
  program_id: string;
  project_account_address: string;
  project_authority_pda: string;
  vault_principal_address: string;
  vault_yield_address: string;
  burn_pool_address: string;
  cota_mint_address: string;
  usdc_mint: string;
  principal_usdc_base_units: string;
  yield_usdc_base_units: string;
  burn_usdc_base_units: string;
  cotas_minted: string;
  cumulative_yield_per_token: string;
  sale_open: boolean;
  burn_unlocked: boolean;
}

type ActionFormState = Record<string, string>;

/* ─── Default approval form state ───────────────────────────── */
const APPROVAL_DEFAULTS: ActionFormState = {
  yield_periodicidade: "mensal",
};

export default function AdminDevelopmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [dev, setDev] = useState<AdminDevDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [onChain, setOnChain] = useState<OnChainSnapshot | null>(null);

  /* Inline approval form */
  const [approvalForm, setApprovalForm] = useState<ActionFormState>(APPROVAL_DEFAULTS);
  const [rejectReason, setRejectReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showRejectPanel, setShowRejectPanel] = useState(false);

  /* Operational action modals (open_sale, yield, etc.) */
  const [actionModal, setActionModal] = useState<ProposalAction | null>(null);
  const [actionForm, setActionForm] = useState<ActionFormState>({});
  const [actionSubmitting, setActionSubmitting] = useState(false);

  /* Admin wallet status — gates all on-chain mutating actions */
  const { isConnected: walletConnected, isAuthority } = useAdminWallet();
  const canActOnChain = walletConnected && isAuthority;

  const load = useCallback(async () => {
    try {
      const data = await apiGet<AdminDevDetail>(`/admin/developments/${id}`);
      setDev(data);
      // Fire-and-forget on-chain snapshot fetch — only meaningful for
      // already-approved projects.
      apiGet<OnChainSnapshot>(`/admin/developments/${id}/on-chain`)
        .then((s) => setOnChain(s))
        .catch(() => undefined);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  /* ── Approve ── */
  async function handleApprove() {
    if (!dev) return;
    if (!canActOnChain) {
      toast.error("Connect the protocol authority wallet to approve a project.");
      return;
    }
    const requiredFields = [
      "yield_apy_percent",
      "yield_periodicidade",
      "prazo_total_token_meses",
      "token_symbol",
      "token_name",
      "token_supply",
      "token_price_usdc",
    ];
    for (const k of requiredFields) {
      if (!approvalForm[k] && approvalForm[k] !== "0") {
        toast.error(`Please fill in: ${k.replace(/_/g, " ")}`);
        return;
      }
    }
    setSubmitting(true);
    try {
      await apiPost("/admin/proposals", {
        developmentId: dev.id,
        action: "approve_development",
        payload: {
          yield_apy_percent: Number(approvalForm.yield_apy_percent),
          yield_periodicidade: approvalForm.yield_periodicidade,
          prazo_total_token_meses: Number(approvalForm.prazo_total_token_meses),
          token_symbol: approvalForm.token_symbol,
          token_name: approvalForm.token_name,
          token_supply: Number(approvalForm.token_supply),
          token_price_usdc: Number(approvalForm.token_price_usdc),
        },
      });
      toast.success("Project approved successfully.");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to approve");
    } finally {
      setSubmitting(false);
    }
  }

  /* ── Reject ── */
  async function handleReject() {
    if (!dev) return;
    if (!rejectReason.trim()) {
      toast.error("Please provide a reason for rejection.");
      return;
    }
    setSubmitting(true);
    try {
      await apiPost("/admin/proposals", {
        developmentId: dev.id,
        action: "reject_development",
        payload: { reason: rejectReason },
      });
      toast.success("Project rejected.");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reject");
    } finally {
      setSubmitting(false);
    }
  }

  /* ── Operational actions (open_sale, distribute_yield, etc.) ── */
  function openAction(a: ProposalAction) {
    if (!canActOnChain) {
      toast.error("Connect the protocol authority wallet to run on-chain actions.");
      return;
    }
    setActionForm({});
    setActionModal(a);
  }

  async function submitAction() {
    if (!actionModal || !dev) return;
    if (!canActOnChain) {
      toast.error("Connect the protocol authority wallet to run on-chain actions.");
      return;
    }
    const payload = buildPayload(actionModal, actionForm);
    if (typeof payload === "string") {
      toast.error(payload);
      return;
    }
    setActionSubmitting(true);
    try {
      const result = await apiPost<{ executed_tx?: string | null }>(
        "/admin/proposals",
        {
          developmentId: dev.id,
          action: actionModal,
          description: actionForm.description?.trim() || undefined,
          payload,
        },
      );
      toast.success(
        result?.executed_tx
          ? `Action executed on-chain · ${result.executed_tx.slice(0, 10)}…`
          : "Action executed.",
      );
      setActionModal(null);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setActionSubmitting(false);
    }
  }

  /* ─── Loading / Empty ───────────────────────────────────────── */
  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-40 rounded-lg" />
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-60 rounded-2xl" />
      </div>
    );
  }
  if (!dev) {
    return (
      <Empty
        icon={Building2}
        title="Project not found"
        description="This project is not available."
      />
    );
  }

  const target = Number(dev.captacao_target_brl ?? 0); // stored as BRL column but treated as USDC going forward
  const raised = Number(dev.amount_raised_usdc ?? 0);
  const filledPct = pct(raised, target);
  const totalCotasSold = (dev.purchases ?? []).reduce(
    (s, p) => s + Number(p.cotas_amount ?? 0),
    0,
  );
  const isPending = dev.status === "pendente";
  const isRejected = dev.status === "recusado";
  const isApproved = !isPending && !isRejected;

  const af = approvalForm;
  const setAf = (k: string) => (v: string) =>
    setApprovalForm((prev) => ({ ...prev, [k]: v }));

  return (
    <div className="space-y-6">
      <Link
        href="/admin/empreendimentos"
        className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-gray-400 transition hover:text-orange-400"
      >
        <ArrowLeft className="size-3.5" />
        Back
      </Link>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <Card className="overflow-hidden">
        <div className="relative aspect-[16/6] bg-dark-700">
          {dev.cover_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={dev.cover_image_url}
              alt={dev.nome}
              className="size-full object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center bg-gradient-to-br from-purple-900/30 via-dark-700 to-orange-900/20">
              <Building2 className="size-16 text-purple-400/50" />
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-dark-900/95 to-transparent p-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h1 className="font-heading text-2xl font-bold text-white sm:text-3xl">
                  {dev.nome_comercial ?? dev.nome}
                </h1>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-gray-300">
                  {dev.municipio} · {dev.uf} ·{" "}
                  {dev.incorporator?.razao_social ?? ""}
                </p>
              </div>
              <DevelopmentStatusBadge status={dev.status} />
            </div>
          </div>
        </div>
        {dev.status_reason && (
          <div className="border-t border-dark-700 bg-rose-500/10 p-4 text-sm text-rose-200">
            <strong className="text-white">Rejection reason:</strong> {dev.status_reason}
          </div>
        )}
      </Card>

      {/* ── Stats ───────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Fundraising target"
          value={formatUsdc(target, { compact: true })}
          hint="Set by the developer"
          tone="orange"
          index={0}
        />
        <StatCard
          label="Raised (USDC)"
          value={formatUsdc(raised, { compact: true })}
          hint={`${filledPct.toFixed(0)}% of target`}
          tone="emerald"
          index={1}
        />
        <StatCard
          label="Tokens sold"
          value={formatNumber(totalCotasSold, 0)}
          hint={dev.token_supply ? `of ${formatNumber(dev.token_supply, 0)}` : ""}
          icon={Coins}
          tone="purple"
          index={2}
        />
        <StatCard
          label="Units sold"
          value={`${dev.units_sold}/${dev.numero_unidades}`}
          tone="sky"
          index={3}
        />
      </div>

      {/* ── On-chain details (read-only, approved only) ───────── */}
      {isApproved && (
        <Card>
          <CardHeader>
            <CardTitle>On-chain fundraising</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ProgressBar value={filledPct} height={8} />
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Fundraising target (USDC)" value={formatUsdc(target)} />
              <Field label="Raised (USDC)" value={formatUsdc(raised)} />
              <Field label="Price per token" value={formatUsdc(dev.token_price_usdc)} />
              <Field label="APY target" value={formatPercent(dev.yield_apy_percent ?? 0, 2)} />
              <Field label="Yield frequency" value={dev.yield_periodicidade ?? "—"} />
              <Field
                label="Total term"
                value={dev.prazo_total_token_meses ? `${dev.prazo_total_token_meses} months` : "—"}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Deposit addresses (approved only) ────────────────── */}
      {isApproved && (
        <Card>
          <CardHeader>
            <CardTitle>Deposit addresses</CardTitle>
            {onChain && (
              <Badge tone="purple">
                <ShieldCheck className="size-3" />
                Live on-chain · {onChain.cotas_minted} shares minted
              </Badge>
            )}
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Address
              label="Principal vault (USDC)"
              address={dev.vault_principal_address}
              description="Investors deposit here to purchase tokens."
              balance={onChain ? formatUsdcBaseUnits(onChain.principal_usdc_base_units) : null}
            />
            <Address
              label="Yield vault (USDC)"
              address={dev.vault_yield_address}
              description="Yield distribution deposit for holders."
              balance={onChain ? formatUsdcBaseUnits(onChain.yield_usdc_base_units) : null}
            />
            <Address
              label="Burn pool"
              address={dev.burn_pool_address}
              description="Pool enabled for redemption/burn at end of cycle."
              balance={onChain ? formatUsdcBaseUnits(onChain.burn_usdc_base_units) : null}
            />
            <Address
              label="Token mint (SPL)"
              address={dev.cota_mint_address}
              description="Mint of the SPL token representing the investment share."
            />
          </CardContent>
        </Card>
      )}

      {/* ── Units ─────────────────────────────────────────────── */}
      {dev.numero_unidades > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Units</CardTitle>
            <Badge tone={dev.units_sold > 0 ? "emerald" : "gray"}>
              {dev.units_sold}/{dev.numero_unidades} sold
            </Badge>
          </CardHeader>
          <CardContent>
            {(dev.units?.length ?? 0) === 0 ? (
              <Empty
                icon={Building2}
                title="No units registered"
                description="This proposal has no individual units."
              />
            ) : (
              <ul className="divide-y divide-dark-700 overflow-hidden rounded-xl border border-dark-600">
                {dev.units?.map((u) => (
                  <li
                    key={u.id}
                    className="flex flex-wrap items-center justify-between gap-3 bg-dark-900/40 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm text-white">{u.identifier}</p>
                      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-gray-500">
                        {u.metragem_m2 ? `${u.metragem_m2} m²` : "—"}
                      </p>
                    </div>
                    <Badge
                      tone={
                        u.status === "vendida"
                          ? "emerald"
                          : u.status === "reservada"
                            ? "amber"
                            : "gray"
                      }
                    >
                      {u.status}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Operational controls (approved only) ─────────────── */}
      {isApproved && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Administrative controls</CardTitle>
              <p className="mt-1 text-sm text-gray-400">
                Operational actions on this development. On-chain operations
                require the protocol authority wallet.
              </p>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <ActionButton
              action={dev.sale_open ? "close_sale" : "open_sale"}
              onClick={() => openAction(dev.sale_open ? "close_sale" : "open_sale")}
              icon={dev.sale_open ? StopCircle : PlayCircle}
              tone={dev.sale_open ? "rose" : "orange"}
              disabled={!canActOnChain}
            />
            <ActionButton
              action="distribute_yield"
              onClick={() => openAction("distribute_yield")}
              icon={Coins}
              tone="emerald"
              disabled={!canActOnChain}
            />
            <ActionButton
              action="withdraw_principal"
              onClick={() => openAction("withdraw_principal")}
              icon={Wallet}
              tone="purple"
              disabled={!canActOnChain}
            />
            <ActionButton
              action={dev.burn_unlocked ? "lock_burn" : "unlock_burn"}
              onClick={() => openAction(dev.burn_unlocked ? "lock_burn" : "unlock_burn")}
              icon={dev.burn_unlocked ? Lock : Flame}
              tone="amber"
              disabled={!canActOnChain}
            />
            <ActionButton
              action="refund_fund"
              onClick={() => openAction("refund_fund")}
              icon={Undo2}
              tone="sky"
              disabled={!canActOnChain}
            />
            <ActionButton
              action="create_smart_contracts"
              onClick={() => openAction("create_smart_contracts")}
              icon={Hash}
              tone="purple"
              disabled={!canActOnChain}
            />
          </CardContent>
        </Card>
      )}

      {/* ── APPROVAL FORM (pending only — always last on page) ── */}
      {isPending && (
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardHeader>
            <div>
              <CardTitle>Review & approve project</CardTitle>
              <p className="mt-1 text-sm text-gray-400">
                Fill in the on-chain parameters below, then approve or reject
                this proposal. The fundraising target was set by the developer
                and cannot be changed here.
              </p>
            </div>
            <Badge tone="amber">
              <ShieldCheck className="size-3" />
              Pending review
            </Badge>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Fundraising target — read-only, comes from developer */}
            <div>
              <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-gray-500">
                Developer-defined parameters
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-dark-600 bg-dark-900/60 p-3">
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-gray-500">
                    Fundraising target (USDC)
                  </p>
                  <p className="mt-1 font-heading text-lg font-semibold text-orange-300">
                    {formatUsdc(target)}
                  </p>
                  <p className="mt-0.5 text-[11px] text-gray-500">
                    Set by the developer — read only
                  </p>
                </div>
                <div className="rounded-xl border border-dark-600 bg-dark-900/60 p-3">
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-gray-500">
                    Fundraising period
                  </p>
                  <p className="mt-1 text-sm text-white">
                    {dev.prazo_captacao_dias
                      ? `${dev.prazo_captacao_dias} days`
                      : "—"}
                  </p>
                </div>
                <div className="rounded-xl border border-dark-600 bg-dark-900/60 p-3">
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-gray-500">
                    Total units
                  </p>
                  <p className="mt-1 text-sm text-white">
                    {dev.numero_unidades ?? "—"}
                  </p>
                </div>
              </div>
            </div>

            {/* Structa-defined on-chain parameters */}
            <div>
              <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-gray-500">
                On-chain parameters — defined by Structa
              </p>
              <div className="grid gap-4">
                {/* Yield */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    label="APY target (%)"
                    required
                    type="number"
                    step="0.01"
                    placeholder="18.00"
                    hint="Annual percentage yield offered to investors"
                    value={af.yield_apy_percent ?? ""}
                    onChange={(e) => setAf("yield_apy_percent")(e.target.value)}
                  />
                  <Select
                    label="Yield frequency"
                    required
                    options={[
                      { value: "mensal", label: "Monthly" },
                      { value: "trimestral", label: "Quarterly" },
                      { value: "semestral", label: "Semi-annual" },
                      { value: "anual", label: "Annual" },
                    ]}
                    value={af.yield_periodicidade ?? "mensal"}
                    onChange={(e) =>
                      setAf("yield_periodicidade")(e.target.value)
                    }
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-1">
                  <Input
                    label="Total token term (months)"
                    required
                    type="number"
                    placeholder="24"
                    hint="Duration investors hold tokens until principal return"
                    value={af.prazo_total_token_meses ?? ""}
                    onChange={(e) =>
                      setAf("prazo_total_token_meses")(e.target.value)
                    }
                  />
                </div>

                {/* Token */}
                <div className="rounded-xl border border-dark-700 bg-dark-900/40 p-4 space-y-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-purple-300">
                    Token parameters
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input
                      label="Token symbol"
                      required
                      placeholder="STR-COTA-001"
                      value={af.token_symbol ?? ""}
                      onChange={(e) => setAf("token_symbol")(e.target.value)}
                    />
                    <Input
                      label="Token name"
                      required
                      placeholder="Structa Token — Project Name"
                      value={af.token_name ?? ""}
                      onChange={(e) => setAf("token_name")(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input
                      label="Total supply (tokens)"
                      required
                      type="number"
                      placeholder="10000"
                      hint="Total number of tokens to mint"
                      value={af.token_supply ?? ""}
                      onChange={(e) => setAf("token_supply")(e.target.value)}
                    />
                    <Input
                      label="Price per token (USDC)"
                      required
                      type="number"
                      step="0.01"
                      placeholder="500.00"
                      hint={
                        af.token_supply && Number(af.token_supply) > 0
                          ? `Total supply value: ${formatUsdc(Number(af.token_price_usdc || 0) * Number(af.token_supply))}`
                          : "Token price in USDC"
                      }
                      value={af.token_price_usdc ?? ""}
                      onChange={(e) =>
                        setAf("token_price_usdc")(e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Reject panel */}
            {showRejectPanel && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4 space-y-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-rose-400">
                  Rejection reason
                </p>
                <Textarea
                  label="Reason (sent to the developer by email)"
                  required
                  rows={4}
                  placeholder="Explain why the proposal was rejected so the developer can improve their submission."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-dark-700 pt-5">
              <div className="flex items-center gap-2">
                {!showRejectPanel ? (
                  <Button
                    variant="secondary"
                    onClick={() => setShowRejectPanel(true)}
                    leftIcon={<XCircle className="size-4 text-rose-400" />}
                    className="border-rose-500/30 text-rose-300 hover:border-rose-500/60 hover:bg-rose-500/10"
                  >
                    Reject project
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setShowRejectPanel(false);
                        setRejectReason("");
                      }}
                    >
                      Cancel rejection
                    </Button>
                    <Button
                      onClick={handleReject}
                      loading={submitting}
                      leftIcon={<XCircle className="size-4" />}
                      className="border-rose-500/40 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20"
                    >
                      Confirm rejection
                    </Button>
                  </>
                )}
              </div>

              {!showRejectPanel && (
                <Button
                  onClick={handleApprove}
                  loading={submitting}
                  disabled={!canActOnChain}
                  rightIcon={<CheckCircle2 className="size-4" />}
                  title={
                    canActOnChain
                      ? undefined
                      : "Connect the protocol authority wallet to approve"
                  }
                >
                  {canActOnChain
                    ? "Approve project"
                    : "Connect wallet to approve"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Operational action modal */}
      <OperationalActionModal
        action={actionModal}
        onClose={() => setActionModal(null)}
        form={actionForm}
        setForm={setActionForm}
        onSubmit={submitAction}
        submitting={actionSubmitting}
        development={dev}
      />
    </div>
  );
}

/* ─── Sub-components ─────────────────────────────────────────── */

function ActionButton({
  action,
  onClick,
  icon: Icon,
  tone,
  disabled,
}: {
  action: ProposalAction;
  onClick: () => void;
  icon: typeof Building2;
  tone: "purple" | "orange" | "emerald" | "rose" | "amber" | "sky";
  disabled?: boolean;
}) {
  const TONE_CLS: Record<typeof tone, string> = {
    purple:
      "border-purple-500/30 hover:border-purple-500/60 hover:bg-purple-500/10 text-purple-200",
    orange:
      "border-orange-500/30 hover:border-orange-500/60 hover:bg-orange-500/10 text-orange-200",
    emerald:
      "border-emerald-500/30 hover:border-emerald-500/60 hover:bg-emerald-500/10 text-emerald-200",
    rose: "border-rose-500/30 hover:border-rose-500/60 hover:bg-rose-500/10 text-rose-200",
    amber:
      "border-amber-500/30 hover:border-amber-500/60 hover:bg-amber-500/10 text-amber-200",
    sky: "border-sky-500/30 hover:border-sky-500/60 hover:bg-sky-500/10 text-sky-200",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={disabled ? "Connect the protocol authority wallet to enable" : undefined}
      className={`flex items-start gap-3 rounded-2xl border bg-dark-900/40 p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-dark-600 disabled:hover:bg-dark-900/40 ${TONE_CLS[tone]}`}
    >
      <Icon className="size-5 mt-0.5 shrink-0" />
      <div>
        <p className="font-heading text-sm font-semibold">
          {PROPOSAL_ACTION_LABEL[action]}
        </p>
        <p className="mt-0.5 text-[12px] text-gray-400">
          {PROPOSAL_ACTION_DESCRIPTION[action]}
        </p>
      </div>
    </button>
  );
}

function OperationalActionModal({
  action,
  onClose,
  form,
  setForm,
  onSubmit,
  submitting,
  development,
}: {
  action: ProposalAction | null;
  onClose: () => void;
  form: ActionFormState;
  setForm: (s: ActionFormState) => void;
  onSubmit: () => void;
  submitting: boolean;
  development: AdminDevDetail;
}) {
  if (!action) return null;
  const update = (k: string) => (v: string) => setForm({ ...form, [k]: v });

  return (
    <Modal
      open={action !== null}
      onClose={onClose}
      title={PROPOSAL_ACTION_LABEL[action]}
      description={PROPOSAL_ACTION_DESCRIPTION[action]}
      size="lg"
    >
      <div className="grid gap-4">
        {action === "withdraw_principal" && (
          <>
            <Input
              label="Amount to withdraw (USDC)"
              required
              type="number"
              step="0.000001"
              value={form.amount_usdc ?? ""}
              onChange={(e) => update("amount_usdc")(e.target.value)}
              hint={`Current vault: ${formatUsdc(development.amount_raised_usdc ?? 0)}`}
            />
            <Input
              label="Destination address (developer wallet)"
              required
              placeholder="Solana wallet address"
              value={form.destination_address ?? ""}
              onChange={(e) => update("destination_address")(e.target.value)}
            />
          </>
        )}

        {action === "distribute_yield" && (
          <>
            <Input
              label="Amount to distribute (USDC)"
              required
              type="number"
              step="0.000001"
              value={form.amount_usdc ?? ""}
              onChange={(e) => update("amount_usdc")(e.target.value)}
            />
            <Input
              label="Reference period"
              placeholder="e.g. 2026-04, Q1/2026…"
              value={form.reference_period ?? ""}
              onChange={(e) => update("reference_period")(e.target.value)}
            />
          </>
        )}

        {action === "create_smart_contracts" && (
          <>
            <Input
              label="Token symbol"
              required
              value={form.token_symbol ?? development.token_symbol ?? ""}
              onChange={(e) => update("token_symbol")(e.target.value)}
            />
            <Input
              label="Token name"
              required
              value={form.token_name ?? development.token_name ?? ""}
              onChange={(e) => update("token_name")(e.target.value)}
            />
            <Input
              label="Supply"
              required
              type="number"
              value={form.token_supply ?? String(development.token_supply ?? "")}
              onChange={(e) => update("token_supply")(e.target.value)}
            />
          </>
        )}

        <Textarea
          label="Internal note"
          hint="Optional description attached to the proposal"
          rows={3}
          value={form.description ?? ""}
          onChange={(e) => update("description")(e.target.value)}
        />

        <div className="rounded-xl border border-purple-500/30 bg-purple-500/5 p-3 text-[12px] text-purple-200">
          The protocol authority wallet runs this action directly on-chain.
          The transaction is dispatched as soon as you confirm.
        </div>

        <div className="flex justify-end gap-3 border-t border-dark-700 pt-4">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            loading={submitting}
            rightIcon={<ShieldCheck className="size-4" />}
          >
            Execute on-chain
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/* ─── Helpers ────────────────────────────────────────────────── */

function buildPayload(
  action: ProposalAction,
  form: ActionFormState,
): Record<string, unknown> | string {
  switch (action) {
    case "withdraw_principal": {
      if (!form.amount_usdc) return "Please enter the USDC amount";
      if (!form.destination_address)
        return "Please enter the destination address";
      return {
        amount_usdc: Number(form.amount_usdc),
        destination_address: form.destination_address,
      };
    }
    case "distribute_yield": {
      if (!form.amount_usdc) return "Please enter the USDC amount";
      return {
        amount_usdc: Number(form.amount_usdc),
        reference_period: form.reference_period || undefined,
      };
    }
    case "create_smart_contracts": {
      return {
        token_symbol: form.token_symbol,
        token_name: form.token_name,
        token_supply: Number(form.token_supply),
      };
    }
    case "open_sale":
    case "close_sale":
    case "unlock_burn":
    case "lock_burn":
    case "refund_fund":
      return {};
    default:
      return {};
  }
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-dark-600 bg-dark-900/40 p-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-gray-500">
        {label}
      </p>
      <p className="mt-1 text-sm text-white">{value}</p>
    </div>
  );
}

function Address({
  label,
  address,
  description,
  balance,
}: {
  label: string;
  address: string | null;
  description: string;
  balance?: string | null;
}) {
  return (
    <div className="rounded-2xl border border-dark-600 bg-dark-900/40 p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-gray-500">
            {label}
          </p>
          <p className="mt-0.5 text-[11px] text-gray-500">{description}</p>
        </div>
        <Hash className="size-4 text-purple-300" />
      </div>
      {address ? (
        <>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <code className="break-all font-mono text-[12px] text-purple-300">
              {address}
            </code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(address);
                toast.success("Address copied");
              }}
              className="rounded-md border border-dark-500 bg-dark-900/60 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-purple-200 hover:border-purple-500/40"
            >
              Copy
            </button>
          </div>
          {balance != null && (
            <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.18em] text-emerald-300">
              On-chain balance · {balance}
            </p>
          )}
        </>
      ) : (
        <p className="mt-2 text-[12px] text-gray-500">
          Will be created once the project is approved.
        </p>
      )}
    </div>
  );
}

function formatUsdcBaseUnits(baseUnits: string | undefined | null): string {
  if (!baseUnits) return "—";
  const n = Number(baseUnits) / 1_000_000;
  if (!Number.isFinite(n)) return "—";
  return formatUsdc(n);
}

