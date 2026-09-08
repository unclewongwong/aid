import {
  v2 as cloudinary,
  type UploadApiErrorResponse,
  type UploadApiOptions,
  type UploadApiResponse,
} from 'cloudinary';
import { randomUUID } from 'node:crypto';
import { usesR2Storage, hasR2Credentials, createR2UploadTicket, uploadToR2, describeMedia } from './r2Upload';
import { validMediaUploadTicket, type MediaUploadTicket } from './mediaUploadTicket';
import { readMediaSource } from './mediaSource';

// Desktop installs never contain the hosted account secret. Obtain a scoped,
// short-lived signature and send media directly to R2 or Cloudinary (no serverless
// body-size limit, and no Fish/LLM credentials sent to the website).
const SIGNING_URL = 'https://pandais.beauty/api/media-upload/sign';
const MEDIA_FOLDERS = new Set(['aid-voice-refs', 'aid-audio', 'aid-images', 'aid-images/comfyui-z-image', 'aid-video', 'aid-videos', 'aid-videos/comfyui', 'aid-videos/fal-h3-max', 'aid-grid-sources', 'aid-grid-cells']);
type UploadTicket = MediaUploadTicket;

export async function createStorageUploadTickets(options: UploadApiOptions, contentType?: string): Promise<UploadTicket[]> {
  if (usesR2Storage()) return [await createR2UploadTicket(options, contentType || ((options.resource_type || 'image') === 'image' ? 'image/png' : 'audio/mpeg'))];
  return createMediaUploadTickets(options);
}

export function createMediaUploadTickets(options: UploadApiOptions): UploadTicket[] {
  if (!MEDIA_FOLDERS.has(String(options.folder)) || !['image', 'video'].includes(String(options.resource_type || 'image')))
    throw new Error('不支持的媒体保存目录或类型');
  const publicId = options.public_id || randomUUID();
  if (typeof publicId !== 'string' || !/^[a-zA-Z0-9_-]{1,160}$/.test(publicId)) throw new Error('无效的媒体编号');
  const primary = primaryCredentials(), backup = backupCredentials();
  const accounts = [primary, backup].filter((account, index) => account && !(index && primary && sameAccount(primary, account))) as CloudinaryCredentials[];
  if (!accounts.length) throw new Error('网站媒体存储尚未配置，请联系管理员；尚未提交生成');
  const params = { timestamp: String(Math.floor(Date.now() / 1000)), folder: String(options.folder), public_id: publicId, overwrite: 'false' };
  return accounts.map(account => ({
    url: `https://api.cloudinary.com/v1_1/${account.cloud_name}/${options.resource_type || 'image'}/upload`,
    fields: { ...params, api_key: account.api_key, signature: cloudinary.utils.api_sign_request(params, account.api_secret) },
  }));
}

export function usesHostedSigning(): boolean {
  return process.env.AID_LOCAL_COMPANION === '1' && !hasR2Credentials() && !primaryCredentials() && !backupCredentials();
}

async function requestUploadTickets(options: UploadApiOptions, contentType?: string): Promise<UploadTicket[]> {
  const response = await fetch(SIGNING_URL, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ folder: options.folder, resource_type: options.resource_type || 'image', public_id: options.public_id, content_type: contentType, protocol: 2 }),
    signal: AbortSignal.timeout(20000), redirect: 'error',
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !Array.isArray(data.targets) || !data.targets.length)
    throw new Error(data.error || '网站媒体保存通道不可用，请检查网络或更新网站服务');
  for (const ticket of data.targets) {
    if (!validMediaUploadTicket(ticket))
      throw new Error('媒体上传签名无效');
  }
  return data.targets;
}

export async function ensureCloudinaryUploadReady(): Promise<void> {
  if (usesHostedSigning()) await requestUploadTickets({ folder: 'aid-voice-refs', resource_type: 'video' });
  else if (usesR2Storage()) { if (!hasR2Credentials()) throw new Error('R2 媒体存储配置不完整；尚未提交生成'); }
  else if (!primaryCredentials() && !backupCredentials()) throw new Error('媒体存储尚未配置；尚未提交生成');
}

async function uploadWithHostedSignature(source: string | Buffer, options: UploadApiOptions): Promise<UploadApiResponse> {
  const targets = await requestUploadTickets(options);
  for (let index = 0; index < targets.length; index++) {
    const target = targets[index];
    if (target.provider === 'r2') {
      const bytes = await readMediaSource(source, (options.resource_type || 'image') === 'image' ? 50 * 1024 * 1024 : 512 * 1024 * 1024);
      const meta = await describeMedia(bytes, options);
      const ticket = target.headers['Content-Type'] === meta.contentType ? target : (await requestUploadTickets(options, meta.contentType))[0];
      if (ticket.provider !== 'r2') throw new Error('媒体存储配置在上传期间发生变化，请重试');
      const response = await fetch(ticket.url, { method: 'PUT', headers: ticket.headers, body: new Uint8Array(bytes), signal: AbortSignal.timeout(120000), redirect: 'error' });
      if (!response.ok) throw new Error(`R2 媒体上传失败（${response.status}）`);
      return { secure_url: ticket.secure_url, url: ticket.secure_url, public_id: ticket.public_id, bytes: bytes.length, width: meta.width, height: meta.height, format: meta.format, resource_type: options.resource_type || 'image' } as UploadApiResponse;
    }
    const form = new FormData();
    for (const [key, value] of Object.entries(target.fields)) form.append(key, value);
    if (typeof source === 'string') form.append('file', source);
    else {
      const { fitImageUpload } = await import('./imageUpload');
      const bytes = (options.resource_type || 'image') === 'image' ? await fitImageUpload(source, true) : source;
      form.append('file', new Blob([new Uint8Array(bytes)]), 'media');
    }
    const response = await fetch(target.url, { method: 'POST', body: form, signal: AbortSignal.timeout(120000), redirect: 'error' });
    const result = await response.json();
    if (response.ok && typeof result.secure_url === 'string' && result.secure_url.startsWith('https://')) return result;
    const failure = { http_code: response.status, message: result.error?.message || '媒体上传失败' };
    if (index + 1 === targets.length || !isPrimaryAccountUnavailable(failure)) throw new Error(failure.message);
  }
  throw new Error('媒体保存失败');
}

type CloudinaryCredentials = {
  cloud_name: string;
  api_key: string;
  api_secret: string;
};

function credentialsFromUrl(value: string | undefined): CloudinaryCredentials | undefined {
  if (!value?.trim()) return undefined;
  try {
    const parsed = new URL(value.trim());
    if (parsed.protocol !== 'cloudinary:' || !parsed.hostname || !parsed.username || !parsed.password) return undefined;
    return {
      cloud_name: parsed.hostname,
      api_key: decodeURIComponent(parsed.username),
      api_secret: decodeURIComponent(parsed.password),
    };
  } catch {
    return undefined;
  }
}

function primaryCredentials(): CloudinaryCredentials | undefined {
  const cloud_name = String(process.env.CLOUDINARY_CLOUD_NAME || '').trim();
  const api_key = String(process.env.CLOUDINARY_API_KEY || '').trim();
  const api_secret = String(process.env.CLOUDINARY_API_SECRET || '').trim();
  return cloud_name && api_key && api_secret
    ? { cloud_name, api_key, api_secret }
    : credentialsFromUrl(process.env.CLOUDINARY_URL);
}

function backupCredentials(): CloudinaryCredentials | undefined {
  return credentialsFromUrl(process.env.CLOUDINARY_BACKUP_URL || process.env.CLOUDINARY_URL_BACKUP);
}

function sameAccount(left: CloudinaryCredentials, right: CloudinaryCredentials): boolean {
  return left.cloud_name === right.cloud_name && left.api_key === right.api_key;
}

function errorStatus(error: unknown): number {
  if (!error || typeof error !== 'object') return 0;
  const value = error as Record<string, unknown>;
  const status = Number(value.http_code || value.statusCode || value.status || 0);
  return Number.isFinite(status) ? status : errorStatus(value.error);
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (!error || typeof error !== 'object') return String(error || '');
  const value = error as Record<string, unknown>;
  return [value.message, value.error_description, errorMessage(value.error)]
    .filter(Boolean)
    .join(' ');
}

function isPrimaryAccountUnavailable(error: unknown): boolean {
  const status = errorStatus(error);
  if ([401, 403, 420, 429].includes(status)) return true;
  return /(?:invalid|unknown|disabled|suspended|restricted|blocked)\s+(?:api\s*)?(?:key|account|cloud)|(?:account|cloud)\s+(?:is\s+)?(?:disabled|suspended|restricted|blocked)|invalid signature|quota|usage limit|storage limit|bandwidth limit|monthly limit|plan limit|credit limit|rate limit|too many requests|insufficient (?:quota|credits|storage|bandwidth)/i.test(errorMessage(error));
}

async function withFallback<T>(operation: (credentials: CloudinaryCredentials) => Promise<T>): Promise<T> {
  const primary = primaryCredentials();
  const backup = backupCredentials();
  if (!primary) {
    if (!backup) throw new Error('Cloudinary credentials are not configured');
    return await operation(backup);
  }
  try {
    return await operation(primary);
  } catch (primaryError) {
    if (!backup || sameAccount(primary, backup) || !isPrimaryAccountUnavailable(primaryError)) throw primaryError;
    console.warn('Primary Cloudinary account is unavailable; retrying with backup account.');
    return await operation(backup);
  }
}

export function hasCloudinaryUploadTarget(): boolean {
  return usesR2Storage() ? hasR2Credentials() || usesHostedSigning() : Boolean(primaryCredentials() || backupCredentials() || usesHostedSigning());
}

export async function uploadToCloudinary(
  source: string,
  options: UploadApiOptions,
): Promise<UploadApiResponse> {
  if (usesHostedSigning()) return uploadWithHostedSignature(source, options);
  if (usesR2Storage()) return uploadToR2(source, options);
  return await withFallback(credentials => cloudinary.uploader.upload(source, {
    ...options,
    ...credentials,
    secure: true,
  }));
}

export async function uploadBufferToCloudinary(
  buffer: Buffer,
  options: UploadApiOptions,
): Promise<UploadApiResponse> {
  if (usesHostedSigning()) return uploadWithHostedSignature(buffer, options);
  if (usesR2Storage()) return uploadToR2(buffer, options);
  return await withFallback(credentials => new Promise<UploadApiResponse>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { ...options, ...credentials, secure: true },
      (error?: UploadApiErrorResponse, result?: UploadApiResponse) => {
        if (error || !result) reject(error || new Error('Cloudinary upload returned no result'));
        else resolve(result);
      },
    );
    stream.end(buffer);
  }));
}
