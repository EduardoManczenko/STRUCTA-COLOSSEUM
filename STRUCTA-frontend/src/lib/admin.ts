import type { ProposalAction } from "./types";

export const PROPOSAL_ACTION_LABEL: Record<ProposalAction, string> = {
  approve_development: "Approve project",
  reject_development: "Reject project",
  open_sale: "Open share sale",
  close_sale: "Close share sale",
  withdraw_principal: "Withdraw from principal vault",
  distribute_yield: "Distribute yield",
  unlock_burn: "Unlock burn pool",
  lock_burn: "Lock burn pool",
  refund_fund: "Enable refund",
  create_smart_contracts: "Create smart contracts",
};

export const PROPOSAL_ACTION_DESCRIPTION: Record<ProposalAction, string> = {
  approve_development:
    "Approves the developer proposal, defines yield/token price and creates the smart contracts (mocked).",
  reject_development: "Rejects the project proposal with a reason.",
  open_sale: "Opens the share sale to investors.",
  close_sale: "Closes fundraising and moves to 'under construction'.",
  withdraw_principal:
    "Withdraws USDC from the principal vault to the specified address (developer).",
  distribute_yield:
    "Deposits USDC into the yield vault and records the distribution.",
  unlock_burn:
    "Unlocks the burn pool so investors can burn tokens and receive their refund.",
  lock_burn: "Locks new burns after the refund period.",
  refund_fund: "Enables full refund for token holders.",
  create_smart_contracts:
    "Recreates mint, vault and pool addresses (in case the admin needs to re-provision).",
};
