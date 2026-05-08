"use client";

import { createClient } from "@supabase/supabase-js";
import { apiPost, ApiError } from "./api";
import { config } from "./config";

const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);

export type AllowedBucket =
  | "development-images"
  | "development-documents"
  | "incorporator-documents"
  | "incorporator-logos";

interface UploadUrlResponse {
  bucket: AllowedBucket;
  path: string;
  token: string;
  signed_url: string;
  public_url?: string;
  content_type: string;
}

export interface UploadedFile {
  bucket: AllowedBucket;
  path: string;
  url: string;
  publicUrl?: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
}

/**
 * Asks the backend for a signed upload URL and uploads the file directly to
 * Supabase Storage (so we never buffer through Vercel functions).
 * Retries once on network-level failure (cold-start / transient error).
 */
export async function uploadFile(opts: {
  file: File;
  bucket: AllowedBucket;
  folder?: string;
  onProgress?: (pct: number) => void;
}): Promise<UploadedFile> {
  async function getUploadMeta() {
    try {
      return await apiPost<UploadUrlResponse>("/files/upload-url", {
        bucket: opts.bucket,
        filename: opts.file.name,
        contentType: opts.file.type || "application/octet-stream",
        folder: opts.folder,
      });
    } catch (err) {
      // On network error (cold start), wait 2s and retry once
      if (err instanceof ApiError && err.status === 0) {
        await new Promise((r) => setTimeout(r, 2000));
        return apiPost<UploadUrlResponse>("/files/upload-url", {
          bucket: opts.bucket,
          filename: opts.file.name,
          contentType: opts.file.type || "application/octet-stream",
          folder: opts.folder,
        });
      }
      throw err;
    }
  }

  const meta = await getUploadMeta();

  const { error } = await supabase.storage
    .from(meta.bucket)
    .uploadToSignedUrl(meta.path, meta.token, opts.file, {
      contentType: opts.file.type || "application/octet-stream",
      upsert: false,
    });
  if (error) throw new Error(error.message);

  opts.onProgress?.(100);

  let url: string;
  if (meta.public_url) {
    url = meta.public_url;
  } else {
    const dl = await apiPost<{ url: string }>("/files/download-url", {
      bucket: meta.bucket,
      path: meta.path,
      expiresIn: 60 * 60,
    });
    url = dl.url;
  }

  return {
    bucket: meta.bucket,
    path: meta.path,
    url,
    publicUrl: meta.public_url,
    filename: opts.file.name,
    mime_type: opts.file.type || "application/octet-stream",
    size_bytes: opts.file.size,
  };
}
