export const SEEDANCE_MINI = 'seedance-2.0-mini';
export const MAX_SEEDANCE_MINI_REFERENCE_IMAGES = 9;
export const GEMINI_OMNI_1_1_FLASH = 'gemini-omni-1.1-flash';
export const MAX_GEMINI_OMNI_REFERENCE_IMAGES = 10;

export type GeminiOmniResolution = '360p' | '720p' | '1080p' | '4k';

export function normalizeGeminiOmniResolution(value: unknown): GeminiOmniResolution {
  const normalized = String(value || '').toLowerCase();
  if (normalized === '2160p') return '4k';
  return ['360p', '720p', '1080p', '4k'].includes(normalized)
    ? normalized as GeminiOmniResolution
    : '720p';
}

export function videoModelAcceptsExplicitDuration(model: string): boolean {
  return normalizeVideoModel(model).toLowerCase() !== GEMINI_OMNI_1_1_FLASH;
}

export function validateGeminiOmniInputs({
  imageCount,
  videoCount = 0,
  audioCount = 0,
}: {
  imageCount: number;
  videoCount?: number;
  audioCount?: number;
}): string | null {
  if (imageCount > MAX_GEMINI_OMNI_REFERENCE_IMAGES) {
    return `Gemini Omni 1.1 Flash 最多支持 ${MAX_GEMINI_OMNI_REFERENCE_IMAGES} 张图片`;
  }
  if (videoCount > 1) return 'Gemini Omni 1.1 Flash 最多支持 1 条参考视频';
  if (audioCount > 0) return 'Gemini Omni 1.1 Flash 不支持上传参考音频';
  return null;
}

export function validateSeedanceMiniReferences({
  imageCount,
  hasImageRoles,
  videoCount = 0,
  audioCount = 0,
}: {
  imageCount: number;
  hasImageRoles: boolean;
  videoCount?: number;
  audioCount?: number;
}): string | null {
  if (imageCount > MAX_SEEDANCE_MINI_REFERENCE_IMAGES) {
    return `Seedance 2.0 Mini 最多支持 ${MAX_SEEDANCE_MINI_REFERENCE_IMAGES} 张参考图`;
  }
  if (videoCount > 3) return 'Seedance 2.0 Mini 最多支持 3 条参考视频';
  if (audioCount > 3) return 'Seedance 2.0 Mini 最多支持 3 条参考音频';
  if (hasImageRoles && (videoCount > 0 || audioCount > 0)) {
    return 'Seedance 2.0 Mini 的首尾帧模式不能同时使用参考视频或参考音频';
  }
  return null;
}

/** Retired Seedance selections in saved settings and incoming API requests. */
export function normalizeVideoModel(model: string): string {
  const retired = /^(?:doubao-)?seedance-(?:2[.-]0(?:-fast|-mini)?|1-5-pro)$/i;
  return retired.test(model.trim()) ? SEEDANCE_MINI : model;
}
