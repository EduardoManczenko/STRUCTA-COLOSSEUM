export type UserRole = "admin" | "incorporator" | "investor" | "pending_incorporator";

export type DevelopmentStatus =
  | "rascunho"
  | "pendente"
  | "aprovado"
  | "recusado"
  | "venda_aberta"
  | "em_construcao"
  | "distribuindo_yield"
  | "aguardando_burn"
  | "finalizado"
  | "cancelado";

export type IncorporatorStatus =
  | "pendente"
  | "aprovada"
  | "recusada"
  | "suspensa";

export type DevelopmentType =
  | "residencial_vertical"
  | "residencial_horizontal"
  | "misto"
  | "comercial";

export type YieldPeriodicity = "mensal" | "trimestral" | "semestral" | "anual";
export type ComplianceStatus = "approved" | "rejected" | "pending";

export type ProposalAction =
  | "approve_development"
  | "reject_development"
  | "open_sale"
  | "close_sale"
  | "withdraw_principal"
  | "distribute_yield"
  | "unlock_burn"
  | "lock_burn"
  | "refund_fund"
  | "create_smart_contracts";

export interface IncorporatorListItem {
  id: string;
  razao_social: string;
  nome_fantasia: string | null;
  logo_url: string | null;
  site: string | null;
  municipio: string;
  uf: string;
  ano_fundacao: number;
  empreendimentos_entregues: number;
  vgv_total_entregue_brl: number;
  iso_9001_certificada: boolean;
  pbqp_h_nivel: "A" | "B" | null;
  status?: IncorporatorStatus;
}

export interface DevelopmentListItem {
  id: string;
  slug: string | null;
  nome: string;
  nome_comercial: string | null;
  tipo: DevelopmentType;
  municipio: string;
  uf: string;
  cover_image_url: string | null;
  vgv_brl: number;
  captacao_target_brl: number;
  amount_raised_usdc: number;
  prazo_captacao_dias: number;
  yield_apy_percent: number | null;
  yield_periodicidade: YieldPeriodicity | null;
  prazo_total_token_meses: number | null;
  status: DevelopmentStatus;
  sale_open: boolean;
  units_sold: number;
  numero_unidades: number;
  token_symbol: string | null;
  token_price_usdc: number | null;
  previsao_habite_se: string | null;
  incorporator: Pick<
    IncorporatorListItem,
    "id" | "razao_social" | "nome_fantasia" | "logo_url" | "status"
  > | null;
}

export interface DevelopmentImage {
  id: string;
  storage_path: string;
  url: string;
  caption: string | null;
  order_index: number;
}

export interface DevelopmentDocument {
  id: string;
  type: string;
  label: string | null;
  filename: string;
  mime_type: string;
  size_bytes: number;
  sha256_hash: string | null;
  registered_data: Record<string, unknown> | null;
  created_at: string;
}

export interface DevelopmentUnit {
  id: string;
  identifier: string;
  metragem_m2: number | null;
  preco_brl: number | null;
  status: string;
  sold_at: string | null;
}

export interface DevelopmentDetail extends DevelopmentListItem {
  endereco_terreno: string;
  cep: string;
  matricula_cri: string | null;
  area_terreno_m2: number | null;
  area_construida_total_m2: number | null;
  padrao: string | null;
  previsao_inicio_obra: string | null;
  description: string | null;
  // SPE
  spe_razao_social: string;
  spe_cnpj: string;
  spe_data_constituicao: string;
  spe_nire: string | null;
  spe_endereco: string | null;
  spe_cartorio: string | null;
  spe_registro: string | null;
  spe_patrimonio_afetacao: boolean | null;
  spe_patrimonio_afetacao_registro: string | null;
  spe_ret_ativo: boolean | null;
  // Construtora
  construtora_responsavel_tecnico: string | null;
  construtora_crea_cau: string | null;
  construtora_uf: string | null;
  // Financeiro
  custo_total_construcao_brl: number;
  custo_terreno_brl: number | null;
  cub_referencia_mes_ano: string | null;
  cub_sinduscon: string | null;
  bdi_percent: number | null;
  percentual_custo_construcao_coberto: number | null;
  // Smart contract addresses
  vault_principal_address: string | null;
  vault_yield_address: string | null;
  burn_pool_address: string | null;
  cota_mint_address: string | null;
  burn_unlocked: boolean;
  refund_enabled: boolean;
  // Tokenomics extras
  token_name: string | null;
  token_supply: number | null;
  // Relations
  images: DevelopmentImage[];
  documents: DevelopmentDocument[];
  units: DevelopmentUnit[];
  yield_history: Array<{
    amount_usdc: number;
    reference_period: string | null;
    distributed_at: string;
  }>;
  incorporator:
    | (IncorporatorListItem & {
        ano_fundacao: number;
        empreendimentos_entregues: number;
        vgv_total_entregue_brl: number;
        estados_atuacao: string[];
        iso_9001_numero: string | null;
        iso_9001_validade: string | null;
        pbqp_h_numero: string | null;
        pbqp_h_validade: string | null;
      })
    | null;
}

export interface AuthUser {
  id: string;
  email: string | null;
  role: UserRole;
  walletAddress?: string | null;
  isMultisigSigner?: boolean;
  source: "supabase" | "wallet";
  full_name?: string | null;
}

export interface ChainalysisResult {
  id: string;
  status: ComplianceStatus;
  riskScore: number;
  riskLevel: "low" | "medium" | "high" | "severe";
  identifications: Array<{
    category: string;
    name: string;
    description: string;
  }>;
  source: "mock" | "live";
}

export interface PortfolioBalance {
  investor_id: string | null;
  development_id: string | null;
  token_symbol: string | null;
  nome: string | null;
  total_cotas: number | null;
  total_invested_usdc: number | null;
  current_value_usdc: number | null;
}

export interface PortfolioPurchase {
  id: string;
  cotas_amount: number;
  price_per_cota_usdc: number;
  total_usdc: number;
  tx_signature: string | null;
  created_at: string;
  development: {
    id: string;
    slug: string | null;
    nome: string;
    token_symbol: string | null;
    status: DevelopmentStatus;
    sale_open: boolean;
    cover_image_url: string | null;
    yield_apy_percent: number | null;
    yield_periodicidade: YieldPeriodicity | null;
    prazo_total_token_meses: number | null;
    token_price_usdc: number | null;
  } | null;
}

export interface Portfolio {
  purchases: PortfolioPurchase[];
  balances: PortfolioBalance[];
  totals: {
    invested_usdc: number;
    current_value_usdc: number;
    unrealized_pnl_usdc: number;
    unrealized_pnl_percent: number;
  };
  yield_history: Array<{
    amount_usdc: number;
    reference_period: string | null;
    distributed_at: string;
    development_id: string;
  }>;
}

export interface MultisigSignature {
  id: string;
  wallet_address: string;
  signed_at: string;
}

export interface MultisigOwnerWallet {
  id: string;
  wallet_address: string;
  label: string | null;
  added_at: string;
}

export interface MultisigProposal {
  id: string;
  development_id: string | null;
  action: ProposalAction;
  description: string | null;
  payload: Record<string, unknown>;
  required_signatures: number;
  total_signers: number;
  status: "open" | "executed" | "rejected" | "expired";
  expires_at: string | null;
  executed_at: string | null;
  executed_tx: string | null;
  created_at: string;
  proposed_by: string | null;
  /** On-chain wallet signatures collected so far */
  signatures: MultisigSignature[];
  development: {
    id: string;
    nome: string;
    status: DevelopmentStatus;
  } | null;
  proposer: { email: string | null; full_name: string | null } | null;
}
