# LLaDA-Image-Turbo replacement

Z-Image's selector entry is replaced by `comfyui-llada-image-turbo`. Saved `comfyui-z-image-turbo` settings normalize to the new provider. Existing `comfyui-image:` task IDs and output persistence remain readable. New submissions require the Companion `lladaImageTurbo` capability, preventing older clients from silently submitting Z-Image.

The image studio supports text-only generation and native editing with one optional source image. More references, including an extra style reference, are rejected before submission. This is not a multi-reference replacement for GPT-Image. The existing Story reference-capacity checks remain in effect.

## Runtime

- Cloud node: `scripts/comfyui/aid_llada`, installed under `/root/ComfyUI/custom_nodes/aid_llada`.
- Dedicated Python environment: `/root/aid-llada/venv`, sharing the installed PyTorch binaries but keeping Transformers/Diffusers upgrades separate from H3.
- Community runtime: `/root/aid-llada/upstream`, pinned to RealRebelAI/LLaDa-Image_ComfyUI `49244674e735acb1a46d8b36a2e26869dc9002f7`.
- City96 GGUF helper lives in `ComfyUI-GGUF.disabled`; only the isolated worker imports its loader/dequantization code. ComfyUI does not autoload this extra node package.
- Transformers 4.57.6, Diffusers 0.39.0; existing ComfyUI dependency versions are preserved.
- INT8 Turbo transformer, Q4_K_M text encoder, matching Turbo auxiliary components and LLaDA VAE. Four sampling steps, CFG 1, BF16 compute, tiled VAE.
- The ComfyUI queue owns execution. Before starting LLaDA, Comfy-managed cached models are unloaded. The isolated child process releases its GPU memory on exit; cancellation terminates the child. Output then flows through the existing SaveImage and persistence paths.
- The worker uses predownloaded local weights with offline Hugging Face access. No runtime model download or package installation occurs during image generation.

## Storage finding

On the inspected cloud instance, `z_image_turbo_bf16.safetensors` and `qwen_3_4b.safetensors` point at read-only platform mounts under `/.xgcos/.links/`, on a different filesystem from `/root/ComfyUI`. Their nominal 20.35GB size is **not reclaimable system-disk usage**. Removing these entries will not free that amount. The new downloaded LLaDA weights and auxiliaries require about 19GB plus the isolated environment. Do not remove the platform mount targets or claim their nominal bytes as disk savings.

## Verification state

- 56 related tests passed, including model migration, one-reference limits, workflow wiring and old Companion rejection.
- TypeScript and production build passed. An isolated browser smoke test also verified saved-setting migration, text generation, one-reference submission and the old-Companion gate.
- Isolated cloud environment imports the upstream Loader/TextToImage/Edit classes successfully.
- Weight download and real text-to-image/edit smoke tests are not complete yet. No Z-Image files removed; no release yet.

Evidence and resumable setup tools: `outputs/llada-migration-20260908/` (ignored; do not commit credentials or generated media).
