"use client";

import { useRef, useState } from "react";
import {
  CheckCircle2,
  FileText,
  ImagePlus,
  Loader2,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { uploadFile, type AllowedBucket, type UploadedFile } from "@/lib/upload";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/cn";

interface BaseProps {
  bucket: AllowedBucket;
  folder?: string;
  accept?: string;
  multiple?: boolean;
}

interface ImageUploaderProps extends BaseProps {
  value: UploadedFile[];
  onChange: (files: UploadedFile[]) => void;
  max?: number;
  label?: string;
  hint?: string;
}

export function ImageUploader({
  bucket,
  folder,
  value,
  onChange,
  max = 8,
  accept = "image/*",
  multiple = true,
  label = "Imagens",
  hint = "Drag or click to upload (PNG/JPG/WebP up to 10MB)",
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handle(files: FileList | null) {
    if (!files || files.length === 0) return;
    if (value.length + files.length > max) {
      toast.error(`Maximum of ${max} images.`);
      return;
    }
    setUploading(true);
    try {
      const uploaded: UploadedFile[] = [];
      for (const file of Array.from(files)) {
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name} excede 10MB`);
          continue;
        }
        const u = await uploadFile({ file, bucket, folder });
        uploaded.push(u);
      }
      onChange([...value, ...uploaded]);
      if (uploaded.length) toast.success(`${uploaded.length} imagem(ns) enviada(s)`);
    } catch (err) {
      const msg =
        err instanceof ApiError && err.status === 0
          ? "Connection error — please check your internet and try again."
          : err instanceof Error
            ? err.message
            : "Upload failed";
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="grid gap-3">
      {label && (
        <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-gray-400">
          {label}
        </label>
      )}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          void handle(e.dataTransfer.files);
        }}
        className={cn(
          "group cursor-pointer rounded-2xl border-2 border-dashed border-dark-500 bg-dark-900/40 p-6 text-center transition hover:border-purple-500/50 hover:bg-purple-500/5",
          uploading && "pointer-events-none opacity-60",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => void handle(e.target.files)}
          className="hidden"
        />
        <div className="flex flex-col items-center justify-center gap-2 text-gray-400">
          {uploading ? (
            <Loader2 className="size-6 animate-spin text-purple-400" />
          ) : (
            <ImagePlus className="size-6 text-purple-400" />
          )}
          <p className="text-sm">
            {uploading ? "Enviando…" : hint}
          </p>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-gray-500">
            {value.length}/{max}
          </span>
        </div>
      </div>

      {value.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {value.map((f, i) => (
            <motion.div
              key={f.path}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="group relative aspect-square overflow-hidden rounded-xl border border-dark-600 bg-dark-900"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={f.url}
                alt={f.filename}
                className="size-full object-cover"
              />
              <button
                type="button"
                onClick={() => onChange(value.filter((_, idx) => idx !== i))}
                className="absolute right-1 top-1 rounded-md border border-dark-500 bg-dark-900/85 p-1 text-rose-300 opacity-0 backdrop-blur transition group-hover:opacity-100"
              >
                <X className="size-3" />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

interface DocumentUploadInput {
  type: string;
  label?: string;
}

export interface DocumentEntry extends UploadedFile {
  type: string;
  label?: string;
}

interface DocumentUploaderProps extends BaseProps {
  documentTypes: DocumentUploadInput[];
  value: DocumentEntry[];
  onChange: (docs: DocumentEntry[]) => void;
}

export function DocumentUploader({
  bucket,
  folder,
  documentTypes,
  value,
  onChange,
  accept = ".pdf,application/pdf,image/*",
}: DocumentUploaderProps) {
  const [uploadingType, setUploadingType] = useState<string | null>(null);

  async function handle(type: string, label: string | undefined, files: FileList | null) {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (file.size > 25 * 1024 * 1024) {
      toast.error("Arquivo excede 25MB");
      return;
    }
    setUploadingType(type);
    try {
      const uploaded = await uploadFile({ file, bucket, folder });
      const entry: DocumentEntry = { ...uploaded, type, label };
      onChange([...value.filter((d) => d.type !== type), entry]);
      toast.success(`${label ?? type} enviado`);
    } catch (err) {
      const msg =
        err instanceof ApiError && err.status === 0
          ? "Connection error — please check your internet and try again."
          : err instanceof Error
            ? err.message
            : "Upload failed";
      toast.error(msg);
    } finally {
      setUploadingType(null);
    }
  }

  return (
    <div className="grid gap-3">
      {documentTypes.map((doc) => {
        const existing = value.find((d) => d.type === doc.type);
        const isUploading = uploadingType === doc.type;
        return (
          <div
            key={doc.type}
            className={cn(
              "flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dark-600 bg-dark-900/40 p-3 transition",
              existing && "border-emerald-500/30 bg-emerald-500/5",
            )}
          >
            <div className="flex min-w-0 items-center gap-3">
              <div
                className={cn(
                  "flex size-9 items-center justify-center rounded-lg border",
                  existing
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                    : "border-purple-500/30 bg-purple-500/10 text-purple-300",
                )}
              >
                {existing ? (
                  <CheckCircle2 className="size-4" />
                ) : (
                  <FileText className="size-4" />
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm text-white">
                  {doc.label ?? doc.type}
                </p>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-gray-500">
                  {existing
                    ? `${existing.filename} · ${(existing.size_bytes / 1024).toFixed(0)} KB`
                    : "Aguardando upload"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {existing && (
                <button
                  type="button"
                  onClick={() =>
                    onChange(value.filter((d) => d.type !== doc.type))
                  }
                  className="rounded-md border border-dark-500 bg-dark-900/60 p-1.5 text-rose-300 transition hover:border-rose-500/40"
                >
                  <Trash2 className="size-3.5" />
                </button>
              )}
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept={accept}
                  className="hidden"
                  onChange={(e) =>
                    void handle(doc.type, doc.label, e.target.files)
                  }
                />
                <span className="inline-flex items-center gap-1.5 rounded-md border border-purple-500/40 bg-purple-500/10 px-2.5 py-1 text-[12px] font-semibold text-purple-200 transition hover:bg-purple-500/15">
                  {isUploading ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <Upload className="size-3" />
                  )}
                  {existing ? "Substituir" : "Enviar"}
                </span>
              </label>
            </div>
          </div>
        );
      })}
    </div>
  );
}
