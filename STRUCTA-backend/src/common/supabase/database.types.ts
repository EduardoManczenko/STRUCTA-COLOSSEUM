export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: { PostgrestVersion: '14.5' };
  public: {
    Tables: {
      compliance_checks: {
        Row: {
          amount_usdc: number | null;
          checked_at: string;
          development_id: string | null;
          id: string;
          investor_id: string | null;
          raw_response: Json | null;
          risk_score: number | null;
          status: Database['public']['Enums']['compliance_status'];
          wallet_address: string;
        };
        Insert: Partial<Database['public']['Tables']['compliance_checks']['Row']> & {
          status: Database['public']['Enums']['compliance_status'];
          wallet_address: string;
        };
        Update: Partial<Database['public']['Tables']['compliance_checks']['Row']>;
        Relationships: [];
      };
      cota_purchases: {
        Row: {
          compliance_check_id: string | null;
          cotas_amount: number;
          created_at: string;
          development_id: string;
          id: string;
          investor_id: string;
          price_per_cota_usdc: number;
          total_usdc: number;
          tx_signature: string | null;
          tx_status: string;
        };
        Insert: Partial<Database['public']['Tables']['cota_purchases']['Row']> & {
          cotas_amount: number;
          development_id: string;
          investor_id: string;
          price_per_cota_usdc: number;
          total_usdc: number;
        };
        Update: Partial<Database['public']['Tables']['cota_purchases']['Row']>;
        Relationships: [];
      };
      development_documents: {
        Row: {
          arweave_tx_id: string | null;
          created_at: string;
          development_id: string;
          filename: string;
          id: string;
          label: string | null;
          mime_type: string;
          registered_data: Json | null;
          sha256_hash: string | null;
          size_bytes: number;
          storage_path: string;
          type: string;
          uploaded_by: string | null;
        };
        Insert: Partial<Database['public']['Tables']['development_documents']['Row']> & {
          development_id: string;
          filename: string;
          mime_type: string;
          size_bytes: number;
          storage_path: string;
          type: string;
        };
        Update: Partial<Database['public']['Tables']['development_documents']['Row']>;
        Relationships: [];
      };
      development_images: {
        Row: {
          caption: string | null;
          created_at: string;
          development_id: string;
          id: string;
          order_index: number;
          storage_path: string;
          url: string;
        };
        Insert: Partial<Database['public']['Tables']['development_images']['Row']> & {
          development_id: string;
          storage_path: string;
          url: string;
        };
        Update: Partial<Database['public']['Tables']['development_images']['Row']>;
        Relationships: [];
      };
      development_units: {
        Row: {
          created_at: string;
          development_id: string;
          id: string;
          identifier: string;
          metragem_m2: number | null;
          preco_brl: number | null;
          sold_at: string | null;
          status: string;
        };
        Insert: Partial<Database['public']['Tables']['development_units']['Row']> & {
          development_id: string;
          identifier: string;
        };
        Update: Partial<Database['public']['Tables']['development_units']['Row']>;
        Relationships: [];
      };
      developments: {
        Row: {
          amount_raised_usdc: number;
          approved_at: string | null;
          area_construida_total_m2: number | null;
          area_terreno_m2: number | null;
          bdi_percent: number | null;
          burn_pool_address: string | null;
          burn_unlocked: boolean;
          captacao_target_brl: number;
          cep: string;
          construtora_crea_cau: string | null;
          /** PDA["project", project_seed] holding ProjectState on-chain */
          project_account_address: string | null;
          /** PDA["authority", project] that signs vault/mint operations */
          project_authority_pda: string | null;
          /** Address of the deployed structa program */
          solana_program_id: string | null;
          /** Tx signature returned by initialize_project */
          init_tx_signature: string | null;
          construtora_responsavel_tecnico: string | null;
          construtora_uf: string | null;
          cota_mint_address: string | null;
          cover_image_url: string | null;
          created_at: string;
          cub_referencia_mes_ano: string | null;
          cub_sinduscon: string | null;
          custo_terreno_brl: number | null;
          custo_total_construcao_brl: number;
          description: string | null;
          endereco_terreno: string;
          id: string;
          incorporator_id: string;
          matricula_cri: string | null;
          municipio: string;
          nome: string;
          nome_comercial: string | null;
          numero_unidades: number;
          padrao: string | null;
          percentual_custo_construcao_coberto: number | null;
          prazo_captacao_dias: number;
          prazo_total_token_meses: number | null;
          previsao_habite_se: string | null;
          previsao_inicio_obra: string | null;
          refund_enabled: boolean;
          reviewed_at: string | null;
          reviewed_by: string | null;
          sale_open: boolean;
          slug: string | null;
          spe_cartorio: string | null;
          spe_cnpj: string;
          spe_data_constituicao: string;
          spe_endereco: string | null;
          spe_nire: string | null;
          spe_patrimonio_afetacao: boolean | null;
          spe_patrimonio_afetacao_registro: string | null;
          spe_razao_social: string;
          spe_registro: string | null;
          spe_ret_ativo: boolean | null;
          status: Database['public']['Enums']['development_status'];
          status_reason: string | null;
          tipo: Database['public']['Enums']['development_type'];
          token_name: string | null;
          token_price_usdc: number | null;
          token_supply: number | null;
          token_symbol: string | null;
          uf: string;
          units_sold: number;
          updated_at: string;
          vault_principal_address: string | null;
          vault_yield_address: string | null;
          vgv_brl: number;
          yield_apy_percent: number | null;
          yield_periodicidade: Database['public']['Enums']['yield_periodicity'] | null;
        };
        Insert: Partial<Database['public']['Tables']['developments']['Row']> & {
          captacao_target_brl: number;
          cep: string;
          custo_total_construcao_brl: number;
          endereco_terreno: string;
          incorporator_id: string;
          municipio: string;
          nome: string;
          prazo_captacao_dias: number;
          spe_cnpj: string;
          spe_data_constituicao: string;
          spe_razao_social: string;
          tipo: Database['public']['Enums']['development_type'];
          uf: string;
          vgv_brl: number;
        };
        Update: Partial<Database['public']['Tables']['developments']['Row']>;
        Relationships: [];
      };
      incorporator_documents: {
        Row: {
          created_at: string;
          filename: string;
          id: string;
          incorporator_id: string;
          mime_type: string;
          size_bytes: number;
          storage_path: string;
          type: string;
          uploaded_by: string | null;
        };
        Insert: Partial<Database['public']['Tables']['incorporator_documents']['Row']> & {
          filename: string;
          incorporator_id: string;
          mime_type: string;
          size_bytes: number;
          storage_path: string;
          type: string;
        };
        Update: Partial<Database['public']['Tables']['incorporator_documents']['Row']>;
        Relationships: [];
      };
      incorporators: {
        Row: {
          ano_fundacao: number;
          cnpj: string;
          created_at: string;
          data_submissao: string;
          declaracao_certificacoes: boolean;
          declaracao_diligencia: boolean;
          declaracao_documentos: boolean;
          declaracao_veracidade: boolean;
          email_comercial: string;
          empreendimentos_em_andamento: Json;
          empreendimentos_entregues: number;
          endereco_sede: string;
          estados_atuacao: string[];
          id: string;
          iso_9001_certificada: boolean;
          iso_9001_numero: string | null;
          iso_9001_organismo: string | null;
          iso_9001_validade: string | null;
          logo_url: string | null;
          municipio: string;
          nome_fantasia: string | null;
          owner_user_id: string | null;
          pbqp_h_nivel: string | null;
          pbqp_h_numero: string | null;
          pbqp_h_organismo: string | null;
          pbqp_h_validade: string | null;
          razao_social: string;
          representante_cargo: string;
          representante_cpf: string;
          representante_nome: string;
          responsavel_cargo: string;
          responsavel_cpf: string;
          responsavel_email: string;
          responsavel_nome: string;
          responsavel_whatsapp: string;
          reviewed_at: string | null;
          reviewed_by: string | null;
          site: string | null;
          social_media: string | null;
          status: Database['public']['Enums']['incorporator_status'];
          status_reason: string | null;
          telefone: string;
          uf: string;
          updated_at: string;
          vgv_total_entregue_brl: number;
        };
        Insert: Partial<Database['public']['Tables']['incorporators']['Row']> & {
          ano_fundacao: number;
          cnpj: string;
          email_comercial: string;
          endereco_sede: string;
          municipio: string;
          razao_social: string;
          representante_cargo: string;
          representante_cpf: string;
          representante_nome: string;
          responsavel_cargo: string;
          responsavel_cpf: string;
          responsavel_email: string;
          responsavel_nome: string;
          responsavel_whatsapp: string;
          telefone: string;
          uf: string;
        };
        Update: Partial<Database['public']['Tables']['incorporators']['Row']>;
        Relationships: [];
      };
      investors: {
        Row: {
          block_reason: string | null;
          chainalysis_risk_score: number | null;
          chainalysis_status: Database['public']['Enums']['compliance_status'] | null;
          created_at: string;
          display_name: string | null;
          email: string | null;
          ens_name: string | null;
          id: string;
          is_blocked: boolean;
          last_chainalysis_check_at: string | null;
          updated_at: string;
          user_id: string | null;
          wallet_address: string;
        };
        Insert: Partial<Database['public']['Tables']['investors']['Row']> & {
          wallet_address: string;
        };
        Update: Partial<Database['public']['Tables']['investors']['Row']>;
        Relationships: [];
      };
      multisig_proposals: {
        Row: {
          action: Database['public']['Enums']['proposal_action'];
          created_at: string;
          description: string | null;
          development_id: string | null;
          executed_at: string | null;
          executed_tx: string | null;
          expires_at: string | null;
          id: string;
          payload: Json;
          proposed_by: string | null;
          required_signatures: number;
          status: Database['public']['Enums']['proposal_status'];
          total_signers: number;
        };
        Insert: Partial<Database['public']['Tables']['multisig_proposals']['Row']> & {
          action: Database['public']['Enums']['proposal_action'];
        };
        Update: Partial<Database['public']['Tables']['multisig_proposals']['Row']>;
        Relationships: [];
      };
      multisig_owner_wallets: {
        Row: {
          id: string;
          wallet_address: string;
          label: string | null;
          added_at: string;
        };
        Insert: Partial<Database['public']['Tables']['multisig_owner_wallets']['Row']> & {
          wallet_address: string;
        };
        Update: Partial<Database['public']['Tables']['multisig_owner_wallets']['Row']>;
        Relationships: [];
      };
      multisig_signatures: {
        Row: {
          id: string;
          proposal_id: string;
          /** On-chain wallet address that signed (new model) */
          wallet_address: string | null;
          /** Base58-encoded Ed25519 signature */
          signature: string | null;
          signed_at: string;
          /** Legacy: user profile id (kept for backward compat, now nullable) */
          signer_id: string | null;
        };
        Insert: Partial<Database['public']['Tables']['multisig_signatures']['Row']> & {
          proposal_id: string;
        };
        Update: Partial<Database['public']['Tables']['multisig_signatures']['Row']>;
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          email: string | null;
          full_name: string | null;
          id: string;
          is_multisig_signer: boolean;
          phone: string | null;
          role: Database['public']['Enums']['user_role'];
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['profiles']['Row']> & {
          id: string;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Row']>;
        Relationships: [];
      };
      yield_distributions: {
        Row: {
          amount_usdc: number;
          created_by: string | null;
          development_id: string;
          distributed_at: string;
          id: string;
          reference_period: string | null;
          tx_signature: string | null;
        };
        Insert: Partial<Database['public']['Tables']['yield_distributions']['Row']> & {
          amount_usdc: number;
          development_id: string;
        };
        Update: Partial<Database['public']['Tables']['yield_distributions']['Row']>;
        Relationships: [];
      };
      holder_states: {
        Row: {
          id: string;
          development_id: string;
          investor_id: string;
          wallet_address: string;
          holder_pda: string;
          cota_balance: number;
          total_yield_claimed_usdc: number;
          last_claimed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['holder_states']['Row']> & {
          development_id: string;
          investor_id: string;
          wallet_address: string;
          holder_pda: string;
        };
        Update: Partial<Database['public']['Tables']['holder_states']['Row']>;
        Relationships: [];
      };
      protocol_config: {
        Row: {
          id: boolean;
          program_id: string;
          authority_wallet: string;
          usdc_mint: string;
          cluster: string;
          rpc_url: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['protocol_config']['Row']> & {
          program_id: string;
          authority_wallet: string;
          usdc_mint: string;
        };
        Update: Partial<Database['public']['Tables']['protocol_config']['Row']>;
        Relationships: [];
      };
    };
    Views: {
      cota_balances: {
        Row: {
          current_value_usdc: number | null;
          development_id: string | null;
          investor_id: string | null;
          nome: string | null;
          token_symbol: string | null;
          total_cotas: number | null;
          total_invested_usdc: number | null;
        };
        Relationships: [];
      };
    };
    Functions: { [_ in never]: never };
    Enums: {
      compliance_status: 'approved' | 'rejected' | 'pending';
      development_status:
        | 'rascunho'
        | 'pendente'
        | 'aprovado'
        | 'recusado'
        | 'venda_aberta'
        | 'em_construcao'
        | 'distribuindo_yield'
        | 'aguardando_burn'
        | 'finalizado'
        | 'cancelado';
      development_type:
        | 'residencial_vertical'
        | 'residencial_horizontal'
        | 'misto'
        | 'comercial';
      incorporator_status: 'pendente' | 'aprovada' | 'recusada' | 'suspensa';
      proposal_action:
        | 'approve_development'
        | 'reject_development'
        | 'open_sale'
        | 'close_sale'
        | 'withdraw_principal'
        | 'distribute_yield'
        | 'unlock_burn'
        | 'lock_burn'
        | 'refund_fund'
        | 'mint_cotas'
        | 'create_smart_contracts';
      proposal_status: 'open' | 'executed' | 'rejected' | 'expired';
      user_role: 'admin' | 'incorporator' | 'investor' | 'pending_incorporator';
      yield_index: 'IPCA' | 'IGP-M' | 'fixo';
      yield_periodicity: 'mensal' | 'trimestral' | 'semestral' | 'anual';
    };
    CompositeTypes: { [_ in never]: never };
  };
};

export type DevelopmentStatus = Database['public']['Enums']['development_status'];
export type IncorporatorStatus = Database['public']['Enums']['incorporator_status'];
export type UserRole = Database['public']['Enums']['user_role'];
export type ProposalAction = Database['public']['Enums']['proposal_action'];
export type ProposalStatus = Database['public']['Enums']['proposal_status'];
export type ComplianceStatus = Database['public']['Enums']['compliance_status'];
export type YieldIndex = Database['public']['Enums']['yield_index'];
export type YieldPeriodicity = Database['public']['Enums']['yield_periodicity'];
export type DevelopmentType = Database['public']['Enums']['development_type'];
