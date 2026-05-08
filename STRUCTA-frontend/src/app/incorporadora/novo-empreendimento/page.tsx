"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  ChevronRight,
  ImageIcon,
  Landmark,
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
import { Input, Select, Textarea } from "@/components/ui/Input";
import {
  ImageUploader,
  DocumentUploader,
  type DocumentEntry,
} from "@/components/forms/FileUpload";
import { apiPost, ApiError } from "@/lib/api";
import type { UploadedFile } from "@/lib/upload";

const TIPO_OPTIONS = [
  { value: "residencial_vertical", label: "Vertical residential" },
  { value: "residencial_horizontal", label: "Horizontal residential" },
  { value: "misto", label: "Mixed use" },
  { value: "comercial", label: "Commercial" },
];

const UF_OPTIONS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
].map((uf) => ({ value: uf, label: uf }));

const DOC_TYPES = [
  { type: "memorial_incorporacao", label: "Incorporation Memorial" },
  { type: "matricula_terreno", label: "Land Title Certificate" },
  { type: "patrimonio_afetacao", label: "Affectation Equity Registration" },
  { type: "alvara_construcao", label: "Building Permit" },
  { type: "projeto_aprovado", label: "Municipal-approved Project" },
  { type: "art_rrt", label: "ART/RRT (Technical Responsibility)" },
  { type: "cronograma", label: "Physical-financial Schedule" },
  { type: "orcamento", label: "Detailed Budget (BDI)" },
  { type: "contrato_social_spe", label: "SPE Articles of Incorporation" },
  { type: "estudo_viabilidade", label: "Economic Feasibility Study" },
];

interface Unit {
  identifier: string;
  metragem_m2?: number;
  preco_brl?: number;
}

interface Form {
  nome: string;
  nome_comercial: string;
  tipo: string;
  endereco_terreno: string;
  municipio: string;
  uf: string;
  cep: string;
  matricula_cri: string;
  area_terreno_m2: string;
  area_construida_total_m2: string;
  numero_unidades: string;
  padrao: string;
  previsao_inicio_obra: string;
  previsao_habite_se: string;
  description: string;
  // SPE
  spe_razao_social: string;
  spe_cnpj: string;
  spe_data_constituicao: string;
  spe_nire: string;
  spe_endereco: string;
  spe_cartorio: string;
  spe_registro: string;
  spe_patrimonio_afetacao: boolean;
  spe_patrimonio_afetacao_registro: string;
  spe_ret_ativo: boolean;
  // Construtora
  construtora_responsavel_tecnico: string;
  construtora_crea_cau: string;
  construtora_uf: string;
  // Financeiro
  vgv_brl: string;
  custo_total_construcao_brl: string;
  custo_terreno_brl: string;
  cub_referencia_mes_ano: string;
  cub_sinduscon: string;
  bdi_percent: string;
  captacao_target_brl: string;
  prazo_captacao_dias: string;
  percentual_custo_construcao_coberto: string;
}

const INITIAL: Form = {
  nome: "",
  nome_comercial: "",
  tipo: "residencial_vertical",
  endereco_terreno: "",
  municipio: "",
  uf: "SP",
  cep: "",
  matricula_cri: "",
  area_terreno_m2: "",
  area_construida_total_m2: "",
  numero_unidades: "1",
  padrao: "",
  previsao_inicio_obra: "",
  previsao_habite_se: "",
  description: "",
  spe_razao_social: "",
  spe_cnpj: "",
  spe_data_constituicao: "",
  spe_nire: "",
  spe_endereco: "",
  spe_cartorio: "",
  spe_registro: "",
  spe_patrimonio_afetacao: false,
  spe_patrimonio_afetacao_registro: "",
  spe_ret_ativo: false,
  construtora_responsavel_tecnico: "",
  construtora_crea_cau: "",
  construtora_uf: "SP",
  vgv_brl: "",
  custo_total_construcao_brl: "",
  custo_terreno_brl: "",
  cub_referencia_mes_ano: "",
  cub_sinduscon: "",
  bdi_percent: "",
  captacao_target_brl: "",
  prazo_captacao_dias: "180",
  percentual_custo_construcao_coberto: "",
};

const STEPS = [
  { id: 1, title: "Identification", icon: Building2 },
  { id: 2, title: "SPE & Construction", icon: Landmark },
  { id: 3, title: "Financial", icon: Wallet },
  { id: 4, title: "Media & docs", icon: ImageIcon },
];

export default function NewDevelopmentPage() {
  const router = useRouter();
  const [form, setForm] = useState<Form>(INITIAL);
  const [units, setUnits] = useState<Unit[]>([]);
  const [images, setImages] = useState<UploadedFile[]>([]);
  const [docs, setDocs] = useState<DocumentEntry[]>([]);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const update =
    <K extends keyof Form>(k: K) =>
    (v: Form[K]) =>
      setForm((s) => ({ ...s, [k]: v }));

  function validate(): string | null {
    if (step === 1) {
      const req: Array<keyof Form> = [
        "nome",
        "tipo",
        "endereco_terreno",
        "municipio",
        "uf",
        "cep",
        "numero_unidades",
      ];
      for (const k of req)
        if (!String(form[k]).trim()) return `Fill in: ${String(k)}`;
    }
    if (step === 2) {
      const req: Array<keyof Form> = [
        "spe_razao_social",
        "spe_cnpj",
        "spe_data_constituicao",
      ];
      for (const k of req)
        if (!String(form[k]).trim()) return `Fill in: ${String(k)}`;
    }
    if (step === 3) {
      const req: Array<keyof Form> = [
        "vgv_brl",
        "custo_total_construcao_brl",
        "captacao_target_brl",
        "prazo_captacao_dias",
      ];
      for (const k of req)
        if (!String(form[k]).trim()) return `Fill in: ${String(k)}`;
    }
    return null;
  }

  function next() {
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    setStep((s) => Math.min(STEPS.length, s + 1));
  }
  function back() {
    setStep((s) => Math.max(1, s - 1));
  }

  async function submit() {
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    setSubmitting(true);
    try {
      const cover = images[0]?.url ?? null;
      const payload = {
        nome: form.nome,
        nome_comercial: form.nome_comercial || undefined,
        tipo: form.tipo,
        endereco_terreno: form.endereco_terreno,
        municipio: form.municipio,
        uf: form.uf,
        cep: form.cep,
        matricula_cri: form.matricula_cri || undefined,
        area_terreno_m2: form.area_terreno_m2
          ? Number(form.area_terreno_m2)
          : undefined,
        area_construida_total_m2: form.area_construida_total_m2
          ? Number(form.area_construida_total_m2)
          : undefined,
        numero_unidades: Number(form.numero_unidades),
        padrao: form.padrao || undefined,
        previsao_inicio_obra: form.previsao_inicio_obra || undefined,
        previsao_habite_se: form.previsao_habite_se || undefined,
        cover_image_url: cover ?? undefined,
        description: form.description || undefined,
        spe_razao_social: form.spe_razao_social,
        spe_cnpj: form.spe_cnpj,
        spe_data_constituicao: form.spe_data_constituicao,
        spe_nire: form.spe_nire || undefined,
        spe_endereco: form.spe_endereco || undefined,
        spe_cartorio: form.spe_cartorio || undefined,
        spe_registro: form.spe_registro || undefined,
        spe_patrimonio_afetacao: form.spe_patrimonio_afetacao,
        spe_patrimonio_afetacao_registro:
          form.spe_patrimonio_afetacao_registro || undefined,
        spe_ret_ativo: form.spe_ret_ativo,
        construtora_responsavel_tecnico:
          form.construtora_responsavel_tecnico || undefined,
        construtora_crea_cau: form.construtora_crea_cau || undefined,
        construtora_uf: form.construtora_uf || undefined,
        vgv_brl: Number(form.vgv_brl),
        custo_total_construcao_brl: Number(form.custo_total_construcao_brl),
        custo_terreno_brl: form.custo_terreno_brl
          ? Number(form.custo_terreno_brl)
          : undefined,
        cub_referencia_mes_ano: form.cub_referencia_mes_ano || undefined,
        cub_sinduscon: form.cub_sinduscon || undefined,
        bdi_percent: form.bdi_percent ? Number(form.bdi_percent) : undefined,
        captacao_target_brl: Number(form.captacao_target_brl),
        prazo_captacao_dias: Number(form.prazo_captacao_dias),
        percentual_custo_construcao_coberto:
          form.percentual_custo_construcao_coberto
            ? Number(form.percentual_custo_construcao_coberto)
            : undefined,
        images: images.map((img, idx) => ({
          storage_path: img.path,
          url: img.url,
          order_index: idx,
        })),
        documents: docs.map((d) => ({
          type: d.type,
          label: d.label,
          storage_path: d.path,
          filename: d.filename,
          mime_type: d.mime_type,
          size_bytes: d.size_bytes,
        })),
        units: units
          .filter((u) => u.identifier.trim())
          .map((u) => ({
            identifier: u.identifier,
            metragem_m2: u.metragem_m2 ? Number(u.metragem_m2) : undefined,
            preco_brl: u.preco_brl ? Number(u.preco_brl) : undefined,
          })),
      };
      const res = await apiPost<{ id: string }>("/developments", payload);
      toast.success("Project submitted for review!");
      router.replace(`/incorporadora/empreendimentos/${res.id}`);
    } catch (e) {
      // Map raw backend errors to friendly user messages
      let msg = "Failed to submit the project. Please try again in a moment.";
      if (e instanceof ApiError) {
        if (e.status === 0) {
          msg =
            "Connection error. Please check your internet and try submitting again.";
        } else if (e.status === 401) {
          msg = "Your session expired. Please sign in again to continue.";
        } else if (e.status === 403) {
          // Most common cause: incorporator account is not yet approved.
          msg =
            "Your developer account is not yet approved. Once Structa approves your incorporator profile, you'll be able to submit projects.";
        } else if (
          typeof e.message === "string" &&
          !e.message.toLowerCase().includes("requires role") &&
          !e.message.toLowerCase().includes("forbidden")
        ) {
          msg = e.message;
        }
      }
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <Link
        href="/incorporadora/empreendimentos"
        className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-gray-400 transition hover:text-orange-400"
      >
        <ArrowLeft className="size-3.5" />
        Back
      </Link>

      <Stepper step={step} setStep={setStep} />

      <Card>
        <CardHeader>
          <CardTitle>{STEPS[step - 1].title}</CardTitle>
        </CardHeader>
        <CardContent>
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="grid gap-5"
          >
            {step === 1 && (
              <>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Input
                    label="Project name"
                    required
                    value={form.nome}
                    onChange={(e) => update("nome")(e.target.value)}
                  />
                  <Input
                    label="Commercial name"
                    value={form.nome_comercial}
                    onChange={(e) => update("nome_comercial")(e.target.value)}
                  />
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Select
                    label="Type"
                    required
                    options={TIPO_OPTIONS}
                    value={form.tipo}
                    onChange={(e) => update("tipo")(e.target.value)}
                  />
                  <Input
                    label="Standard"
                    placeholder="e.g. luxury, affordable…"
                    value={form.padrao}
                    onChange={(e) => update("padrao")(e.target.value)}
                  />
                </div>
                <Input
                  label="Land address"
                  required
                  value={form.endereco_terreno}
                  onChange={(e) => update("endereco_terreno")(e.target.value)}
                />
                <div className="grid gap-5 sm:grid-cols-3">
                  <Input
                    label="City"
                    required
                    value={form.municipio}
                    onChange={(e) => update("municipio")(e.target.value)}
                    className="sm:col-span-2"
                  />
                  <Select
                    label="UF"
                    required
                    options={UF_OPTIONS}
                    value={form.uf}
                    onChange={(e) => update("uf")(e.target.value)}
                  />
                </div>
                <div className="grid gap-5 sm:grid-cols-3">
                  <Input
                    label="CEP"
                    required
                    placeholder="00000-000"
                    value={form.cep}
                    onChange={(e) => update("cep")(e.target.value)}
                  />
                  <Input
                    label="No. of units"
                    required
                    type="number"
                    min={1}
                    value={form.numero_unidades}
                    onChange={(e) => update("numero_unidades")(e.target.value)}
                  />
                  <Input
                    label="Land Registry No."
                    value={form.matricula_cri}
                    onChange={(e) => update("matricula_cri")(e.target.value)}
                  />
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Input
                    label="Land area (m²)"
                    type="number"
                    value={form.area_terreno_m2}
                    onChange={(e) => update("area_terreno_m2")(e.target.value)}
                  />
                  <Input
                    label="Total built area (m²)"
                    type="number"
                    value={form.area_construida_total_m2}
                    onChange={(e) =>
                      update("area_construida_total_m2")(e.target.value)
                    }
                  />
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Input
                    label="Construction start"
                    type="date"
                    value={form.previsao_inicio_obra}
                    onChange={(e) =>
                      update("previsao_inicio_obra")(e.target.value)
                    }
                  />
                  <Input
                    label="Expected completion"
                    type="date"
                    value={form.previsao_habite_se}
                    onChange={(e) =>
                      update("previsao_habite_se")(e.target.value)
                    }
                  />
                </div>
                <Textarea
                  label="Description"
                  hint="Describe the concept, highlights and target market (visible on the public page)."
                  rows={5}
                  value={form.description}
                  onChange={(e) => update("description")(e.target.value)}
                />
              </>
            )}

            {step === 2 && (
              <>
                <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-purple-300">
                  SPE
                </h3>
                <Input
                  label="SPE legal name"
                  required
                  value={form.spe_razao_social}
                  onChange={(e) => update("spe_razao_social")(e.target.value)}
                />
                <div className="grid gap-5 sm:grid-cols-2">
                  <Input
                    label="CNPJ da SPE"
                    required
                    placeholder="00.000.000/0000-00"
                    value={form.spe_cnpj}
                    onChange={(e) => update("spe_cnpj")(e.target.value)}
                  />
                  <Input
                    label="Incorporation date"
                    type="date"
                    required
                    value={form.spe_data_constituicao}
                    onChange={(e) =>
                      update("spe_data_constituicao")(e.target.value)
                    }
                  />
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Input
                    label="NIRE"
                    value={form.spe_nire}
                    onChange={(e) => update("spe_nire")(e.target.value)}
                  />
                  <Input
                    label="Notary office"
                    value={form.spe_cartorio}
                    onChange={(e) => update("spe_cartorio")(e.target.value)}
                  />
                </div>
                <Input
                  label="SPE address"
                  value={form.spe_endereco}
                  onChange={(e) => update("spe_endereco")(e.target.value)}
                />
                <Input
                  label="Registration no."
                  value={form.spe_registro}
                  onChange={(e) => update("spe_registro")(e.target.value)}
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <BoolBox
                    checked={form.spe_patrimonio_afetacao}
                    label="Has affectation equity"
                    onChange={(v) => update("spe_patrimonio_afetacao")(v)}
                  />
                  <BoolBox
                    checked={form.spe_ret_ativo}
                    label="RET ativo"
                    onChange={(v) => update("spe_ret_ativo")(v)}
                  />
                </div>
                {form.spe_patrimonio_afetacao && (
                  <Input
                    label="Affectation equity registration"
                    value={form.spe_patrimonio_afetacao_registro}
                    onChange={(e) =>
                      update("spe_patrimonio_afetacao_registro")(e.target.value)
                    }
                  />
                )}

                <h3 className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-purple-300">
                  Construction company
                </h3>
                <div className="grid gap-5 sm:grid-cols-3">
                  <Input
                    label="Technical director"
                    value={form.construtora_responsavel_tecnico}
                    onChange={(e) =>
                      update("construtora_responsavel_tecnico")(e.target.value)
                    }
                    className="sm:col-span-2"
                  />
                  <Input
                    label="CREA/CAU"
                    value={form.construtora_crea_cau}
                    onChange={(e) =>
                      update("construtora_crea_cau")(e.target.value)
                    }
                  />
                </div>
                <Select
                  label="CREA/CAU state"
                  options={UF_OPTIONS}
                  value={form.construtora_uf}
                  onChange={(e) => update("construtora_uf")(e.target.value)}
                />
              </>
            )}

            {step === 3 && (
              <>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Input
                    label="VGV ($)"
                    required
                    type="number"
                    step="0.01"
                    value={form.vgv_brl}
                    onChange={(e) => update("vgv_brl")(e.target.value)}
                  />
                  <Input
                    label="Total construction cost ($)"
                    required
                    type="number"
                    step="0.01"
                    value={form.custo_total_construcao_brl}
                    onChange={(e) =>
                      update("custo_total_construcao_brl")(e.target.value)
                    }
                  />
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Input
                    label="Land cost ($)"
                    type="number"
                    step="0.01"
                    value={form.custo_terreno_brl}
                    onChange={(e) =>
                      update("custo_terreno_brl")(e.target.value)
                    }
                  />
                  <Input
                    label="BDI (%)"
                    type="number"
                    step="0.01"
                    value={form.bdi_percent}
                    onChange={(e) => update("bdi_percent")(e.target.value)}
                  />
                </div>
                <div className="grid gap-5 sm:grid-cols-3">
                  <Input
                    label="CUB reference (MM/YYYY)"
                    placeholder="01/2026"
                    value={form.cub_referencia_mes_ano}
                    onChange={(e) =>
                      update("cub_referencia_mes_ano")(e.target.value)
                    }
                  />
                  <Input
                    label="SINDUSCON"
                    value={form.cub_sinduscon}
                    onChange={(e) => update("cub_sinduscon")(e.target.value)}
                  />
                  <Input
                    label="% cost covered"
                    type="number"
                    step="0.01"
                    value={form.percentual_custo_construcao_coberto}
                    onChange={(e) =>
                      update("percentual_custo_construcao_coberto")(
                        e.target.value,
                      )
                    }
                  />
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Input
                    label="Fundraising target (USDC)"
                    required
                    type="number"
                    step="0.01"
                    placeholder="5000000.00"
                    hint="Total USDC amount you intend to raise via token sale"
                    value={form.captacao_target_brl}
                    onChange={(e) =>
                      update("captacao_target_brl")(e.target.value)
                    }
                  />
                  <Input
                    label="Fundraising period (days)"
                    required
                    type="number"
                    value={form.prazo_captacao_dias}
                    onChange={(e) =>
                      update("prazo_captacao_dias")(e.target.value)
                    }
                  />
                </div>

                <UnitsEditor units={units} setUnits={setUnits} />
              </>
            )}

            {step === 4 && (
              <>
                <ImageUploader
                  bucket="development-images"
                  folder={form.nome ? form.nome.toLowerCase() : "dev"}
                  value={images}
                  onChange={setImages}
                  label="Images & renders"
                />
                <DocumentUploader
                  bucket="development-documents"
                  folder={form.nome ? form.nome.toLowerCase() : "dev"}
                  documentTypes={DOC_TYPES}
                  value={docs}
                  onChange={setDocs}
                />
              </>
            )}
          </motion.div>

          <div className="mt-6 flex items-center justify-between gap-3 border-t border-dark-700 pt-5">
            <Button
              variant="secondary"
              onClick={back}
              disabled={step === 1 || submitting}
              leftIcon={<ArrowLeft className="size-4" />}
            >
              Back
            </Button>
            {step < STEPS.length ? (
              <Button
                onClick={next}
                rightIcon={<ChevronRight className="size-4" />}
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={submit}
                loading={submitting}
                rightIcon={<CheckCircle2 className="size-4" />}
              >
                Submit for approval
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Stepper({
  step,
  setStep,
}: {
  step: number;
  setStep: (n: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {STEPS.map((s) => {
        const Icon = s.icon;
        const active = step === s.id;
        const done = step > s.id;
        return (
          <button
            key={s.id}
            onClick={() => setStep(s.id)}
            className={`group inline-flex items-center gap-2 rounded-full border px-3 py-1.5 transition ${
              active
                ? "border-orange-500/50 bg-orange-500/10 text-orange-200"
                : done
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                  : "border-dark-600 bg-dark-800/60 text-gray-500 hover:text-gray-300"
            }`}
          >
            <span
              className={`flex size-5 items-center justify-center rounded-full border ${
                active
                  ? "border-orange-400/60 bg-orange-500/20"
                  : done
                    ? "border-emerald-400/60 bg-emerald-500/20"
                    : "border-dark-500 bg-dark-900"
              }`}
            >
              {done ? (
                <CheckCircle2 className="size-3" />
              ) : (
                <Icon className="size-3" />
              )}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em]">
              {s.id}. {s.title}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function BoolBox({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
        checked
          ? "border-emerald-500/40 bg-emerald-500/10 text-white"
          : "border-dark-600 bg-dark-900/40 text-gray-300 hover:border-purple-500/30"
      }`}
    >
      <span className="text-sm">{label}</span>
      <span
        className={`flex size-5 items-center justify-center rounded-full border text-[10px] font-bold ${
          checked
            ? "border-emerald-400 bg-emerald-500/30 text-emerald-200"
            : "border-dark-500 text-gray-500"
        }`}
      >
        {checked ? "✓" : ""}
      </span>
    </button>
  );
}

function UnitsEditor({
  units,
  setUnits,
}: {
  units: Unit[];
  setUnits: (us: Unit[]) => void;
}) {
  return (
    <div className="rounded-2xl border border-dark-600 bg-dark-900/40 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-heading text-sm font-semibold text-white">
            Units (optional)
          </h4>
          <p className="text-[12px] text-gray-500">
            List each unit of the development (apt, lot, office…). Admin can
            mark as sold.
          </p>
        </div>
        <Button
          size="sm"
          variant="secondary"
          leftIcon={<Plus className="size-4" />}
          onClick={() =>
            setUnits([...units, { identifier: `Unit ${units.length + 1}` }])
          }
        >
          Add
        </Button>
      </div>
      {units.length > 0 && (
        <div className="mt-3 space-y-2">
          {units.map((u, i) => (
            <div
              key={i}
              className="grid items-end gap-2 rounded-xl border border-dark-600 bg-dark-800/40 p-3 sm:grid-cols-[1.5fr,1fr,1fr,auto]"
            >
              <Input
                label={i === 0 ? "Identifier" : undefined}
                value={u.identifier}
                onChange={(e) => {
                  const copy = [...units];
                  copy[i] = { ...u, identifier: e.target.value };
                  setUnits(copy);
                }}
              />
              <Input
                label={i === 0 ? "Area (m²)" : undefined}
                type="number"
                value={u.metragem_m2 ?? ""}
                onChange={(e) => {
                  const copy = [...units];
                  copy[i] = {
                    ...u,
                    metragem_m2: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  };
                  setUnits(copy);
                }}
              />
              <Input
                label={i === 0 ? "Price ($)" : undefined}
                type="number"
                value={u.preco_brl ?? ""}
                onChange={(e) => {
                  const copy = [...units];
                  copy[i] = {
                    ...u,
                    preco_brl: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  };
                  setUnits(copy);
                }}
              />
              <button
                type="button"
                onClick={() => setUnits(units.filter((_, idx) => idx !== i))}
                className="self-end rounded-md border border-dark-500 bg-dark-900/60 p-2 text-rose-300 transition hover:border-rose-500/40"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
