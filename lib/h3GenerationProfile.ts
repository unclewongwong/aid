/**
 * Hybrid 8Turbo already contains acceleration distillation. Never attach the
 * retired four-step LoRA, including when loading an old saved workflow/job.
 * Shared by ordinary generation, Motion Context and Director.
 */
export const H3_DASIWA_8TURBO_PROFILE = Object.freeze({
  name: 'dasiwa8' as const,
  diffusionModel: 'DasiwaMinimaxH3_dasiwaHybrid8turboV1.safetensors',
  diffusionModelSha256: 'e0441d26414f6e0c28f43d580e6cc56fad424da0fa4d261b698ca73188aa6332',
  textEncoder: 'qwen3vl_32b_minimax_h3_int8_convrot.safetensors',
  lora: null,
  steps: 8,
  shiftVideo: 12,
  shiftAudio: 3,
  loraStrength: 0,
  samplerName: 'dual_clock_euler',
  scheduler: 'simple',
});
