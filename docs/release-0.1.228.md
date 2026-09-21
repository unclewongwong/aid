# AID 0.1.228

The local ComfyUI image-generation entry now uses Qwen-Image-2.1 instead of LLaDA-Image-Turbo. Saved Z-Image and LLaDA selections migrate to `comfyui-qwen-image-2-1`; historical `comfyui-image:` task IDs remain readable.

The image graph is independent of MiniMax H3. It uses the official Qwen-Image-2.1 INT8 transformer, Qwen3-VL INT8 text encoder and BF16 RGBA VAE with the official 25-step Euler/simple path. Text-to-image and ordered editing with up to ten references are supported. H3 workflow files, model choices, four-step LoRA, sampler settings and prompt construction are unchanged.

Cloud validation covered official 1024×1024 text-to-image and one-reference editing. Both completed successfully. H3 regression tests passed and the production/staging H3 node schemas were byte-for-byte equivalent after normalized JSON hashing.

Qwen-Image-2.1 is distributed under the Qwen Research License. This integration does not grant a commercial license; commercial use requires separate authorization from the licensor.
