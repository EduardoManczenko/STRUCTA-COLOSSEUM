"use client";

import bs58 from "bs58";
import type { WalletContextState } from "@solana/wallet-adapter-react";
import { apiPost, auth } from "./api";
import type { AuthUser } from "./types";

export class WalletSignCancelledError extends Error {
  constructor() {
    super("Sign request cancelled by user");
    this.name = "WalletSignCancelledError";
  }
}

function isUserRejection(err: unknown): boolean {
  if (!err) return false;
  const name = (err as { name?: string })?.name ?? "";
  const message = (err as { message?: string })?.message ?? "";
  if (
    name === "WalletSignMessageError" ||
    name === "WalletSignTransactionError"
  ) {
    return true;
  }
  return /user rejected|user cancel|user denied|window closed/i.test(message);
}

interface WalletNonceResponse {
  nonce: string;
  message: string;
  expiresIn: number;
}

interface WalletVerifyResponse {
  access_token: string;
  token_type: string;
  expires_in: string;
  investor: {
    id: string;
    wallet_address: string;
    chainalysis_status: string | null;
    chainalysis_risk_score: number | null;
    is_blocked: boolean;
    block_reason: string | null;
    last_chainalysis_check_at: string | null;
  };
}

/**
 * Full Solana wallet sign-in flow:
 * 1. ask backend for a fresh nonce + message
 * 2. ask the wallet to sign that message
 * 3. send signature back so backend issues a JWT
 */
export async function signInWithWallet(wallet: WalletContextState) {
  if (!wallet.connected || !wallet.publicKey) {
    throw new Error("Connect your wallet to continue.");
  }
  if (!wallet.signMessage) {
    throw new Error(
      "Your wallet does not support message signing (signMessage).",
    );
  }
  const walletAddress = wallet.publicKey.toBase58();
  const nonceRes = await apiPost<WalletNonceResponse>("/auth/wallet/nonce", {
    walletAddress,
  });
  const messageBytes = new TextEncoder().encode(nonceRes.message);
  let signature: Uint8Array;
  try {
    signature = await wallet.signMessage(messageBytes);
  } catch (err) {
    if (isUserRejection(err)) {
      throw new WalletSignCancelledError();
    }
    throw err;
  }
  const signatureBase58 = bs58.encode(signature);
  const verifyRes = await apiPost<WalletVerifyResponse>(
    "/auth/wallet/verify",
    {
      walletAddress,
      nonce: nonceRes.nonce,
      message: nonceRes.message,
      signature: signatureBase58,
    },
  );
  auth.setToken(verifyRes.access_token);
  return verifyRes;
}

export function inferUserFromInvestor(
  investor: WalletVerifyResponse["investor"],
): AuthUser {
  return {
    id: investor.id,
    email: null,
    role: "investor",
    walletAddress: investor.wallet_address,
    source: "wallet",
  };
}
