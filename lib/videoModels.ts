export const SEEDANCE_MINI = 'seedance-2.0-mini';
export const MAX_SEEDANCE_MINI_REFERENCE_IMAGES = 9;

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
