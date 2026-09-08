import { createImageTask, createMidjourneyImageTask } from './apimart';
import { createComfyUIImageTask, type ComfyUIClientSettings } from './comfyui';
import {
  isComfyUILLaDAImage,
  isMidjourneyImageModel,
  type ImageGenerationAspectRatio,
  type ImageResolutionOverride,
} from './imageModels';
import type { MidjourneyReferenceMode, MidjourneyReferenceOptions } from './midjourney';
import type { MidjourneyTaskMode } from './midjourney';
import type { CapturePreset, VisualStyle } from '@/types';
import { getImageModelCapabilities } from './imageModels';
import { normalizeImageStyleReference, withImageStyleReference, type ImageStyleReference } from './imageStyleReference';

export interface ProviderImageTaskOptions {
  styleReference?: ImageStyleReference;
  midjourneyReferenceMode?: MidjourneyReferenceMode;
  midjourneyTaskMode?: MidjourneyTaskMode;
  midjourneyVisualStyle?: VisualStyle;
  midjourneyCapturePreset?: CapturePreset;
  midjourneyHasPeople?: boolean;
  midjourneyProfile?: string;
  midjourneyReferences?: MidjourneyReferenceOptions;
}

export async function createProviderImageTask(
  prompt: string,
  imageUrls: string[],
  apiKey: string,
  model: string,
  aspectRatio: ImageGenerationAspectRatio,
  resolutionOverride?: ImageResolutionOverride,
  comfyui: ComfyUIClientSettings = {},
  options: ProviderImageTaskOptions = {},
): Promise<string> {
  const style = normalizeImageStyleReference(options.styleReference);
  if (isComfyUILLaDAImage(model)) {
    const styled = withImageStyleReference(prompt, imageUrls, style, 1, true);
    if (styled.images.length > 1) throw new Error('LLaDA-Image-Turbo 支持一张编辑参考图，请只保留一张参考图');
    return (await createComfyUIImageTask({ prompt: styled.prompt, referenceImage: styled.images[0], aspectRatio, settings: comfyui })).taskId;
  }
  if (isMidjourneyImageModel(model)) {
    return await createMidjourneyImageTask(
      prompt,
      imageUrls,
      apiKey,
      aspectRatio,
      options.midjourneyReferenceMode || 'image',
      options.midjourneyVisualStyle,
      options.midjourneyCapturePreset,
      options.midjourneyTaskMode,
      options.midjourneyHasPeople,
      options.midjourneyProfile,
      style ? { ...options.midjourneyReferences, styleReferenceUrl: style.imageUrl, styleDescription: style.description } : options.midjourneyReferences,
    );
  }
  const styled = withImageStyleReference(prompt, imageUrls, style, getImageModelCapabilities(model).maxReferenceImages, true);
  return await createImageTask(styled.prompt, styled.images, apiKey, model, aspectRatio, resolutionOverride);
}
