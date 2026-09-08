import { createHash, randomUUID } from 'node:crypto';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { UploadApiOptions, UploadApiResponse } from 'cloudinary';
import type { MediaUploadTicket } from './mediaUploadTicket';
import { readMediaSource } from './mediaSource';

export const MEDIA_FOLDERS = new Set(['aid-voice-refs', 'aid-audio', 'aid-images', 'aid-images/comfyui-z-image', 'aid-video', 'aid-videos', 'aid-videos/comfyui', 'aid-videos/fal-h3-max', 'aid-grid-sources', 'aid-grid-cells']);
const CACHE_CONTROL = 'public, max-age=31536000, immutable';
const TYPES: Record<string, string> = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/avif': 'avif', 'image/gif': 'gif', 'video/mp4': 'mp4', 'video/webm': 'webm', 'video/quicktime': 'mov', 'audio/mpeg': 'mp3', 'audio/wav': 'wav', 'audio/x-wav': 'wav', 'audio/ogg': 'ogg', 'audio/flac': 'flac', 'audio/mp4': 'm4a', 'audio/aac': 'aac' };

export function usesR2Storage(): boolean {
  return process.env.MEDIA_STORAGE_PROVIDER === 'r2' || (!process.env.MEDIA_STORAGE_PROVIDER && !!process.env.R2_BUCKET);
}
export function hasR2Credentials(): boolean {
  return !!(process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY && process.env.R2_BUCKET && process.env.R2_PUBLIC_BASE_URL);
}
function config() {
  if (!hasR2Credentials()) throw new Error('R2 媒体存储配置不完整');
  const account = process.env.R2_ACCOUNT_ID!.trim(), bucket = process.env.R2_BUCKET!.trim();
  const base = new URL(process.env.R2_PUBLIC_BASE_URL!.trim());
  if (!/^[a-f0-9]{32}$/.test(account) || !/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(bucket)
    || base.protocol !== 'https:' || base.username || base.password || base.port || base.search || base.hash)
    throw new Error('R2 账户、存储桶或公开地址无效');
  return { bucket, base: base.toString().replace(/\/$/, ''), client: new S3Client({
    region: 'auto', endpoint: `https://${account}.r2.cloudflarestorage.com`, forcePathStyle: true,
    credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID!.trim(), secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!.trim() },
    requestChecksumCalculation: 'WHEN_REQUIRED', responseChecksumValidation: 'WHEN_REQUIRED',
  }) };
}
export function validateMediaOptions(options: UploadApiOptions) {
  if (!MEDIA_FOLDERS.has(String(options.folder)) || !['image', 'video', 'raw'].includes(String(options.resource_type || 'image')))
    throw new Error('不支持的媒体保存目录或类型');
  if (options.public_id && (typeof options.public_id !== 'string' || !/^[a-zA-Z0-9_-]{1,160}$/.test(options.public_id))) throw new Error('无效的媒体编号');
}

export async function createR2UploadTicket(options: UploadApiOptions, contentType: string): Promise<MediaUploadTicket> {
  validateMediaOptions(options);
  if (!TYPES[contentType] || ((options.resource_type || 'image') === 'image' && !contentType.startsWith('image/')))
    throw new Error('R2 仅支持图片、视频和音频上传');
  const { client, bucket, base } = config();
  // Random immutable keys: a short-lived public upload ticket can never
  // overwrite another user's asset, including caller-supplied public IDs.
  const key = `${options.folder}/${options.public_id ? `${options.public_id}-` : ''}${randomUUID()}.${TYPES[contentType]}`;
  const headers = { 'Content-Type': contentType, 'Cache-Control': CACHE_CONTROL, 'If-None-Match': '*' };
  const url = await getSignedUrl(client, new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType, CacheControl: CACHE_CONTROL, IfNoneMatch: '*' }), {
    expiresIn: 900, signableHeaders: new Set(['content-type', 'cache-control', 'if-none-match']),
  });
  return { provider: 'r2', method: 'PUT', url, headers, secure_url: `${base}/${key}`, public_id: key };
}

export async function describeMedia(buffer: Buffer, options: UploadApiOptions) {
  const { fileTypeFromBuffer } = await import('file-type');
  const type = await fileTypeFromBuffer(buffer);
  if (!type || !TYPES[type.mime]) throw new Error('无法识别媒体格式，仅支持图片、视频和音频');
  if ((options.resource_type || 'image') === 'image' && !type.mime.startsWith('image/')) throw new Error('上传内容不是图片');
  let width = 0, height = 0;
  if (type.mime.startsWith('image/')) {
    const { default: sharp } = await import('sharp');
    const meta = await sharp(buffer, { limitInputPixels: 80_000_000 }).metadata();
    width = meta.width || 0; height = meta.height || 0;
  }
  return { contentType: type.mime, format: TYPES[type.mime], width, height };
}

export async function uploadToR2(source: string | Buffer, options: UploadApiOptions): Promise<UploadApiResponse> {
  validateMediaOptions(options);
  const { client, bucket, base } = config();
  const buffer = await readMediaSource(source, (options.resource_type || 'image') === 'image' ? 50 * 1024 * 1024 : 512 * 1024 * 1024);
  const meta = await describeMedia(buffer, options);
  // Content addressing makes retries idempotent and avoids repeated copies.
  const digest = createHash('sha256').update(buffer).digest('hex');
  const key = `${options.folder}/${options.public_id ? `${options.public_id}-` : ''}${digest}.${meta.format}`;
  await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: buffer, ContentType: meta.contentType, CacheControl: CACHE_CONTROL }));
  return { secure_url: `${base}/${key}`, url: `${base}/${key}`, public_id: key, bytes: buffer.length, format: meta.format, width: meta.width, height: meta.height, resource_type: options.resource_type || 'image' } as UploadApiResponse;
}
