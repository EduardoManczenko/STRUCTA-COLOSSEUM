import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';

const CNPJ_REGEX = /^\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}$/;

export type DevelopmentTypeDto =
  | 'residencial_vertical'
  | 'residencial_horizontal'
  | 'misto'
  | 'comercial';

class UnitDto {
  @IsString() identifier!: string;
  @IsOptional() @IsNumber() @Type(() => Number) metragem_m2?: number;
  @IsOptional() @IsNumber() @Type(() => Number) preco_brl?: number;
}

class DocumentRefDto {
  @IsString() type!: string;
  @IsOptional() @IsString() label?: string;
  @IsString() storage_path!: string;
  @IsString() filename!: string;
  @IsString() mime_type!: string;
  @IsInt() @Type(() => Number) size_bytes!: number;
  @IsOptional() @IsString() sha256_hash?: string;
  @IsOptional() registered_data?: Record<string, unknown>;
}

class ImageRefDto {
  @IsString() storage_path!: string;
  @IsString() url!: string;
  @IsOptional() @IsString() caption?: string;
  @IsOptional() @IsInt() @Type(() => Number) order_index?: number;
}

export class CreateDevelopmentDto {
  // 1. Identificação
  @IsString() nome!: string;
  @IsOptional() @IsString() nome_comercial?: string;
  @IsEnum([
    'residencial_vertical',
    'residencial_horizontal',
    'misto',
    'comercial',
  ])
  tipo!: DevelopmentTypeDto;
  @IsString() endereco_terreno!: string;
  @IsString() municipio!: string;
  @IsString() @Length(2, 2) uf!: string;
  @IsString() cep!: string;
  @IsOptional() @IsString() matricula_cri?: string;
  @IsOptional() @IsNumber() @Type(() => Number) area_terreno_m2?: number;
  @IsOptional() @IsNumber() @Type(() => Number) area_construida_total_m2?: number;
  @IsInt() @Min(1) @Type(() => Number) numero_unidades!: number;
  @IsOptional() @IsString() padrao?: string;
  @IsOptional() @IsDateString() previsao_inicio_obra?: string;
  @IsOptional() @IsDateString() previsao_habite_se?: string;
  @IsOptional() @IsString() cover_image_url?: string;
  @IsOptional() @IsString() description?: string;

  // 2. SPE
  @IsString() spe_razao_social!: string;
  @IsString() @Matches(CNPJ_REGEX) spe_cnpj!: string;
  @IsDateString() spe_data_constituicao!: string;
  @IsOptional() @IsString() spe_nire?: string;
  @IsOptional() @IsString() spe_endereco?: string;
  @IsOptional() @IsString() spe_cartorio?: string;
  @IsOptional() @IsString() spe_registro?: string;
  @IsOptional() @IsBoolean() spe_patrimonio_afetacao?: boolean;
  @IsOptional() @IsString() spe_patrimonio_afetacao_registro?: string;
  @IsOptional() @IsBoolean() spe_ret_ativo?: boolean;

  // 3. Construtora
  @IsOptional() @IsString() construtora_responsavel_tecnico?: string;
  @IsOptional() @IsString() construtora_crea_cau?: string;
  @IsOptional() @IsString() @Length(2, 2) construtora_uf?: string;

  // 4. Financeiro
  @IsNumber() @Type(() => Number) vgv_brl!: number;
  @IsNumber() @Type(() => Number) custo_total_construcao_brl!: number;
  @IsOptional() @IsNumber() @Type(() => Number) custo_terreno_brl?: number;
  @IsOptional() @IsString() cub_referencia_mes_ano?: string;
  @IsOptional() @IsString() cub_sinduscon?: string;
  @IsOptional() @IsNumber() @Type(() => Number) bdi_percent?: number;

  @IsNumber() @Type(() => Number) captacao_target_brl!: number;
  @IsInt() @Type(() => Number) prazo_captacao_dias!: number;
  @IsOptional() @IsNumber() @Type(() => Number) percentual_custo_construcao_coberto?: number;

  // Anexos
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => ImageRefDto)
  images?: ImageRefDto[];

  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => DocumentRefDto)
  documents?: DocumentRefDto[];

  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => UnitDto)
  units?: UnitDto[];
}

export class ApproveDevelopmentDto {
  // 4.2 Yield (definido na aprovação)
  @IsNumber() @Type(() => Number) yield_apy_percent!: number;

  @IsEnum(['mensal', 'trimestral', 'semestral', 'anual'])
  yield_periodicidade!: 'mensal' | 'trimestral' | 'semestral' | 'anual';

  @IsInt() @Type(() => Number) prazo_total_token_meses!: number;

  @IsString() token_symbol!: string;
  @IsString() token_name!: string;

  @IsNumber() @Type(() => Number) token_supply!: number;
  @IsNumber() @Type(() => Number) token_price_usdc!: number;
}

export class RejectDevelopmentDto {
  @IsString() reason!: string;
}
