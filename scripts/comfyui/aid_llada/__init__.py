"""Run LLaDA in its own dependency environment, inside ComfyUI's normal queue."""
import json
import os
from pathlib import Path
import subprocess
import tempfile

import numpy as np
from PIL import Image
import torch
import folder_paths
import comfy.model_management


class AIDLLaDAImage:
    @classmethod
    def INPUT_TYPES(cls):
        return {"required": {
            "prompt": ("STRING", {"multiline": True}),
            "width": ("INT", {"default": 1024, "min": 256, "max": 2048, "step": 32}),
            "height": ("INT", {"default": 1024, "min": 256, "max": 2048, "step": 32}),
            "seed": ("INT", {"default": 42, "min": 0, "max": 0x7FFFFFFFFFFFFFFF}),
        }, "optional": {"reference_image": ("STRING", {"default": ""})}}

    RETURN_TYPES = ("IMAGE",)
    FUNCTION = "generate"
    CATEGORY = "AID/Image"

    def generate(self, prompt, width, height, seed, reference_image=""):
        if width % 32 or height % 32:
            raise ValueError("LLaDA output dimensions must be multiples of 32")
        runtime = Path(os.environ.get("AID_LLADA_RUNTIME", "/root/aid-llada"))
        python = runtime / "venv/bin/python"
        if not python.is_file():
            raise RuntimeError("LLaDA isolated runtime is not installed")
        source = ""
        if reference_image:
            source = str(Path(folder_paths.get_annotated_filepath(reference_image)).resolve())
            input_root = Path(folder_paths.get_input_directory()).resolve()
            if not Path(source).is_relative_to(input_root) or not Path(source).is_file():
                raise ValueError("LLaDA reference must be an uploaded ComfyUI input image")
        # The worker exits after each request and releases its CUDA allocations.
        # Release Comfy-managed H3 caches before starting a second CUDA process.
        comfy.model_management.unload_all_models()
        comfy.model_management.soft_empty_cache()
        with tempfile.TemporaryDirectory(prefix="aid-llada-") as directory:
            request = Path(directory) / "request.json"
            output = Path(directory) / "output.png"
            request.write_text(json.dumps({"prompt": prompt, "width": width, "height": height,
                "seed": seed, "reference": source, "output": str(output)}))
            with (Path(directory) / "worker.log").open("w+") as log:
                process = subprocess.Popen([str(python), str(Path(__file__).with_name("worker.py")),
                    str(request)], stdout=log, stderr=subprocess.STDOUT, cwd=str(runtime))
                try:
                    import time
                    started = time.monotonic()
                    while process.poll() is None:
                        comfy.model_management.throw_exception_if_processing_interrupted()
                        if time.monotonic() - started > 1800:
                            raise TimeoutError("LLaDA generation exceeded 30 minutes")
                        time.sleep(0.5)
                finally:
                    if process.poll() is None:
                        process.terminate()
                        try:
                            process.wait(timeout=10)
                        except subprocess.TimeoutExpired:
                            process.kill()
                            process.wait()
                if process.returncode or not output.is_file():
                    log.seek(0)
                    detail = log.read()[-4000:]
                    raise RuntimeError(f"LLaDA generation failed: {detail}")
            with Image.open(output) as image:
                pixels = np.array(image.convert("RGB"), dtype=np.float32) / 255.0
            return (torch.from_numpy(pixels).unsqueeze(0),)


NODE_CLASS_MAPPINGS = {"AIDLLaDAImage": AIDLLaDAImage}
NODE_DISPLAY_NAME_MAPPINGS = {"AIDLLaDAImage": "AID · LLaDA-Image-Turbo"}
