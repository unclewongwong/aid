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
- All 14 manifest files downloaded and verified; large weights match the repository LFS SHA-256. ComfyUI restarted while idle: 1,864 nodes, including AIDLLaDAImage; all 1,863 previous nodes remain available.
- Actual 1024×1024 text-to-image passed in 94.641 seconds of cloud execution. Native single-image editing passed in 75.623 seconds. The edit changed the red cup to blue but also added a camera; this verifies the route, not exact preservation of unrelated details.
- The upstream GGUF meta loader omitted non-persistent rotary frequencies. The isolated worker now recomputes those deterministic buffers from the model config; the successful generations used this fix. It also rejects prompts above 2,048 tokens rather than silently truncating them.
- Transient SSH interruptions were recovered using the retained prompt ID; completed images were not regenerated. Outputs and task receipts are in the evidence directory below.
- Released to the website and local Companion in 0.1.220. After the switch, removed the Z transformer and Qwen encoder symlinks plus AID_Z-Image-Turbo_Official.json. ComfyUI no longer lists the Z transformer; LLaDA remains available. Platform mount targets and shared ae.safetensors remain. The small restoration manifest/workflow backup is under /root/aid-llada/retired-z-image. Public installer verification is recorded separately in out/releases/v0.1.220.

Evidence and resumable setup tools: `outputs/llada-migration-20260908/` (ignored; do not commit credentials or generated media).
