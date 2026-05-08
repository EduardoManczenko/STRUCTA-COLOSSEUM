"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Award,
  Building2,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea, Checkbox } from "@/components/ui/Input";
import { ImageUploader } from "@/components/forms/FileUpload";
import { apiPost, apiGet, ApiError } from "@/lib/api";
import type { UploadedFile } from "@/lib/upload";

const UF_OPTIONS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
].map((uf) => ({ value: uf, label: uf }));

interface FormState {
  // 0 — account credentials
  login_email: string;
  password: string;
  confirm_password: string;
  // 1
  razao_social: string;
  nome_fantasia: string;
  cnpj: string;
  endereco_sede: string;
  municipio: string;
  uf: string;
  site: string;
  social_media: string;
  telefone: string;
  // 2
  responsavel_nome: string;
  responsavel_cargo: string;
  responsavel_cpf: string;
  responsavel_email: string;
  responsavel_whatsapp: string;
  // 3
  ano_fundacao: string;
  empreendimentos_entregues: string;
  vgv_total_entregue_brl: string;
  estados_atuacao: string;
  empreendimentos_em_andamento: string;
  // 4
  iso_9001_certificada: boolean;
  iso_9001_numero: string;
  iso_9001_validade: string;
  iso_9001_organismo: string;
  pbqp_h_nivel: "" | "A" | "B";
  pbqp_h_numero: string;
  pbqp_h_validade: string;
  pbqp_h_organismo: string;
  // 5
  representante_nome: string;
  representante_cpf: string;
  representante_cargo: string;
  declaracao_veracidade: boolean;
  declaracao_certificacoes: boolean;
  declaracao_documentos: boolean;
  declaracao_diligencia: boolean;
}

const STEPS = [
  { id: 1, title: "Account", icon: ShieldCheck },
  { id: 2, title: "Company", icon: Building2 },
  { id: 3, title: "Contact", icon: UserCheck },
  { id: 4, title: "Track record", icon: Building2 },
  { id: 5, title: "Certifications", icon: Award },
  { id: 6, title: "Declarations", icon: ShieldCheck },
];

const initial: FormState = {
  login_email: "",
  password: "",
  confirm_password: "",
  razao_social: "",
  nome_fantasia: "",
  cnpj: "",
  endereco_sede: "",
  municipio: "",
  uf: "SP",
  site: "",
  social_media: "",
  telefone: "",
  responsavel_nome: "",
  responsavel_cargo: "",
  responsavel_cpf: "",
  responsavel_email: "",
  responsavel_whatsapp: "",
  ano_fundacao: "",
  empreendimentos_entregues: "",
  vgv_total_entregue_brl: "",
  estados_atuacao: "",
  empreendimentos_em_andamento: "",
  iso_9001_certificada: false,
  iso_9001_numero: "",
  iso_9001_validade: "",
  iso_9001_organismo: "",
  pbqp_h_nivel: "",
  pbqp_h_numero: "",
  pbqp_h_validade: "",
  pbqp_h_organismo: "",
  representante_nome: "",
  representante_cpf: "",
  representante_cargo: "",
  declaracao_veracidade: false,
  declaracao_certificacoes: false,
  declaracao_documentos: false,
  declaracao_diligencia: false,
};

export default function IncorporadoraSignup() {
  const [form, setForm] = useState<FormState>(initial);
  const [logo, setLogo] = useState<UploadedFile[]>([]);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ id: string } | null>(null);
  const warmedRef = useRef(false);

  // Warm up the serverless backend as soon as the page loads to avoid
  // cold-start failures on logo upload or form submission.
  useEffect(() => {
    if (warmedRef.current) return;
    warmedRef.current = true;
    apiGet("/health").catch(() => {/* best-effort */});
  }, []);

  const update =
    <K extends keyof FormState>(k: K) =>
    (v: FormState[K]) =>
      setForm((s) => ({ ...s, [k]: v }));

  function validateStep(): string | null {
    if (step === 1) {
      if (!form.login_email.trim()) return "Enter your login email";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.login_email.trim()))
        return "Enter a valid email address";
      if (!form.password) return "Enter a password";
      if (form.password.length < 8) return "Password must be at least 8 characters";
      if (form.password !== form.confirm_password)
        return "Passwords do not match";
    }
    if (step === 2) {
      const required: Array<keyof FormState> = [
        "razao_social",
        "cnpj",
        "endereco_sede",
        "municipio",
        "uf",
        "telefone",
      ];
      for (const k of required) if (!String(form[k]).trim()) return `Fill in: ${k.replace(/_/g, " ")}`;
    }
    if (step === 3) {
      const required: Array<keyof FormState> = [
        "responsavel_nome",
        "responsavel_cargo",
        "responsavel_cpf",
        "responsavel_email",
        "responsavel_whatsapp",
      ];
      for (const k of required) if (!String(form[k]).trim()) return `Fill in: ${k.replace(/_/g, " ")}`;
    }
    if (step === 4) {
      if (!form.ano_fundacao) return "Enter the founding year";
      if (!form.empreendimentos_entregues) return "Enter completed projects count";
      if (!form.vgv_total_entregue_brl) return "Enter total delivered VGV";
      if (!form.estados_atuacao.trim()) return "Enter states of operation (comma separated)";
    }
    if (step === 5) {
      if (!form.iso_9001_certificada && !form.pbqp_h_nivel)
        return "ISO 9001 OR PBQP-H (level A or B) certification is required.";
      if (form.iso_9001_certificada) {
        if (!form.iso_9001_numero) return "Enter ISO 9001 certificate number";
        if (!form.iso_9001_validade) return "Enter ISO 9001 expiry date";
        if (!form.iso_9001_organismo) return "Enter certifying body";
      }
      if (form.pbqp_h_nivel) {
        if (!form.pbqp_h_numero) return "Enter PBQP-H certificate number";
        if (!form.pbqp_h_validade) return "Enter PBQP-H expiry date";
      }
    }
    if (step === 6) {
      if (!form.representante_nome) return "Enter the legal representative's name";
      if (!form.representante_cpf) return "Enter the legal representative's CPF";
      if (!form.representante_cargo) return "Enter the representative's title";
      if (
        !form.declaracao_veracidade ||
        !form.declaracao_certificacoes ||
        !form.declaracao_documentos ||
        !form.declaracao_diligencia
      )
        return "Check all declarations to proceed.";
    }
    return null;
  }

  function next() {
    const err = validateStep();
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
    const err = validateStep();
    if (err) {
      toast.error(err);
      return;
    }
    setSubmitting(true);

    async function doSubmit(p: Record<string, unknown>) {
      try {
        return await apiPost<{ id: string }>("/incorporators/submissions", p);
      } catch (err) {
        if (err instanceof ApiError && err.status === 0) {
          // Cold-start: warm up and retry once
          toast.info("Connecting to server, retrying…");
          await apiGet("/health");
          return await apiPost<{ id: string }>("/incorporators/submissions", p);
        }
        throw err;
      }
    }

    try {
      const payload = {
        login_email: form.login_email.trim().toLowerCase(),
        password: form.password,
        razao_social: form.razao_social,
        nome_fantasia: form.nome_fantasia || undefined,
        cnpj: form.cnpj,
        endereco_sede: form.endereco_sede,
        municipio: form.municipio,
        uf: form.uf,
        site: form.site || undefined,
        social_media: form.social_media || undefined,
        telefone: form.telefone,
        responsavel_nome: form.responsavel_nome,
        responsavel_cargo: form.responsavel_cargo,
        responsavel_cpf: form.responsavel_cpf,
        responsavel_email: form.responsavel_email,
        responsavel_whatsapp: form.responsavel_whatsapp,
        ano_fundacao: Number(form.ano_fundacao),
        empreendimentos_entregues: Number(form.empreendimentos_entregues),
        vgv_total_entregue_brl: Number(form.vgv_total_entregue_brl),
        estados_atuacao: form.estados_atuacao
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        empreendimentos_em_andamento: form.empreendimentos_em_andamento
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean)
          .map((line) => {
            const [nome, cidade] = line.split(/\s*[-—|]\s*/);
            return { nome: nome ?? line, cidade: cidade ?? "" };
          }),
        iso_9001_certificada: form.iso_9001_certificada,
        iso_9001_numero: form.iso_9001_numero || undefined,
        iso_9001_validade: form.iso_9001_validade || undefined,
        iso_9001_organismo: form.iso_9001_organismo || undefined,
        pbqp_h_nivel: form.pbqp_h_nivel || undefined,
        pbqp_h_numero: form.pbqp_h_numero || undefined,
        pbqp_h_validade: form.pbqp_h_validade || undefined,
        pbqp_h_organismo: form.pbqp_h_organismo || undefined,
        representante_nome: form.representante_nome,
        representante_cpf: form.representante_cpf,
        representante_cargo: form.representante_cargo,
        declaracao_veracidade: form.declaracao_veracidade,
        declaracao_certificacoes: form.declaracao_certificacoes,
        declaracao_documentos: form.declaracao_documentos,
        declaracao_diligencia: form.declaracao_diligencia,
        logo_url: logo[0]?.url ?? undefined,
      };
      const res = await doSubmit(payload as Record<string, unknown>);
      setDone({ id: res.id });
      toast.success("Registration submitted for review!");
    } catch (e) {
      const msg =
        e instanceof ApiError && e.status === 0
          ? "Connection error — please check your internet and try again."
          : e instanceof ApiError && e.status >= 500
            ? "Something went wrong on our end. Please try again in a moment."
            : e instanceof ApiError
              ? e.message
              : "Failed to submit. Please try again.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <main className="relative min-h-screen bg-dark-900">
        <Navbar />
        <section className="mx-auto flex min-h-[80vh] max-w-3xl items-center px-6 pt-32 md:px-12">
          <Card className="w-full p-8 text-center sm:p-12">
            <div className="mx-auto flex size-16 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
              <CheckCircle2 className="size-8" />
            </div>
            <h1 className="mt-6 font-heading text-3xl font-bold tracking-tight text-white">
              Submission received
            </h1>
            <p className="mt-3 text-gray-400">
              Your developer company has entered the Structa review queue. Within{" "}
              <span className="text-orange-300">5 business days</span> the team
              will get back to you with a decision and, if approved, the link to
              register projects.
            </p>
            <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-3">
              <Link href="/empreendimentos">
                <Button variant="secondary">View projects</Button>
              </Link>
              <Link href="/">
                <Button>Go to homepage</Button>
              </Link>
            </div>
            <p className="mt-8 text-xs text-gray-500">
              Protocol ID:{" "}
              <code className="rounded bg-dark-900 px-2 py-1 font-mono text-purple-300">
                {done.id}
              </code>
            </p>
          </Card>
        </section>
        <Footer />
      </main>
    );
  }

  return (
    <main className="relative min-h-screen bg-dark-900">
      <Navbar />

      <section className="relative pb-24 pt-28 md:pt-36">
        <div className="pointer-events-none absolute right-0 -top-20 size-[400px] glow-purple opacity-30 md:size-[600px]" />
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" />

        <div className="relative z-10 mx-auto max-w-4xl px-5 sm:px-8 md:px-12">
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-gray-400 transition hover:text-orange-400"
          >
            <ArrowLeft className="size-3.5" />
            Back
          </Link>

          <h1 className="mt-5 break-words font-heading text-[32px] font-bold leading-[1.05] tracking-[-0.03em] text-white sm:text-[40px] md:text-[56px]">
            Register <span className="gradient-text">as a developer</span>
          </h1>
          <p className="mt-3 max-w-2xl text-base text-gray-400">
            First step to list projects on the Structa protocol. Only companies
            with valid <span className="text-purple-300">ISO 9001</span> or{" "}
            <span className="text-purple-300">PBQP-H</span> certification are
            accepted.
          </p>

          <Stepper step={step} setStep={setStep} />

          <Card className="mt-8 overflow-hidden">
            <CardHeader>
              <CardTitle>{STEPS[step - 1].title}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="grid gap-5"
              >
                {step === 1 && (
                  <>
                    <div className="rounded-xl border border-purple-500/30 bg-purple-500/5 p-4 text-[13px] text-purple-200">
                      Create your login credentials. After admin approval, you will use this email and password to access your developer dashboard.
                    </div>
                    <Input
                      label="Login email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="you@company.com"
                      value={form.login_email}
                      onChange={(e) => update("login_email")(e.target.value)}
                    />
                    <div className="grid gap-5 sm:grid-cols-2">
                      <Input
                        label="Password"
                        type="password"
                        required
                        autoComplete="new-password"
                        placeholder="Minimum 8 characters"
                        value={form.password}
                        onChange={(e) => update("password")(e.target.value)}
                      />
                      <Input
                        label="Confirm password"
                        type="password"
                        required
                        autoComplete="new-password"
                        placeholder="Repeat password"
                        value={form.confirm_password}
                        onChange={(e) => update("confirm_password")(e.target.value)}
                      />
                    </div>
                  </>
                )}

                {step === 2 && (
                  <>
                    <ImageUploader
                      bucket="incorporator-logos"
                      folder={form.razao_social || "logo"}
                      value={logo}
                      onChange={setLogo}
                      max={1}
                      label="Logo (optional)"
                      hint="Square PNG or SVG with transparent background, 512x512 recommended"
                    />
                    <Input
                      label="Legal name"
                      required
                      value={form.razao_social}
                      onChange={(e) => update("razao_social")(e.target.value)}
                    />
                    <div className="grid gap-5 sm:grid-cols-2">
                      <Input
                        label="Trade name"
                        value={form.nome_fantasia}
                        onChange={(e) =>
                          update("nome_fantasia")(e.target.value)
                        }
                      />
                      <Input
                        label="CNPJ"
                        required
                        placeholder="00.000.000/0000-00"
                        value={form.cnpj}
                        onChange={(e) => update("cnpj")(e.target.value)}
                      />
                    </div>
                    <Input
                      label="Headquarters address"
                      required
                      value={form.endereco_sede}
                      onChange={(e) => update("endereco_sede")(e.target.value)}
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
                    <div className="grid gap-5 sm:grid-cols-2">
                      <Input
                        label="Site"
                        type="url"
                        value={form.site}
                        onChange={(e) => update("site")(e.target.value)}
                      />
                      <Input
                        label="Social media"
                        value={form.social_media}
                        onChange={(e) =>
                          update("social_media")(e.target.value)
                        }
                      />
                    </div>
                    <Input
                      label="Phone"
                      required
                      value={form.telefone}
                      onChange={(e) => update("telefone")(e.target.value)}
                    />
                  </>
                )}

                {step === 3 && (
                  <>
                    <div className="grid gap-5 sm:grid-cols-2">
                      <Input
                        label="Full name"
                        required
                        value={form.responsavel_nome}
                        onChange={(e) =>
                          update("responsavel_nome")(e.target.value)
                        }
                      />
                      <Input
                        label="Title"
                        required
                        value={form.responsavel_cargo}
                        onChange={(e) =>
                          update("responsavel_cargo")(e.target.value)
                        }
                      />
                    </div>
                    <div className="grid gap-5 sm:grid-cols-2">
                      <Input
                        label="CPF"
                        required
                        placeholder="000.000.000-00"
                        value={form.responsavel_cpf}
                        onChange={(e) =>
                          update("responsavel_cpf")(e.target.value)
                        }
                      />
                      <Input
                        label="WhatsApp"
                        required
                        value={form.responsavel_whatsapp}
                        onChange={(e) =>
                          update("responsavel_whatsapp")(e.target.value)
                        }
                      />
                    </div>
                    <Input
                      label="Direct email"
                      type="email"
                      required
                      value={form.responsavel_email}
                      onChange={(e) =>
                        update("responsavel_email")(e.target.value)
                      }
                    />
                  </>
                )}

                {step === 4 && (
                  <>
                    <div className="grid gap-5 sm:grid-cols-3">
                      <Input
                        label="Founding year"
                        type="number"
                        required
                        value={form.ano_fundacao}
                        onChange={(e) =>
                          update("ano_fundacao")(e.target.value)
                        }
                      />
                      <Input
                        label="Completed projects"
                        type="number"
                        required
                        value={form.empreendimentos_entregues}
                        onChange={(e) =>
                          update("empreendimentos_entregues")(e.target.value)
                        }
                      />
                      <Input
                        label="Total delivered VGV ($)"
                        type="number"
                        required
                        value={form.vgv_total_entregue_brl}
                        onChange={(e) =>
                          update("vgv_total_entregue_brl")(e.target.value)
                        }
                      />
                    </div>
                    <Input
                      label="Operating states (comma-separated)"
                      placeholder="SP, RJ, MG"
                      required
                      value={form.estados_atuacao}
                      onChange={(e) =>
                        update("estados_atuacao")(e.target.value)
                      }
                    />
                    <Textarea
                      label="Ongoing projects"
                      hint="One per line. Use the format: Name — City"
                      rows={4}
                      value={form.empreendimentos_em_andamento}
                      onChange={(e) =>
                        update("empreendimentos_em_andamento")(e.target.value)
                      }
                    />
                  </>
                )}

                {step === 5 && (
                  <>
                    <div className="rounded-xl border border-orange-500/30 bg-orange-500/5 p-4 text-[12px] text-orange-200">
                      <strong>Prerequisite (mandatory):</strong> the construction
                      company must hold at least one of the certifications below,
                      with active validity.
                    </div>

                    <Checkbox
                      checked={form.iso_9001_certificada}
                      onChange={(e) =>
                        update("iso_9001_certificada")(e.target.checked)
                      }
                      label="ISO 9001 — certified and valid"
                      description="Quality management system. Internationally accepted."
                    />
                    {form.iso_9001_certificada && (
                      <div className="grid gap-5 sm:grid-cols-3">
                        <Input
                          label="Certificate no."
                          required
                          value={form.iso_9001_numero}
                          onChange={(e) =>
                            update("iso_9001_numero")(e.target.value)
                          }
                        />
                        <Input
                          label="Expiry date"
                          type="date"
                          required
                          value={form.iso_9001_validade}
                          onChange={(e) =>
                            update("iso_9001_validade")(e.target.value)
                          }
                        />
                        <Input
                          label="Certifying body"
                          required
                          value={form.iso_9001_organismo}
                          onChange={(e) =>
                            update("iso_9001_organismo")(e.target.value)
                          }
                        />
                      </div>
                    )}

                    <Select
                      label="PBQP-H Level"
                      options={[
                        { value: "", label: "Not certified" },
                        { value: "A", label: "Level A — full conformity" },
                        { value: "B", label: "Level B — substantial conformity" },
                      ]}
                      value={form.pbqp_h_nivel}
                      onChange={(e) =>
                        update("pbqp_h_nivel")(
                          e.target.value as "" | "A" | "B",
                        )
                      }
                    />
                    {form.pbqp_h_nivel && (
                      <div className="grid gap-5 sm:grid-cols-3">
                        <Input
                          label="Certificate no."
                          required
                          value={form.pbqp_h_numero}
                          onChange={(e) =>
                            update("pbqp_h_numero")(e.target.value)
                          }
                        />
                        <Input
                          label="Expiry date"
                          type="date"
                          required
                          value={form.pbqp_h_validade}
                          onChange={(e) =>
                            update("pbqp_h_validade")(e.target.value)
                          }
                        />
                        <Input
                          label="Assessment body"
                          value={form.pbqp_h_organismo}
                          onChange={(e) =>
                            update("pbqp_h_organismo")(e.target.value)
                          }
                        />
                      </div>
                    )}
                  </>
                )}

                {step === 6 && (
                  <>
                    <div className="grid gap-5 sm:grid-cols-3">
                      <Input
                        label="Legal representative's name"
                        required
                        value={form.representante_nome}
                        onChange={(e) =>
                          update("representante_nome")(e.target.value)
                        }
                        className="sm:col-span-2"
                      />
                      <Input
                        label="CPF"
                        required
                        value={form.representante_cpf}
                        onChange={(e) =>
                          update("representante_cpf")(e.target.value)
                        }
                      />
                    </div>
                    <Input
                      label="Title"
                      required
                      value={form.representante_cargo}
                      onChange={(e) =>
                        update("representante_cargo")(e.target.value)
                      }
                    />
                    <div className="space-y-3">
                      <Checkbox
                        checked={form.declaracao_veracidade}
                        onChange={(e) =>
                          update("declaracao_veracidade")(e.target.checked)
                        }
                        label="I confirm that all information provided is true and verifiable."
                      />
                      <Checkbox
                        checked={form.declaracao_certificacoes}
                        onChange={(e) =>
                          update("declaracao_certificacoes")(e.target.checked)
                        }
                        label="I confirm that the construction company holds the declared certifications with active validity."
                      />
                      <Checkbox
                        checked={form.declaracao_documentos}
                        onChange={(e) =>
                          update("declaracao_documentos")(e.target.checked)
                        }
                        label="I acknowledge that Structa may request additional documents."
                      />
                      <Checkbox
                        checked={form.declaracao_diligencia}
                        onChange={(e) =>
                          update("declaracao_diligencia")(e.target.checked)
                        }
                        label="I authorize Structa to conduct due diligence on the information provided."
                      />
                    </div>
                  </>
                )}
              </motion.div>

              <div className="mt-3 flex flex-wrap-reverse items-center justify-between gap-3 border-t border-dark-700 pt-5">
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
                    Submit
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
      <Footer />
    </main>
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
    <div className="mt-8 w-full">
      {/* Mobile: compact progress bar + step label */}
      <div className="sm:hidden">
        <div className="mb-2 flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-gray-400">
            Step {step} of {STEPS.length}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-orange-400">
            {STEPS.find((s) => s.id === step)?.title}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-dark-700">
          <div
            className="h-full rounded-full bg-gradient-to-r from-orange-500 to-orange-400 transition-all duration-300"
            style={{ width: `${(step / STEPS.length) * 100}%` }}
          />
        </div>
        <div className="mt-2 flex gap-1">
          {STEPS.map((s) => (
            <button
              key={s.id}
              onClick={() => setStep(s.id)}
              className={`h-1 flex-1 rounded-full transition ${
                s.id <= step ? "bg-orange-500/60" : "bg-dark-600"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Desktop: full step pills */}
      <div className="hidden flex-wrap items-center gap-2 sm:flex">
        {STEPS.map((s) => {
          const active = step === s.id;
          const done = step > s.id;
          const Icon = s.icon;
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
                {done ? <CheckCircle2 className="size-3" /> : <Icon className="size-3" />}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.18em]">
                {s.id}. {s.title}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
