const QWEN_IMAGE_21_UNET = 'qwen_image_2.1_int8_convrot.safetensors';
const QWEN_IMAGE_21_CLIP = 'qwen3vl_8b_int8_convrot.safetensors';
const QWEN_IMAGE_21_VAE = 'qwen_image_2.1_vae_bf16.safetensors';

export function qwenImage21Dimensions(
  aspectRatio: string,
  resolution: '1K' | '2K' = '1K',
): { width: number; height: number } {
  const scale = resolution === '2K' ? 2 : 1;
  if (aspectRatio === '9:16') return { width: 768 * scale, height: 1344 * scale };
  if (aspectRatio === '16:9') return { width: 1344 * scale, height: 768 * scale };
  if (aspectRatio === '4:3') return { width: 1152 * scale, height: 864 * scale };
  return { width: 1024 * scale, height: 1024 * scale };
}

/** Official native Qwen-Image-2.1 graph, isolated from every H3 video graph. */
export function qwenImage21ApiPrompt(input: {
  prompt: string;
  width: number;
  height: number;
  seed: number;
  outputPrefix: string;
  referenceImages?: string[];
}) {
  if (!input.prompt.trim()) throw new Error('Qwen-Image-2.1 提示词不能为空');
  if (input.width % 32 || input.height % 32) throw new Error('Qwen-Image-2.1 图片尺寸必须是 32 的倍数');
  const references = (input.referenceImages || []).filter(Boolean);
  if (references.length > 10) throw new Error('Qwen-Image-2.1 最多支持 10 张参考图');

  const prompt: Record<string, { class_type: string; inputs: Record<string, unknown> }> = {
    '1': { class_type: 'UNETLoader', inputs: { unet_name: QWEN_IMAGE_21_UNET, weight_dtype: 'default' } },
    '2': { class_type: 'CLIPLoader', inputs: { clip_name: QWEN_IMAGE_21_CLIP, type: 'qwen_image', device: 'default' } },
    '3': { class_type: 'VAELoader', inputs: { vae_name: QWEN_IMAGE_21_VAE } },
    '4': { class_type: 'TextEncodeQwenImage21', inputs: {
      clip: ['2', 0], prompt: input.prompt, negative_prompt: '',
      resolution: references.length ? 0 : 1024,
      ...(references.length ? { vae: ['3', 0] } : {}),
    } },
    '5': { class_type: 'EmptyLatentImage', inputs: { width: input.width, height: input.height, batch_size: 1 } },
    '6': { class_type: 'QwenImage21Cache', inputs: { model: ['1', 0], device: 'auto', dtype: 'default' } },
    '7': { class_type: 'KSampler', inputs: {
      model: ['6', 0], positive: ['4', 0], negative: ['4', 1],
      latent_image: references.length ? ['4', 2] : ['5', 0],
      seed: input.seed, steps: 25, cfg: 1, sampler_name: 'euler', scheduler: 'simple', denoise: 1,
    } },
    '8': { class_type: 'VAEDecode', inputs: { samples: ['7', 0], vae: ['3', 0] } },
    '9': { class_type: 'SaveImage', inputs: { images: ['8', 0], filename_prefix: input.outputPrefix } },
  };

  references.forEach((image, index) => {
    const nodeId = String(20 + index);
    prompt[nodeId] = { class_type: 'LoadImage', inputs: { image } };
    prompt['4'].inputs[`images.image_${index + 1}`] = [nodeId, 0];
  });
  return prompt;
}
