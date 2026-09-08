import { execFile } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import path from 'node:path';
import ffmpegStatic from 'ffmpeg-static';
import { readMediaSource } from './mediaSource';
import { uploadBufferToCloudinary } from './cloudinaryUpload';

export const SEEDANCE_AUDIO_SECONDS = 10;
const RATE = 24000;
const BUDGET = RATE * SEEDANCE_AUDIO_SECONDS;

/** Distribute a shared budget without dropping or reordering speakers.
 * Short samples leave their unused allowance to longer samples. */
export function seedanceAudioFrameBudgets(lengths: number[]): number[] {
  if (lengths.length > 3) throw new Error('Seedance Mini 最多支持 3 个音色参考');
  if (lengths.some(n => !Number.isSafeInteger(n) || n <= 0)) throw new Error('音色参考没有可解码的音频');
  const wanted = lengths.map(n => Math.max(2 * RATE, n));
  const result = Array<number>(lengths.length).fill(0);
  let remaining = BUDGET;
  let pending = lengths.map((_, i) => i);
  while (pending.length) {
    const share = Math.floor(remaining / pending.length);
    const short = pending.filter(i => wanted[i] <= share);
    if (!short.length) { for (const i of pending) result[i] = share; break; }
    for (const i of short) { result[i] = wanted[i]; remaining -= wanted[i]; }
    pending = pending.filter(i => !short.includes(i));
  }
  return result;
}

export function seedanceAudioWav(pcm: Buffer, frames: number): Buffer {
  const data = Buffer.alloc(frames * 2);
  pcm.copy(data, 0, 0, Math.min(pcm.length, data.length));
  const header = Buffer.alloc(44);
  header.write('RIFF'); header.writeUInt32LE(36 + data.length, 4); header.write('WAVEfmt ', 8);
  header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20); header.writeUInt16LE(1, 22);
  header.writeUInt32LE(RATE, 24); header.writeUInt32LE(RATE * 2, 28);
  header.writeUInt16LE(2, 32); header.writeUInt16LE(16, 34);
  header.write('data', 36); header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

export async function decodeSeedanceAudio(bytes: Buffer): Promise<Buffer> {
  const directory = await mkdtemp(path.join(tmpdir(), 'aid-seedance-audio-'));
  try {
    const source = path.join(directory, 'source');
    await writeFile(source, bytes);
    return await new Promise<Buffer>((resolve, reject) => {
      const ffmpeg = process.env.FFMPEG_PATH || (process.env.NETLIFY && process.platform === 'linux'
        ? path.join(process.cwd(), 'node_modules/aid-netlify-ffmpeg/ffmpeg') : ffmpegStatic || 'ffmpeg');
      execFile(ffmpeg, [
        '-hide_banner', '-loglevel', 'error', '-protocol_whitelist', 'file,pipe',
        '-i', source, '-map', '0:a:0', '-vn', '-t', '10.001',
        '-ac', '1', '-ar', String(RATE), '-f', 's16le', 'pipe:1',
      ], { encoding: 'buffer', timeout: 30000, maxBuffer: 2 * 1024 * 1024 }, (error, stdout) => {
        if (error) reject(new Error('音色参考无法解码；未提交视频生成'));
        else if (!stdout.length || stdout.length % 2) reject(new Error('音色参考没有可解码的音频'));
        else resolve(stdout);
      });
    });
  } finally { await rm(directory, { recursive: true, force: true }); }
}

export function createSeedanceAudioDelivery(deps: {
  read: (url: string) => Promise<Buffer>;
  decode: (bytes: Buffer) => Promise<Buffer>;
  upload: (bytes: Buffer, key: string) => Promise<string>;
}) {
  const ready = new Map<string, { promise: Promise<string[]>; until: number }>();
  return async (urls: string[]): Promise<string[]> => {
    if (!urls.length) return [];
    if (urls.length > 3) throw new Error('Seedance Mini 最多支持 3 个音色参考');
    const key = JSON.stringify(urls);
    const cached = ready.get(key);
    if (cached && cached.until > Date.now()) return [...await cached.promise];
    const promise = (async () => {
      const pcm = await Promise.all(urls.map(async (url, i) => {
        try { return await deps.decode(await deps.read(url)); }
        catch (error) { throw new Error(`音色参考 ${i + 1} 处理失败：${error instanceof Error ? error.message : '读取失败'}；未提交视频生成`); }
      }));
      const frames = seedanceAudioFrameBudgets(pcm.map(b => b.length / 2));
      return Promise.all(pcm.map((bytes, i) => {
        const wav = seedanceAudioWav(bytes, frames[i]);
        const hash = createHash('sha256').update(wav).digest('hex');
        return deps.upload(wav, `seedance-voice-10s-v1-${hash}`);
      }));
    })();
    // Bounded, request-set cache coalesces parallel shots; no failed URL is cached.
    if (ready.size >= 64) ready.delete(ready.keys().next().value!);
    ready.set(key, { promise, until: Date.now() + 10 * 60_000 });
    try { return [...await promise]; }
    catch (error) { if (ready.get(key)?.promise === promise) ready.delete(key); throw error; }
  };
}

export const seedanceAudioDelivery = { prepare: createSeedanceAudioDelivery({
  read: url => readMediaSource(url, 50 * 1024 * 1024, process.env.AID_LOCAL_COMPANION === '1'),
  decode: decodeSeedanceAudio,
  upload: async (bytes, key) => (await uploadBufferToCloudinary(bytes, {
    folder: 'aid-voice-refs', resource_type: 'video', public_id: key, overwrite: false,
  })).secure_url,
}) };
