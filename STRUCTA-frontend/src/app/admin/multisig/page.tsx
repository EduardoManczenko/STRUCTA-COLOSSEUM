"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import {
  ShieldCheck,
  Building2,
  Clock,
  CheckCircle2,
  XCircle,
  Hourglass,
  Plus,
  Trash2,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { Empty } from "@/components/ui/Empty";
import { Badge } from "@/components/ui/StatusBadge";
import { MultisigProgress } from "@/components/admin/MultisigBadge";
import { MultisigSignPanel } from "@/components/admin/MultisigSignPanel";
import { apiGet, apiPost } from "@/lib/api";
import { formatDate, shortAddress } from "@/lib/format";
import { PROPOSAL_ACTION_LABEL } from "@/lib/admin";
import type { MultisigProposal, MultisigOwnerWallet } from "@/lib/types";

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "open", label: "Open" },
  { value: "executed", label: "Executed" },
  { value: "rejected", label: "Rejected" },
  { value: "expired", label: "Expired" },
];

function statusIcon(status: string) {
  if (status === "executed")
    return <CheckCircle2 className="size-4 text-emerald-400" />;
  if (status === "rejected") return <XCircle className="size-4 text-rose-400" />;
  if (status === "expired") return <XCircle className="size-4 text-gray-500" />;
  return <Hourglass className="size-4 text-amber-400" />;
}

function statusTone(
  status: string,
): "emerald" | "rose" | "amber" | "gray" | "purple" {
  if (status === "executed") return "emerald";
  if (status === "rejected") return "rose";
  if (status === "expired") return "gray";
  return "amber";
}

export default function AdminMultisigPage() {
  const [proposals, setProposals] = useState<MultisigProposal[]>([]);
  const [ownerWallets, setOwnerWallets] = useState<MultisigOwnerWallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("open");
  const [expanded, setExpanded] = useState<string | null>(null);

  // Owner wallet management
  const [newWalletAddr, setNewWalletAddr] = useState("");
  const [newWalletLabel, setNewWalletLabel] = useState("");
  const [addingWallet, setAddingWallet] = useState(false);

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      const [p, w] = await Promise.all([
        apiGet<MultisigProposal[]>(
          `/admin/proposals${statusFilter ? `?status=${statusFilter}` : ""}`,
        ),
        apiGet<MultisigOwnerWallet[]>("/admin/owner-wallets"),
      ]);
      setProposals(p ?? []);
      setOwnerWallets(w ?? []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const handleSigned = useCallback(
    (updated: MultisigProposal) => {
      setProposals((prev) =>
        prev.map((p) => (p.id === updated.id ? updated : p)),
      );
      if (updated.status === "executed") {
        toast.success("Proposal executed on-chain!");
      }
    },
    [],
  );

  const handleAddWallet = async () => {
    if (!newWalletAddr.trim()) return;
    setAddingWallet(true);
    try {
      const w = await apiPost<MultisigOwnerWallet>("/admin/owner-wallets", {
        walletAddress: newWalletAddr.trim(),
        label: newWalletLabel.trim() || undefined,
      });
      setOwnerWallets((prev) => [...prev, w]);
      setNewWalletAddr("");
      setNewWalletLabel("");
      toast.success("Owner wallet added.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add wallet");
    } finally {
      setAddingWallet(false);
    }
  };

  const handleRemoveWallet = async (addr: string) => {
    try {
      await apiPost("/admin/owner-wallets/remove", { walletAddress: addr });
      setOwnerWallets((prev) => prev.filter((w) => w.wallet_address !== addr));
      toast.success("Wallet removed.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove");
    }
  };

  return (
    <div className="space-y-6">
      {/* On-chain multisig explanation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-purple-400" />
            On-chain Multisig (3/5)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-400">
          <p>
            Every sensitive admin action (approvals, sales, withdrawals) requires{" "}
            <strong className="text-white">3 of 5</strong> pre-configured owner wallets to
            sign before the on-chain transaction is executed.
          </p>
          <p>
            The admin account creates the proposal. The 5 authorized signers (external
            Solana wallets) each connect and sign independently. Once the threshold is
            reached, the contract call is triggered automatically.
          </p>
        </CardContent>
      </Card>

      {/* Owner wallets configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="size-4 text-purple-300" />
            Authorized Owner Wallets ({ownerWallets.length}/5)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {ownerWallets.length === 0 ? (
            <p className="text-sm text-gray-500">
              No owner wallets configured yet. Add the Solana wallet addresses that are
              authorized to sign multisig proposals.
            </p>
          ) : (
            <ul className="space-y-2">
              {ownerWallets.map((w) => (
                <li
                  key={w.wallet_address}
                  className="flex items-center justify-between gap-3 rounded-xl bg-dark-800/60 px-3 py-2"
                >
                  <div className="min-w-0">
                    {w.label && (
                      <p className="text-xs font-semibold text-gray-200">{w.label}</p>
                    )}
                    <p className="font-mono text-[11px] text-gray-400">
                      {w.wallet_address}
                    </p>
                  </div>
                  <button
                    onClick={() => void handleRemoveWallet(w.wallet_address)}
                    className="shrink-0 rounded-lg p-1.5 text-gray-600 hover:bg-rose-500/20 hover:text-rose-400"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {ownerWallets.length < 5 && (
            <div className="space-y-2 border-t border-dark-700 pt-3">
              <p className="text-xs font-semibold text-gray-400">Add owner wallet</p>
              <div className="flex gap-2">
                <Input
                  placeholder="Solana wallet address (base58)"
                  value={newWalletAddr}
                  onChange={(e) => setNewWalletAddr(e.target.value)}
                  className="flex-1"
                />
                <Input
                  placeholder="Label (e.g. CEO Wallet)"
                  value={newWalletLabel}
                  onChange={(e) => setNewWalletLabel(e.target.value)}
                  className="w-40"
                />
                <Button
                  onClick={() => void handleAddWallet()}
                  disabled={addingWallet || !newWalletAddr.trim()}
                  size="sm"
                  className="shrink-0 bg-purple-600 hover:bg-purple-500"
                >
                  <Plus className="mr-1 size-3.5" />
                  Add
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Proposals filter */}
      <Card>
        <CardContent className="pt-5">
          <Select
            label="Filter by status"
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="max-w-xs"
          />
        </CardContent>
      </Card>

      {/* Proposals list */}
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
      ) : proposals.length === 0 ? (
        <Empty
          icon={ShieldCheck}
          title="No proposals"
          description="No multisig proposals match this filter."
        />
      ) : (
        <ul className="space-y-3">
          {proposals.map((p) => (
            <li
              key={p.id}
              className="overflow-hidden rounded-2xl border border-dark-600 bg-dark-900/40"
            >
              {/* Proposal header */}
              <button
                className="w-full p-4 text-left"
                onClick={() => setExpanded(expanded === p.id ? null : p.id)}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {statusIcon(p.status)}
                      <p className="font-heading text-base font-semibold text-white">
                        {PROPOSAL_ACTION_LABEL[p.action]}
                      </p>
                    </div>
                    <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-gray-500">
                      <Clock className="mr-1 inline size-3" />
                      {formatDate(p.created_at)} · {p.proposer?.email ?? "—"}
                    </p>
                    {p.development && (
                      <Link
                        href={`/admin/empreendimentos/${p.development.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-purple-300 hover:text-orange-300"
                      >
                        <Building2 className="size-3" />
                        {p.development.nome}
                      </Link>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge tone={statusTone(p.status)}>{p.status}</Badge>
                    <MultisigProgress
                      signed={p.signatures.length}
                      required={p.required_signatures}
                      total={p.total_signers}
                    />
                  </div>
                </div>
              </button>

              {/* Expanded: sign panel */}
              {expanded === p.id && (
                <div className="border-t border-dark-700 p-4">
                  <MultisigSignPanel
                    proposal={p}
                    ownerWallets={ownerWallets}
                    onSigned={handleSigned}
                  />

                  {p.description && (
                    <p className="mt-3 text-sm text-gray-400">{p.description}</p>
                  )}

                  {p.development && (
                    <div className="mt-3 flex justify-end">
                      <Link
                        href={`/admin/empreendimentos/${p.development.id}`}
                        className="inline-flex items-center gap-1 rounded-md border border-purple-500/40 bg-purple-500/10 px-2 py-1 text-[11px] font-semibold text-purple-200 hover:bg-purple-500/15"
                      >
                        View project
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
