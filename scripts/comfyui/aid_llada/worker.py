"""Private subprocess entry point; never imported by the H3 runtime."""
import importlib.util
import json
import os
from pathlib import Path
import sys


def main():
    request_path = sys.argv[1]
    # ComfyUI parses process arguments during imports.
    sys.argv = [sys.argv[0]]
    root = Path(os.environ.get("AID_LLADA_RUNTIME", "/root/aid-llada"))
    sys.path.insert(0, str(Path(os.environ.get("AID_COMFY_ROOT", "/root/ComfyUI"))))
    os.environ["HF_HUB_OFFLINE"] = "1"
    import torch
    torch.set_num_threads(8)
    spec = importlib.util.spec_from_file_location("aid_llada_upstream", root / "upstream/__init__.py",
        submodule_search_locations=[str(root / "upstream")])
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    from aid_llada_upstream.nodes import LLaDAImageLoader, LLaDAImageTextToImage, LLaDAImageEdit
    request = json.loads(Path(request_path).read_text())
    pipeline, = LLaDAImageLoader().load("LLaDA-Image-Turbo-INT8.safetensors",
        "LLaDA-Image-Turbo-text_encoder-Q4_K_M.gguf", "LLaDa_VAE.safetensors",
        "bfloat16", "cuda", "On")
    # The GGUF meta loader does not restore non-persistent rotary buffers.
    # Recompute these deterministic frequencies from config, never model weights.
    for layer in pipeline.text_encoder.modules():
        if getattr(layer, "inv_freq", None) is not None and layer.inv_freq.is_meta:
            frequencies, scaling = layer.rope_init_fn(layer.config, torch.device("cpu"))
            layer.register_buffer("inv_freq", frequencies, persistent=False)
            layer.original_inv_freq = frequencies
            layer.attention_scaling = scaling
    meta = [name for name, value in list(pipeline.text_encoder.named_parameters())
        + list(pipeline.text_encoder.named_buffers()) if value.is_meta]
    if meta:
        raise RuntimeError(f"LLaDA encoder has uninitialized tensors: {meta}")
    # Upstream silently truncates at 2048 tokens. Never discard authored details.
    formatted = f"<role>HUMAN</role> Generate an image: {request['prompt'].strip()}\n<role>ASSISTANT</role>\n<IMAGE1>"
    token_count = len(pipeline.tokenizer(formatted, add_special_tokens=True, truncation=False).input_ids)
    if token_count > 2048:
        raise ValueError(f"LLaDA 提示词超过模型输入容量（{token_count}/2048 tokens）；未截断内容或执行生图")
    args = dict(pipeline=pipeline, prompt=request["prompt"], width=request["width"],
        height=request["height"], steps=4, guidance_scale=1.0, seed=request["seed"])
    from PIL import Image
    import numpy as np
    if request.get("reference"):
        with Image.open(request["reference"]) as source:
            args["image"] = torch.from_numpy(np.array(source.convert("RGB"), dtype=np.float32) / 255).unsqueeze(0)
        result, = LLaDAImageEdit().edit(**args)
    else:
        result, = LLaDAImageTextToImage().generate(**args)
    Image.fromarray((result[0].cpu().numpy().clip(0, 1) * 255).round().astype(np.uint8)).save(request["output"])


if __name__ == "__main__":
    main()
