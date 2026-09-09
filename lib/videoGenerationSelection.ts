import type { AppSettings } from '@/types';
import { normalizeVideoModel, SEEDANCE_MINI } from '@/lib/videoModels';

export type VideoGenerationSelection = Pick<AppSettings, 'videoProvider' | 'videoModel'>;
export const VIDEO_GENERATION_CHOICES = [
  { videoProvider: 'apimart', videoModel: 'MiniMax-H3', label: 'MiniMax H3 · APIMart API' },
  { videoProvider: 'apimart', videoModel: SEEDANCE_MINI, label: 'Seedance 2.0 Mini · APIMart API' },
  { videoProvider: 'apimart', videoModel: 'wan3.0-video', label: 'Wan 3.0 · APIMart API' },
  { videoProvider: 'apimart', videoModel: 'sora-2-vip', label: 'Sora 2 VIP · APIMart API' },
  { videoProvider: 'apimart', videoModel: 'grok-imagine-1.5-video-apimart', label: 'Grok Imagine 1.5 · APIMart API' },
  { videoProvider: 'apimart', videoModel: 'Omni-Flash-Ext', label: 'Omni Flash · APIMart API' },
  { videoProvider: 'apimart', videoModel: 'happyhorse-1.0', label: 'HappyHorse 1.0 · APIMart API' },
  { videoProvider: 'apimart', videoModel: 'veo3.1-fast', label: 'Veo 3.1 Fast · APIMart API' },
  { videoProvider: 'apimart', videoModel: 'veo3.1-quality', label: 'Veo 3.1 Quality · APIMart API' },
  { videoProvider: 'apimart', videoModel: 'wan2.7', label: 'Wan 2.7 · APIMart API' },
  { videoProvider: 'fal', videoModel: 'minimax/h3-max/image-to-video', label: 'MiniMax H3 Max · fal API' },
  { videoProvider: 'comfyui', videoModel: 'minimax-h3', label: 'DaSiWa H3 Hybrid pruned · 4步 · ComfyUI 云卡' },
] as const;

export function videoGenerationSelection(settings: Partial<VideoGenerationSelection>): VideoGenerationSelection {
  const videoProvider = settings.videoProvider || 'apimart';
  if (!['apimart', 'comfyui', 'fal'].includes(videoProvider)) throw new Error('视频生成通道无效，请重新选择成片模型');
  const selected = settings.videoModel?.trim();
  const videoModel = videoProvider === 'comfyui' ? 'minimax-h3'
    : videoProvider === 'fal' ? 'minimax/h3-max/image-to-video'
    : selected?.toLowerCase() === 'minimax-h3' ? 'MiniMax-H3'
    : normalizeVideoModel(selected || SEEDANCE_MINI);
  return { videoProvider, videoModel };
}

export function videoSelectionKey(selection: VideoGenerationSelection): string {
  const normalized = videoGenerationSelection(selection);
  return `${normalized.videoProvider}:${normalized.videoModel}`;
}

export function videoSelectionLabel(selection: VideoGenerationSelection): string {
  const key = videoSelectionKey(selection);
  return VIDEO_GENERATION_CHOICES.find(choice => videoSelectionKey(choice) === key)?.label
    || `${selection.videoModel} · ${selection.videoProvider || 'apimart'}`;
}

export function withVideoSelection(settings: AppSettings, selection: VideoGenerationSelection): AppSettings {
  return { ...settings, ...videoGenerationSelection(selection) };
}
