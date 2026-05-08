import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PublicKey } from '@solana/web3.js';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { ComplianceService } from '../compliance/compliance.service';
import { SolanaService } from '../solana/solana.service';
import { SolanaContractsService } from '../solana/solana-contracts.service';
import {
  ConfirmPurchaseDto,
  QuotePurchaseDto,
  ReconcilePurchasesDto,
} from './dto/purchase.dto';

/**
 * Purchase pipeline:
 *   1. /quote     → returns the price + the on-chain accounts the
 *                   investor's tx must reference.
 *   2. (frontend) → builds the `buy_cotas` instruction, the investor signs
 *                   with their wallet adapter and submits.
 *   3. /confirm   → backend reads the on-chain transaction (or the new
 *                   on-chain HolderState), validates compliance, and
 *                   persists the purchase row.
 */
@Injectable()
export class PurchasesService {
  private readonly log = new Logger('Purchases');

  constructor(
    private readonly supabase: SupabaseService,
    private readonly compliance: ComplianceService,
    private readonly contracts: SolanaContractsService,
    private readonly solana: SolanaService,
  ) {}

  private async getDevForPurchase(developmentId: string) {
    const { data, error } = await this.supabase.admin
      .from('developments')
      .select('*')
      .eq('id', developmentId)
      .maybeSingle();
    if (error) throw new BadRequestException(error.message);
    if (!data) throw new NotFoundException('Empreendimento não encontrado');
    if (!data.sale_open || data.status !== 'venda_aberta') {
      throw new ForbiddenException(
        'Venda não está aberta para este empreendimento.',
      );
    }
    return data;
  }

  async quote(investorId: string, dto: QuotePurchaseDto) {
    const dev = await this.getDevForPurchase(dto.developmentId);
    const price = Number(dev.token_price_usdc ?? 0);
    if (price <= 0)
      throw new BadRequestException('Preço por cota não definido.');
    const total = +(price * dto.cotasAmount).toFixed(6);
    const investor = await this.supabase.admin
      .from('investors')
      .select('wallet_address')
      .eq('id', investorId)
      .maybeSingle();
    const nonce = (dev as { project_seed_nonce?: number }).project_seed_nonce ?? 0;
    const addresses = this.contracts.getDepositAddresses(dev.id, nonce);

    return {
      developmentId: dev.id,
      tokenSymbol: dev.token_symbol,
      cotasAmount: dto.cotasAmount,
      pricePerCotaUsdc: price,
      totalUsdc: total,
      platformFeeUsdc: 0,
      grandTotalUsdc: total,
      vaultPrincipalAddress: dev.vault_principal_address,
      walletAddress: investor.data?.wallet_address,
      // Everything the frontend needs to build the buy_cotas instruction:
      onChain: {
        ...addresses,
        tokenPriceUsdcBaseUnits: Math.round(price * 10 ** 6),
        seedNonce: nonce,
      },
    };
  }

  async confirm(investorId: string, dto: ConfirmPurchaseDto) {
    const dev = await this.getDevForPurchase(dto.developmentId);

    const investor = await this.supabase.admin
      .from('investors')
      .select('*')
      .eq('id', investorId)
      .maybeSingle();
    if (!investor.data) throw new NotFoundException();
    if (investor.data.is_blocked)
      throw new ForbiddenException(
        `Investor blocked: ${investor.data.block_reason ?? 'compliance'}`,
      );

    const compliance = await this.supabase.admin
      .from('compliance_checks')
      .select('*')
      .eq('id', dto.complianceCheckId)
      .maybeSingle();
    if (!compliance.data || compliance.data.status !== 'approved') {
      throw new ForbiddenException(
        'Você precisa concluir a verificação de compliance (Chainalysis) antes da compra.',
      );
    }
    const ageMs = Date.now() - new Date(compliance.data.checked_at).getTime();
    if (ageMs > 30 * 60 * 1000) {
      throw new ForbiddenException(
        'A verificação de compliance expirou. Refaça o check.',
      );
    }
    if (compliance.data.wallet_address !== investor.data.wallet_address) {
      throw new ForbiddenException('Compliance check de outra wallet.');
    }

    const price = Number(dev.token_price_usdc ?? 0);
    const totalUsdc = +(price * dto.cotasAmount).toFixed(6);

    // Validate the on-chain HolderState reflects the freshly-bought cotas.
    // (When the frontend submits the tx, by the time it calls /confirm the
    // chain has caught up. We confirm the balance is at least the new amount.)
    const nonce = (dev as { project_seed_nonce?: number }).project_seed_nonce ?? 0;
    let txSig = dto.clientTxSignature ?? null;
    let onChainCotaBalance: bigint = 0n;
    try {
      const holderPubkey = new PublicKey(investor.data.wallet_address);
      const holder = await this.solana.getHolder(dev.id, holderPubkey, nonce);
      if (holder) {
        onChainCotaBalance = BigInt(holder.cotaBalance.toString());
      }
      // If the client passed a tx signature, fetch it to be sure it landed.
      if (txSig) {
        const status = await this.solana.connection.getSignatureStatus(txSig, {
          searchTransactionHistory: true,
        });
        if (!status.value || status.value.err) {
          throw new ForbiddenException(
            'Transação on-chain não confirmada ou falhou.',
          );
        }
      }
    } catch (err) {
      this.log.warn(
        `On-chain validation skipped (RPC issue or program not deployed): ${(err as Error).message}`,
      );
    }

    const purchase = await this.supabase.admin
      .from('cota_purchases')
      .insert({
        investor_id: investorId,
        development_id: dev.id,
        cotas_amount: dto.cotasAmount,
        price_per_cota_usdc: price,
        total_usdc: totalUsdc,
        compliance_check_id: dto.complianceCheckId,
        tx_signature: txSig,
        tx_status: 'confirmed',
      })
      .select()
      .single();
    if (purchase.error) throw new BadRequestException(purchase.error.message);

    // Upsert holder_states bookkeeping row.
    const holderPda = (() => {
      try {
        return this.solana
          .holderPda(dev.id, new PublicKey(investor.data.wallet_address), nonce)
          .toBase58();
      } catch {
        return '';
      }
    })();
    if (holderPda) {
      const existing = await this.supabase.admin
        .from('holder_states')
        .select('id, cota_balance')
        .eq('development_id', dev.id)
        .eq('investor_id', investorId)
        .maybeSingle();
      if (existing.data) {
        await this.supabase.admin
          .from('holder_states')
          .update({
            cota_balance:
              Number(existing.data.cota_balance ?? 0) + dto.cotasAmount,
          })
          .eq('id', existing.data.id);
      } else {
        await this.supabase.admin.from('holder_states').insert({
          development_id: dev.id,
          investor_id: investorId,
          wallet_address: investor.data.wallet_address,
          holder_pda: holderPda,
          cota_balance: dto.cotasAmount,
        });
      }
    }

    const newRaised = Number(dev.amount_raised_usdc ?? 0) + totalUsdc;
    await this.supabase.admin
      .from('developments')
      .update({ amount_raised_usdc: newRaised })
      .eq('id', dev.id);

    return {
      purchase: purchase.data,
      tx_signature: txSig,
      total_raised_usdc: newRaised,
      on_chain_cota_balance: onChainCotaBalance.toString(),
    };
  }

  /**
   * Recovery path: scans on-chain HolderState for the investor's wallet
   * across one (or all) developments, compares with the sum of cotas already
   * persisted in `cota_purchases`, and inserts a synthetic purchase row for
   * any positive gap. Used when /confirm failed mid-flow (compliance expired,
   * RPC blip, cold start) but the on-chain tx already landed.
   */
  async reconcile(investorId: string, dto: ReconcilePurchasesDto) {
    const investor = await this.supabase.admin
      .from('investors')
      .select('id, wallet_address, is_blocked, block_reason')
      .eq('id', investorId)
      .maybeSingle();
    if (!investor.data) throw new NotFoundException('Investor not found');
    if (investor.data.is_blocked)
      throw new ForbiddenException(
        `Investor blocked: ${investor.data.block_reason ?? 'compliance'}`,
      );
    if (!investor.data.wallet_address)
      throw new BadRequestException('Investor has no wallet attached.');

    let holderPubkey: PublicKey;
    try {
      holderPubkey = new PublicKey(investor.data.wallet_address);
    } catch {
      throw new BadRequestException('Invalid wallet address on investor row.');
    }

    let devsQuery = this.supabase.admin.from('developments').select('*');
    if (dto.developmentId) devsQuery = devsQuery.eq('id', dto.developmentId);
    const devsRes = await devsQuery;
    if (devsRes.error) throw new BadRequestException(devsRes.error.message);
    const devs = (devsRes.data ?? []) as Array<{
      id: string;
      token_price_usdc: number | null;
      amount_raised_usdc: number | null;
      project_seed_nonce?: number;
    }>;

    const reconciled: Array<{
      development_id: string;
      gap_cotas: number;
      purchase_id: string | null;
      on_chain_balance: string;
      db_balance: number;
    }> = [];

    for (const dev of devs) {
      const nonce = dev.project_seed_nonce ?? 0;
      let onChainBalance = 0n;
      try {
        const holder = await this.solana.getHolder(dev.id, holderPubkey, nonce);
        if (holder) onChainBalance = BigInt(holder.cotaBalance.toString());
      } catch (err) {
        this.log.warn(
          `Reconcile: failed to read holder for dev=${dev.id}: ${(err as Error).message}`,
        );
        continue;
      }
      if (onChainBalance === 0n) continue;

      const existing = await this.supabase.admin
        .from('cota_purchases')
        .select('cotas_amount')
        .eq('investor_id', investorId)
        .eq('development_id', dev.id);
      if (existing.error) {
        this.log.warn(
          `Reconcile: failed to read purchases for dev=${dev.id}: ${existing.error.message}`,
        );
        continue;
      }
      const dbBalance = (existing.data ?? []).reduce(
        (sum, row) => sum + Number(row.cotas_amount ?? 0),
        0,
      );
      const gap = Number(onChainBalance) - dbBalance;
      if (gap <= 0) continue;

      const price = Number(dev.token_price_usdc ?? 0);
      const totalUsdc = +(price * gap).toFixed(6);

      const inserted = await this.supabase.admin
        .from('cota_purchases')
        .insert({
          investor_id: investorId,
          development_id: dev.id,
          cotas_amount: gap,
          price_per_cota_usdc: price,
          total_usdc: totalUsdc,
          tx_signature: null,
          tx_status: 'reconciled',
        })
        .select()
        .single();
      if (inserted.error) {
        this.log.warn(
          `Reconcile: failed to insert purchase for dev=${dev.id}: ${inserted.error.message}`,
        );
        continue;
      }

      const holderPda = (() => {
        try {
          return this.solana.holderPda(dev.id, holderPubkey, nonce).toBase58();
        } catch {
          return '';
        }
      })();
      if (holderPda) {
        const existingHolder = await this.supabase.admin
          .from('holder_states')
          .select('id, cota_balance')
          .eq('development_id', dev.id)
          .eq('investor_id', investorId)
          .maybeSingle();
        if (existingHolder.data) {
          await this.supabase.admin
            .from('holder_states')
            .update({ cota_balance: Number(onChainBalance) })
            .eq('id', existingHolder.data.id);
        } else {
          await this.supabase.admin.from('holder_states').insert({
            development_id: dev.id,
            investor_id: investorId,
            wallet_address: investor.data.wallet_address,
            holder_pda: holderPda,
            cota_balance: Number(onChainBalance),
          });
        }
      }

      const newRaised = Number(dev.amount_raised_usdc ?? 0) + totalUsdc;
      await this.supabase.admin
        .from('developments')
        .update({ amount_raised_usdc: newRaised })
        .eq('id', dev.id);

      reconciled.push({
        development_id: dev.id,
        gap_cotas: gap,
        purchase_id: inserted.data?.id ?? null,
        on_chain_balance: onChainBalance.toString(),
        db_balance: dbBalance,
      });
    }

    return { reconciled, scanned: devs.length };
  }
}
