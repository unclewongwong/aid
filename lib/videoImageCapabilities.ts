import { normalizeVideoModel } from './videoModels';

export type VideoImageMode = 'frame' | 'reference';
export interface VideoImageCapability {
  referenceImages: number;
  frameImages: number;
  referenceCounts?: number[];
}

// APIMart model documentation checked 2026-09-08; limits include image 1.
export function videoImageCapability(provider = 'apimart', model = ''): VideoImageCapability {
  if (provider === 'fal') return { referenceImages: 0, frameImages: 2 };
  const name = normalizeVideoModel(model).toLowerCase();
  if (name === 'seedance-2.0-mini' || name === 'minimax-h3') return { referenceImages: 9, frameImages: 2 };
  if (name === 'wan3.0-video') return { referenceImages: 10, frameImages: 2 };
  if (name.includes('grok-imagine')) return { referenceImages: 7, frameImages: 0 };
  if (name.includes('omni-flash-ext')) return { referenceImages: 3, frameImages: 1, referenceCounts: [1, 3] };
  if (name === 'happyhorse-1.0') return { referenceImages: 9, frameImages: 1 };
  if (name === 'veo3.1-fast') return { referenceImages: 3, frameImages: 2 };
  if (name === 'veo3.1-quality' || name === 'wan2.7' || name.includes('seedance') || name.includes('doubao')) return { referenceImages: 0, frameImages: 2 };
  return { referenceImages: 0, frameImages: 1 };
}

export function validateVideoImageCount(capability: VideoImageCapability, mode: VideoImageMode, count: number): void {
  const max = mode === 'reference' ? capability.referenceImages : capability.frameImages;
  if (!max) throw new Error(`当前模型不支持${mode === 'reference' ? '多图参考' : '首尾帧'}模式`);
  if (count < 1 || count > max) throw new Error(`当前${mode === 'reference' ? '参考图' : '首尾帧'}模式需要 1–${max} 张图片，已选择 ${count} 张；请移除多余图片或切换模型`);
  if (mode === 'reference' && capability.referenceCounts && !capability.referenceCounts.includes(count))
    throw new Error(`当前模型参考模式只支持 ${capability.referenceCounts.join(' 或 ')} 张图片，已选择 ${count} 张`);
}
