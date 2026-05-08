import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../../common/supabase/supabase.service';
import type { Json } from '../../common/supabase/database.types';

export interface ChainalysisResult {
  status: 'approved' | 'rejected' | 'pending';
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'severe';
  identifications: Array<{ category: string; name: string; description: string }>;
  rawResponse: Json;
  source: 'mock' | 'live';
}

@Injectable()
export class ComplianceService {
  private readonly logger = new Logger('Compliance');

  constructor(
    private readonly supabase: SupabaseService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Mocks Chainalysis Address Screening API.
   * In production: GET https://public.chainalysis.com/api/v1/address/{walletAddress}
   * Header: X-API-Key: <CHAINALYSIS_API_KEY>
   */
  async screenWallet(
    walletAddress: string,
    amountUsdc?: number,
    developmentId?: string,
  ): Promise<ChainalysisResult & { id: string }> {
    const result = this.mockScreening(walletAddress);

    const { data, error } = await this.supabase.admin
      .from('compliance_checks')
      .insert({
        wallet_address: walletAddress,
        amount_usdc: amountUsdc ?? null,
        development_id: developmentId ?? null,
        status: result.status,
        risk_score: result.riskScore,
        raw_response: result.rawResponse,
      })
      .select('id')
      .single();

    if (error) {
      this.logger.error(`Failed to persist compliance check: ${error.message}`);
    }

    if (data) {
      await this.supabase.admin
        .from('investors')
        .update({
          chainalysis_status: result.status,
          chainalysis_risk_score: result.riskScore,
          last_chainalysis_check_at: new Date().toISOString(),
          is_blocked: result.status === 'rejected',
          block_reason:
            result.status === 'rejected'
              ? `Chainalysis flagged: ${result.identifications
                  .map((i) => i.category)
                  .join(', ')}`
              : null,
        })
        .eq('wallet_address', walletAddress);
    }

    return { ...result, id: data?.id ?? '' };
  }

  /**
   * Deterministic mock so the same wallet returns the same result.
   * Wallets ending with 'AAA' get rejected for testing.
   */
  private mockScreening(walletAddress: string): ChainalysisResult {
    const hash = [...walletAddress].reduce(
      (acc, c) => (acc * 31 + c.charCodeAt(0)) % 1_000_000,
      0,
    );
    const score = hash % 100;
    let status: 'approved' | 'rejected' = 'approved';
    let riskLevel: 'low' | 'medium' | 'high' | 'severe' = 'low';
    const identifications: ChainalysisResult['identifications'] = [];

    if (walletAddress.endsWith('AAA') || score >= 95) {
      status = 'rejected';
      riskLevel = 'severe';
      identifications.push({
        category: 'sanctions',
        name: 'OFAC SDN',
        description: 'Wallet appears on the OFAC Specially Designated Nationals list.',
      });
    } else if (score >= 80) {
      riskLevel = 'high';
      identifications.push({
        category: 'mixer',
        name: 'High-risk exposure',
        description: 'Indirect exposure to a mixer.',
      });
    } else if (score >= 50) {
      riskLevel = 'medium';
    }

    return {
      status,
      riskScore: score,
      riskLevel,
      identifications,
      source: 'mock',
      rawResponse: {
        provider: 'chainalysis',
        endpoint: '/address/{walletAddress}',
        mock: true,
        walletAddress,
        score,
        riskLevel,
        identifications,
        timestamp: new Date().toISOString(),
      },
    };
  }
}
