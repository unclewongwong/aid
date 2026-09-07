import { normalizeVideoModel } from './videoModels';

/** Voice identity references are different from a soundtrack that drives lip sync. */
export function videoAudioCapability(provider = 'apimart', model = '') {
  const m = normalizeVideoModel(model).toLowerCase();
  if (provider === 'comfyui') return { kind: 'timbre' as const, max: 3 };
  if (provider === 'fal') return { kind: 'none' as const, max: 0 };
  if (m === 'wan3.0-video') return { kind: 'timbre' as const, max: 5 };
  if (m.includes('minimax-h3') || m === 'seedance-2.0-mini') return { kind: 'timbre' as const, max: 3 };
  if (/wan\s?2\.[67]/.test(m)) return { kind: 'driver' as const, max: 1 };
  return { kind: 'none' as const, max: 0 };
}

export function videoVoiceNotice(provider = 'apimart', model = '') {
  const capability = videoAudioCapability(provider, model);
  if (capability.kind !== 'timbre') return '声音将由模型自动生成，无法指定音色。' + (capability.kind === 'driver' ? '此模型的音频输入用于驱动对白或配乐，不能作为 Fish 音色参考。' : '');
  return `支持音色参考，每次最多 ${capability.max} 个；音色相似度由模型决定。` + (provider === 'comfyui' ? '' : '首尾帧模式不能同时使用音色参考，请使用参考图模式。');
}

export function selectVideoVoiceReferences(provider: string, model: string, names: string[], references: Record<string, string>) {
  const capability = videoAudioCapability(provider, model);
  if (capability.kind !== 'timbre') return [];
  const speakers = [...new Set(names)];
  if (speakers.length > capability.max) throw new Error(`当前模型每次最多支持 ${capability.max} 个说话角色音色，请拆分视频片段`);
  return speakers.map(name => {
    const url = references[name];
    if (!url) throw new Error(`角色“${name}”缺少音色参考，请先生成参考音频`);
    return { name, url };
  });
}

/** Existing Fish calibration clips are stored as Cloudinary video assets.
 * Bound each delivery derivative so multiple voices share the API's 15s budget.
 * The original calibration remains intact for ComfyUI and later reuse.
 */
export function apiVoiceReferenceUrls(references: Array<{ name: string; url: string }>): string[] {
  const seconds = Math.floor(14.7 / Math.max(1, references.length) * 100) / 100;
  return references.map(({ url }) => {
    if (!/^https:\/\/res\.cloudinary\.com\/[^/]+\/video\/upload\//.test(url)) return url;
    return url.replace('/video/upload/', `/video/upload/du_${seconds}/`);
  });
}
