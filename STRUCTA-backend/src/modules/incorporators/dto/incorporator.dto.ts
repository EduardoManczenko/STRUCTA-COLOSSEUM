import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';

const CPF_REGEX = /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/;
const CNPJ_REGEX = /^\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}$/;

export class CreateIncorporatorSubmissionDto {
  // 1. Dados
  @IsString() razao_social!: string;
  @IsOptional() @IsString() nome_fantasia?: string;
  @IsString() @Matches(CNPJ_REGEX, { message: 'CNPJ inválido' }) cnpj!: string;
  @IsString() endereco_sede!: string;
  @IsString() municipio!: string;
  @IsString() @Length(2, 2) uf!: string;
  @IsOptional() @IsString() site?: string;
  @IsOptional() @IsString() social_media?: string;
  @IsString() telefone!: string;

  // 2. Responsável
  @IsString() responsavel_nome!: string;
  @IsString() responsavel_cargo!: string;
  @IsString() @Matches(CPF_REGEX, { message: 'CPF inválido' }) responsavel_cpf!: string;
  @IsEmail() responsavel_email!: string;
  @IsString() responsavel_whatsapp!: string;

  // 3. Histórico
  @IsInt() @Min(1900) @Max(2100) @Type(() => Number) ano_fundacao!: number;
  @IsInt() @Min(0) @Type(() => Number) empreendimentos_entregues!: number;
  @IsNumber() @Min(0) @Type(() => Number) vgv_total_entregue_brl!: number;
  @IsArray() @ArrayNotEmpty() @IsString({ each: true }) estados_atuacao!: string[];
  @IsOptional() @IsArray() empreendimentos_em_andamento?: Array<{
    nome: string;
    cidade: string;
  }>;

  // 4. Certificações
  @IsBoolean() iso_9001_certificada!: boolean;
  @ValidateIf((o) => o.iso_9001_certificada)
  @IsString() iso_9001_numero?: string;
  @ValidateIf((o) => o.iso_9001_certificada)
  @IsDateString() iso_9001_validade?: string;
  @ValidateIf((o) => o.iso_9001_certificada)
  @IsString() iso_9001_organismo?: string;

  @IsOptional() @IsString() pbqp_h_nivel?: 'A' | 'B';
  @IsOptional() @IsString() pbqp_h_numero?: string;
  @IsOptional() @IsDateString() pbqp_h_validade?: string;
  @IsOptional() @IsString() pbqp_h_organismo?: string;

  // 5. Declaração
  @IsString() representante_nome!: string;
  @IsString() @Matches(CPF_REGEX) representante_cpf!: string;
  @IsString() representante_cargo!: string;
  @IsBoolean() declaracao_veracidade!: boolean;
  @IsBoolean() declaracao_certificacoes!: boolean;
  @IsBoolean() declaracao_documentos!: boolean;
  @IsBoolean() declaracao_diligencia!: boolean;

  @IsOptional() @IsString() logo_url?: string;

  // Account credentials — used to pre-create the Supabase Auth user
  @IsEmail() login_email!: string;
  @IsString() @Length(8, 72) password!: string;
}
