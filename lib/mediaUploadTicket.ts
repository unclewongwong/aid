/** Shared wire contract; safe to import in browser bundles. */
export type MediaUploadTicket = {
  provider?: 'cloudinary'; url: string; fields: Record<string, string>;
} | {
  provider: 'r2'; url: string; method: 'PUT'; headers: Record<string, string>;
  secure_url: string; public_id: string;
};

export function validMediaUploadTicket(value: unknown): value is MediaUploadTicket {
  if (!value || typeof value !== 'object') return false;
  const ticket = value as Record<string, any>;
  try {
    const url = new URL(ticket.url);
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return false;
    if (ticket.provider === 'r2') {
      const delivery = new URL(ticket.secure_url);
      return /^[a-f0-9]{32}\.r2\.cloudflarestorage\.com$/.test(url.hostname)
        && url.searchParams.get('X-Amz-Algorithm') === 'AWS4-HMAC-SHA256'
        && !!url.searchParams.get('X-Amz-Signature') && ticket.method === 'PUT'
        && delivery.protocol === 'https:' && !delivery.username && !delivery.password && !delivery.port
        && typeof ticket.public_id === 'string'
        && ticket.headers?.['If-None-Match'] === '*'
        && Object.entries(ticket.headers).every(([key, val]) => ['Content-Type', 'Cache-Control', 'If-None-Match'].includes(key) && typeof val === 'string');
    }
    return /^https:\/\/api\.cloudinary\.com\/v1_1\/[a-zA-Z0-9_-]+\/(image|video)\/upload$/.test(ticket.url)
      && !!ticket.fields?.signature && Object.values(ticket.fields).every(val => typeof val === 'string');
  } catch { return false; }
}
