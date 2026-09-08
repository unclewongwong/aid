export function lladaImageDimensions(aspectRatio: string): { width: number; height: number } {
  if (aspectRatio === '9:16') return { width: 768, height: 1344 };
  if (aspectRatio === '16:9') return { width: 1344, height: 768 };
  if (aspectRatio === '4:3') return { width: 1152, height: 864 };
  return { width: 1024, height: 1024 };
}

/** The isolated cloud node owns the pinned Turbo weights and four-step sampler. */
export function lladaImageApiPrompt(input: {
  prompt: string; width: number; height: number; seed: number;
  outputPrefix: string; referenceImage?: string;
}) {
  if (!input.prompt.trim()) throw new Error('LLaDA-Image-Turbo 提示词不能为空');
  if (input.width % 32 || input.height % 32) throw new Error('LLaDA 图片尺寸必须是 32 的倍数');
  return {
    '1': { class_type: 'AIDLLaDAImage', inputs: {
      prompt: input.prompt, width: input.width, height: input.height, seed: input.seed,
      reference_image: input.referenceImage || '',
    } },
    '2': { class_type: 'SaveImage', inputs: { images: ['1', 0], filename_prefix: input.outputPrefix } },
  };
}
