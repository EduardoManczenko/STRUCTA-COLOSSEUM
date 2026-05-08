import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import * as nacl from 'tweetnacl';
import * as bs58 from 'bs58';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { MockContractsService } from '../mock-contracts/mock-contracts.service';
import type { Json, ProposalAction } from '../../common/supabase/database.types';

/** Canonical message format signed by each multisig wallet */
export function buildSigningMessage(proposalId: string, action: string): string {
  return `STRUCTA Multisig\nProposal: ${proposalId}\nAction: ${action}\nSign to authorize this on-chain operation.`;
}

@Injectable()
export class MultisigService {
  private readonly logger = new Logger('Multisig');

  // Fixed on-chain multisig config: 3-of-5 wallets must sign
  private readonly REQUIRED = 3;
  private readonly TOTAL = 5;

  constructor(
    private readonly supabase: SupabaseService,
    private readonly contracts: MockContractsService,
  ) {}

  /**
   * V1 of the protocol: there is no multisig yet. The wallet that approved
   * the project is the on-chain authority and runs every operation directly
   * (open_sale, close_sale, distribute_yield, withdraw_principal, …). When
   * the multisig flow is rolled out, flip this back so only approve/reject
   * stay admin-only.
   */
  private isAdminOnlyAction(_action: ProposalAction): boolean {
    return true;
  }

  
  async create(opts: {
    developmentId?: string | null;
    action: ProposalAction;
    description?: string;
    payload?: Record<string, unknown>;
    proposedBy: string;
  }) {
    const adminOnly = this.isAdminOnlyAction(opts.action);
    const required = adminOnly ? 0 : this.REQUIRED;
    const total = adminOnly ? 0 : this.TOTAL;

    const { data, error } = await this.supabase.admin
      .from('multisig_proposals')
      .insert({
        development_id: opts.developmentId ?? null,
        action: opts.action,
        description: opts.description ?? null,
        payload: (opts.payload ?? {}) as Json,
        required_signatures: required,
        total_signers: total,
        status: 'open',
        proposed_by: opts.proposedBy,
        expires_at: new Date(Date.now() + 7 * 86_400_000).toISOString(),
      })
      .select()
      .single();
    if (error) throw new BadRequestException(error.message);

    if (adminOnly) {
      // Execute immediately, no multisig signatures needed
      return await this.tryExecute(data.id);
    }

    return await this.getById(data.id);
  }

  /**
   * Verify and record a wallet signature for a proposal.
   * The wallet must be in the multisig_owner_wallets table.
   * The signature must be a valid Ed25519 signature of the canonical message.
   */
  async sign(proposalId: string, opts: {
    walletAddress: string;
    signature: string;
    message: string;
  }) {
    // 1. Load proposal
    const { data: proposal } = await this.supabase.admin
      .from('multisig_proposals')
      .select('*')
      .eq('id', proposalId)
      .maybeSingle();
    if (!proposal) throw new NotFoundException('Proposal not found');
    if (proposal.status !== 'open')
      throw new BadRequestException('Proposal is no longer open.');

    // 2. Check wallet is an authorized owner wallet
    const { data: ownerWallet } = await this.supabase.admin
      .from('multisig_owner_wallets')
      .select('wallet_address')
      .eq('wallet_address', opts.walletAddress)
      .maybeSingle();
    if (!ownerWallet) {
      throw new ForbiddenException(
        `Wallet ${opts.walletAddress} is not an authorized multisig signer.`,
      );
    }

    // 3. Verify the Solana Ed25519 signature
    const expectedMessage = buildSigningMessage(proposalId, proposal.action);
    if (opts.message !== expectedMessage) {
      throw new BadRequestException('Message does not match expected signing payload.');
    }

    let valid = false;
    try {
      const msgBytes = new TextEncoder().encode(opts.message);
      const sigBytes = bs58.decode(opts.signature);
      const pubKeyBytes = bs58.decode(opts.walletAddress);
      valid = nacl.sign.detached.verify(msgBytes, sigBytes, pubKeyBytes);
    } catch {
      throw new BadRequestException('Invalid signature format.');
    }
    if (!valid) {
      throw new ForbiddenException('Signature verification failed.');
    }

    // 4. Record signature (ignore duplicate)
    const { error } = await this.supabase.admin
      .from('multisig_signatures')
      .insert({
        proposal_id: proposalId,
        wallet_address: opts.walletAddress,
        signature: opts.signature,
      });
    if (error && !error.message.toLowerCase().includes('duplicate') && !error.message.includes('unique')) {
      throw new BadRequestException(error.message);
    }

    return await this.tryExecute(proposalId);
  }

  /** Return the canonical message a wallet must sign for a proposal */
  async getSigningMessage(proposalId: string) {
    const { data } = await this.supabase.admin
      .from('multisig_proposals')
      .select('id, action')
      .eq('id', proposalId)
      .maybeSingle();
    if (!data) throw new NotFoundException('Proposal not found');
    return {
      message: buildSigningMessage(data.id, data.action),
      proposalId: data.id,
      action: data.action,
    };
  }

  /** List all configured owner wallets */
  async listOwnerWallets() {
    const { data } = await this.supabase.admin
      .from('multisig_owner_wallets')
      .select('*')
      .order('added_at', { ascending: true });
    return data ?? [];
  }

  /** Add a new owner wallet (admin only) */
  async addOwnerWallet(walletAddress: string, label?: string) {
    const { data, error } = await this.supabase.admin
      .from('multisig_owner_wallets')
      .insert({ wallet_address: walletAddress, label: label ?? null })
      .select()
      .single();
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  /** Remove an owner wallet */
  async removeOwnerWallet(walletAddress: string) {
    const { error } = await this.supabase.admin
      .from('multisig_owner_wallets')
      .delete()
      .eq('wallet_address', walletAddress);
    if (error) throw new BadRequestException(error.message);
    return { removed: walletAddress };
  }

  async list(filter?: { status?: string; developmentId?: string }) {
    let q = this.supabase.admin
      .from('multisig_proposals')
      .select(
        `*,
         signatures:multisig_signatures(id, wallet_address, signed_at),
         development:developments(id, nome, status),
         proposer:profiles!multisig_proposals_proposed_by_fkey(email, full_name)`,
      )
      .order('created_at', { ascending: false });
    if (filter?.status) q = q.eq('status', filter.status as 'open');
    if (filter?.developmentId) q = q.eq('development_id', filter.developmentId);
    const { data, error } = await q;
    if (error) throw new BadRequestException(error.message);
    return data ?? [];
  }

  async getById(proposalId: string) {
    const { data, error } = await this.supabase.admin
      .from('multisig_proposals')
      .select(
        `*,
         signatures:multisig_signatures(id, wallet_address, signed_at),
         development:developments(id, nome, status),
         proposer:profiles!multisig_proposals_proposed_by_fkey(email, full_name)`,
      )
      .eq('id', proposalId)
      .maybeSingle();
    if (error) throw new BadRequestException(error.message);
    if (!data) throw new NotFoundException();
    return data;
  }

  private async tryExecute(proposalId: string) {
    const detailed = await this.getById(proposalId);
    const signed = detailed.signatures?.length ?? 0;
    if (signed < detailed.required_signatures) return detailed;

    let executedTx: string | undefined;
    try {
      executedTx = await this.executeAction(detailed);
    } catch (err) {
      this.logger.error(
        `Failed to execute proposal ${proposalId}: ${(err as Error).message}`,
      );
      throw err;
    }

    await this.supabase.admin
      .from('multisig_proposals')
      .update({
        status: 'executed',
        executed_at: new Date().toISOString(),
        executed_tx: executedTx ?? null,
      })
      .eq('id', proposalId);

    return await this.getById(proposalId);
  }

  private async executeAction(
    proposal: Awaited<ReturnType<typeof this.getById>>,
  ): Promise<string | undefined> {
    const devId = proposal.development_id ?? '';
    const payload = (proposal.payload ?? {}) as Record<string, unknown>;
    const supabase = this.supabase.admin;

    /* Each development can be re-initialised on-chain (e.g. wrong USDC mint at
     * creation time). The nonce stored on the row deterministically tweaks
     * the seed so PDAs do not collide with the previous incarnation. */
    const nonceRow = devId
      ? await supabase
          .from('developments')
          .select('project_seed_nonce')
          .eq('id', devId)
          .maybeSingle()
      : null;
    const nonce =
      (nonceRow?.data as { project_seed_nonce?: number } | null)
        ?.project_seed_nonce ?? 0;

    switch (proposal.action) {
      case 'approve_development': {
        const tx = await this.contracts.createDevelopmentSmartContracts({
          developmentId: devId,
          tokenSymbol: String(payload.token_symbol ?? 'STR'),
          tokenName: String(payload.token_name ?? 'STRUCTA'),
          tokenSupply: Number(payload.token_supply ?? 0),
          tokenPriceUsdc: Number(payload.token_price_usdc ?? 0),
          seedNonce: nonce,
        });
        await supabase
          .from('developments')
          .update({
            status: 'aprovado',
            approved_at: new Date().toISOString(),
            yield_apy_percent: Number(payload.yield_apy_percent ?? 0),
            yield_periodicidade: (payload.yield_periodicidade ?? null) as
              | 'mensal'
              | 'trimestral'
              | 'semestral'
              | 'anual'
              | null,
            prazo_total_token_meses: Number(payload.prazo_total_token_meses ?? 0),
            token_symbol: String(payload.token_symbol ?? ''),
            token_name: String(payload.token_name ?? ''),
            token_supply: Number(payload.token_supply ?? 0),
            token_price_usdc: Number(payload.token_price_usdc ?? 0),
            cota_mint_address: tx.cota_mint_address,
            vault_principal_address: tx.vault_principal_address,
            vault_yield_address: tx.vault_yield_address,
            burn_pool_address: tx.burn_pool_address,
            // New on-chain protocol fields (added by migration structa_solana_protocol_addresses)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ...(({
              project_account_address: tx.project_account_address,
              project_authority_pda: tx.project_authority_pda,
              solana_program_id: tx.program_id,
              init_tx_signature: tx.txSignature,
            } as any)),
            reviewed_by: proposal.proposed_by ?? null,
            reviewed_at: new Date().toISOString(),
          })
          .eq('id', devId);
        return tx.txSignature;
      }
      case 'reject_development': {
        await supabase
          .from('developments')
          .update({
            status: 'recusado',
            status_reason: String(payload.reason ?? ''),
            reviewed_by: proposal.proposed_by ?? null,
            reviewed_at: new Date().toISOString(),
          })
          .eq('id', devId);
        return undefined;
      }
      case 'open_sale': {
        const tx = await this.contracts.openSale(devId, nonce);
        await supabase
          .from('developments')
          .update({ sale_open: true, status: 'venda_aberta' })
          .eq('id', devId);
        return tx.txSignature;
      }
      case 'close_sale': {
        const tx = await this.contracts.closeSale(devId, nonce);
        await supabase
          .from('developments')
          .update({ sale_open: false, status: 'em_construcao' })
          .eq('id', devId);
        return tx.txSignature;
      }
      case 'withdraw_principal': {
        const tx = await this.contracts.withdrawPrincipal(
          devId,
          Number(payload.amount_usdc ?? 0),
          String(payload.destination_address ?? ''),
          nonce,
        );
        return tx.txSignature;
      }
      case 'distribute_yield': {
        const tx = await this.contracts.distributeYield(
          devId,
          Number(payload.amount_usdc ?? 0),
          nonce,
        );
        await supabase.from('yield_distributions').insert({
          development_id: devId,
          amount_usdc: Number(payload.amount_usdc ?? 0),
          reference_period: (payload.reference_period as string) ?? null,
          tx_signature: tx.txSignature,
          created_by: proposal.proposed_by ?? null,
        });
        await supabase
          .from('developments')
          .update({ status: 'distribuindo_yield' })
          .eq('id', devId);
        return tx.txSignature;
      }
      case 'unlock_burn': {
        const tx = await this.contracts.unlockBurn(devId, nonce);
        await supabase
          .from('developments')
          .update({ burn_unlocked: true, status: 'aguardando_burn' })
          .eq('id', devId);
        return tx.txSignature;
      }
      case 'lock_burn': {
        const tx = await this.contracts.lockBurn(devId, nonce);
        await supabase
          .from('developments')
          .update({ burn_unlocked: false })
          .eq('id', devId);
        return tx.txSignature;
      }
      case 'refund_fund': {
        const tx = await this.contracts.refundFund(devId, nonce);
        await supabase
          .from('developments')
          .update({ refund_enabled: true })
          .eq('id', devId);
        return tx.txSignature;
      }
      case 'create_smart_contracts': {
        const tx = await this.contracts.createDevelopmentSmartContracts({
          developmentId: devId,
          tokenSymbol: String(payload.token_symbol ?? 'STR'),
          tokenName: String(payload.token_name ?? 'STRUCTA'),
          tokenSupply: Number(payload.token_supply ?? 0),
          tokenPriceUsdc: Number(payload.token_price_usdc ?? 0),
          seedNonce: nonce,
        });
        await supabase
          .from('developments')
          .update({
            cota_mint_address: tx.cota_mint_address,
            vault_principal_address: tx.vault_principal_address,
            vault_yield_address: tx.vault_yield_address,
            burn_pool_address: tx.burn_pool_address,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ...(({
              project_account_address: tx.project_account_address,
              project_authority_pda: tx.project_authority_pda,
              solana_program_id: tx.program_id,
              init_tx_signature: tx.txSignature,
            } as any)),
          })
          .eq('id', devId);
        return tx.txSignature;
      }
      default:
        return undefined;
    }
  }
}
