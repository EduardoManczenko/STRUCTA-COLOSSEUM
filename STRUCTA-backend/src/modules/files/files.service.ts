import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { SupabaseService } from '../../common/supabase/supabase.service';

const ALLOWED_BUCKETS = [
  'development-images',
  'development-documents',
  'incorporator-documents',
  'incorporator-logos',
] as const;

type AllowedBucket = (typeof ALLOWED_BUCKETS)[number];

const PUBLIC_BUCKETS = new Set<AllowedBucket>([
  'development-images',
  'incorporator-logos',
]);

function safeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .slice(0, 80);
}

@Injectable()
export class FilesService {
  constructor(private readonly supabase: SupabaseService) {}

  /**
   * Returns a signed upload URL so the client can PUT the file directly to
   * Supabase Storage. This avoids buffering files through Vercel's serverless
   * function (which has tight body-size limits).
   */
  async getUploadUrl(opts: {
    bucket: string;
    folder?: string;
    filename: string;
    contentType: string;
  }) {
    if (!ALLOWED_BUCKETS.includes(opts.bucket as AllowedBucket)) {
      throw new BadRequestException(`Bucket inválido: ${opts.bucket}`);
    }
    const bucket = opts.bucket as AllowedBucket;
    const safe = safeFilename(opts.filename);
    const folder = opts.folder ? `${safeFilename(opts.folder)}/` : '';
    const path = `${folder}${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}-${safe}`;

    const { data, error } = await this.supabase.admin.storage
      .from(bucket)
      .createSignedUploadUrl(path);
    if (error) throw new BadRequestException(error.message);

    let publicUrl: string | undefined;
    if (PUBLIC_BUCKETS.has(bucket)) {
      const { data: pub } = this.supabase.admin.storage
        .from(bucket)
        .getPublicUrl(path);
      publicUrl = pub.publicUrl;
    }

    return {
      bucket,
      path,
      token: data.token,
      signed_url: data.signedUrl,
      public_url: publicUrl,
      content_type: opts.contentType,
    };
  }

  async getDownloadUrl(opts: {
    bucket: string;
    path: string;
    expiresIn?: number;
  }) {
    if (!ALLOWED_BUCKETS.includes(opts.bucket as AllowedBucket)) {
      throw new BadRequestException(`Bucket inválido: ${opts.bucket}`);
    }
    const bucket = opts.bucket as AllowedBucket;
    if (PUBLIC_BUCKETS.has(bucket)) {
      const { data } = this.supabase.admin.storage
        .from(bucket)
        .getPublicUrl(opts.path);
      return { url: data.publicUrl };
    }
    const { data, error } = await this.supabase.admin.storage
      .from(bucket)
      .createSignedUrl(opts.path, opts.expiresIn ?? 60 * 5);
    if (error) throw new BadRequestException(error.message);
    return { url: data.signedUrl };
  }
}
