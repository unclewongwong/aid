import { readFile, writeFile, rename } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { uploadBufferToCloudinary } from './cloudinaryUpload';

type Reference = { name: string; url: string };
export interface SavedVoiceMedia { audio: string; url?: string; [key: string]: unknown }
interface Dependencies {
  available: (url: string) => Promise<boolean>;
  load: (url: string) => Promise<SavedVoiceMedia | undefined>;
  upload: (url: string, saved: SavedVoiceMedia) => Promise<string>;
  save: (url: string, saved: SavedVoiceMedia) => Promise<void>;
}

/** Repairs delivery only: never synthesize again or substitute a speaker. */
export function createApiVoiceReferenceRecovery(deps: Dependencies) {
  const pending = new Map<string, Promise<string>>();
  const ready = new Map<string, { url: string; until: number }>();
  return async (references: Reference[]): Promise<Reference[]> => Promise.all(references.map(async reference => {
    const original = reference.url;
    const recent = ready.get(original);
    if (recent && recent.until > Date.now()) return { ...reference, url: recent.url };
    let operation = pending.get(original);
    if (!operation) {
      operation = (async () => {
        if (await deps.available(original)) return original;
        const saved = await deps.load(original);
        if (!saved?.audio || Buffer.from(saved.audio, 'base64').length < 1000)
          throw new Error('链接已失效且本机没有可恢复的原音频');
        if (saved.url && saved.url !== original && await deps.available(saved.url)) return saved.url;
        const url = await deps.upload(original, saved);
        if (!await deps.available(url)) throw new Error('原音频已上传，但新链接仍不可读取');
        await deps.save(original, { ...saved, url });
        return url;
      })();
      pending.set(original, operation);
    }
    try {
      const url = await operation;
      ready.set(original, { url, until: Date.now() + 60_000 });
      return { ...reference, url };
    } catch (error) {
      throw new Error(`角色“${reference.name}”的音色参考不可用：${error instanceof Error ? error.message : '读取失败'}；未提交新的视频生成。`);
    } finally { if (pending.get(original) === operation) pending.delete(original); }
  }));
}

export async function publicAudioAvailable(url: string): Promise<boolean> {
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password) throw new Error('音色参考需要公开HTTPS链接');
  // Only inspect our managed media host here. Custom external references keep
  // their existing provider-side handling, without turning this into a URL proxy.
  if (parsed.hostname !== 'res.cloudinary.com') return true;
  let response = await fetch(url, { method: 'HEAD', redirect: 'error', signal: AbortSignal.timeout(10_000) });
  if ([405, 501].includes(response.status)) {
    response = await fetch(url, { headers: { Range: 'bytes=0-0' }, redirect: 'error', signal: AbortSignal.timeout(10_000) });
    await response.body?.cancel();
  }
  if ([401, 403, 404, 410].includes(response.status)) return false;
  if (!response.ok) throw new Error(`音频存储暂时不可访问（HTTP ${response.status}），请稍后重试`);
  const type = response.headers.get('content-type') || '';
  return /^(audio\/|video\/|application\/octet-stream)/i.test(type);
}

function voiceCacheIdentity(url: string): { file: string; publicId: string } | undefined {
  const root = process.env.AID_COMPANION_DATA_DIR;
  if (process.env.AID_LOCAL_COMPANION !== '1' || !root) return;
  const parsed = new URL(url);
  if (parsed.hostname !== 'res.cloudinary.com') return;
  const match = parsed.pathname.match(/\/(voice-ref-timbre-v\d+-([a-f0-9]{64}))\.mp3$/);
  if (match) return { file: path.join(root, 'voice-reference-cache', `${match[2]}.json`), publicId: match[1] };
}

export const recoverApiVoiceReferences = createApiVoiceReferenceRecovery({
  available: publicAudioAvailable,
  load: async url => {
    const identity = voiceCacheIdentity(url);
    if (!identity) return;
    try { return JSON.parse(await readFile(identity.file, 'utf8')) as SavedVoiceMedia; }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
  },
  upload: async (url, saved) => {
    const identity = voiceCacheIdentity(url);
    if (!identity) throw new Error('缺少原音频缓存');
    const result = await uploadBufferToCloudinary(Buffer.from(saved.audio, 'base64'), {
      folder: 'aid-voice-refs', resource_type: 'video', public_id: identity.publicId, overwrite: false,
    });
    return result.secure_url;
  },
  save: async (url, saved) => {
    const identity = voiceCacheIdentity(url);
    if (!identity) throw new Error('缺少原音频缓存');
    const temporary = `${identity.file}.${randomUUID()}.tmp`;
    await writeFile(temporary, JSON.stringify(saved), { mode: 0o600 });
    await rename(temporary, identity.file);
  },
});
