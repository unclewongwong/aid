/** A fresh browser's defaults are display values, not authorization to submit jobs. */
export function hasExplicitGenerationModels(value: unknown): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const settings = value as Record<string, unknown>;
  return ['imageModel', 'scriptModel'].every(key => typeof settings[key] === 'string' && Boolean(settings[key].trim()));
}

export const SETTINGS_REQUIRED_MESSAGE = '当前浏览器尚未保存生图和编剧设置；线上网站与本机页面的设置独立，请先打开 Settings 确认模型，不会使用初始默认值开始制作。';
