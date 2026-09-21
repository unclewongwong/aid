import test from 'node:test';
import assert from 'node:assert/strict';
import { qwenImage21ApiPrompt, qwenImage21Dimensions } from '../lib/qwenImage21Workflow.ts';
import { normalizeImageModel, getImageModelCapabilities, imageModelRequiresApiKey } from '../lib/imageModels.ts';
import { fetchImageApi, imageApiUrl } from '../lib/comfyuiClient.ts';

test('retired local image settings migrate to Qwen Image 2.1 while historical task IDs keep their status route', () => {
  for (const legacy of ['comfyui-z-image-turbo', 'comfyui-llada-image-turbo']) {
    assert.equal(normalizeImageModel(legacy), 'comfyui-qwen-image-2-1');
    assert.equal(getImageModelCapabilities(legacy).maxReferenceImages, 10);
    assert.equal(imageModelRequiresApiKey(legacy), false);
    assert.equal(imageApiUrl('/api/generate', undefined, legacy), 'http://127.0.0.1:3018/api/generate');
  }
  assert.equal(imageApiUrl('/api/check-image-status', undefined, 'comfyui-image:old-prompt'), 'http://127.0.0.1:3018/api/check-image-status');
});

test('builds the official text-to-image graph independently of H3', () => {
  for (const ratio of ['1:1', '16:9', '9:16', '4:3']) {
    const dimensions = qwenImage21Dimensions(ratio);
    const graph = qwenImage21ApiPrompt({ ...dimensions, prompt: 'A glass sculpture in soft daylight.', seed: 42, outputPrefix: 'aid/qwen_image_2_1/test' });
    assert.equal(graph['5'].inputs.width % 32, 0);
    assert.equal(graph['5'].inputs.height % 32, 0);
    assert.equal(graph['1'].class_type, 'UNETLoader');
    assert.equal(graph['4'].class_type, 'TextEncodeQwenImage21');
    assert.equal(graph['6'].class_type, 'QwenImage21Cache');
    assert.deepEqual(graph['7'].inputs.latent_image, ['5', 0]);
    assert.deepEqual(graph['9'].inputs.images, ['8', 0]);
    assert.equal(Object.values(graph).some(node => /MiniMaxH3|LLaDA/.test(node.class_type)), false);
  }
});

test('builds a ten-reference edit graph with official dynamic image inputs', () => {
  const references = Array.from({ length: 10 }, (_, index) => `aid/assets/reference-${index + 1}.png`);
  const graph = qwenImage21ApiPrompt({
    ...qwenImage21Dimensions('1:1'), prompt: 'Combine <image1> through <image10>.', seed: 42,
    referenceImages: references, outputPrefix: 'aid/qwen_image_2_1/test',
  });
  assert.deepEqual(graph['7'].inputs.latent_image, ['4', 2]);
  assert.deepEqual(graph['4'].inputs.vae, ['3', 0]);
  assert.equal(graph['4'].inputs.resolution, 0);
  references.forEach((reference, index) => {
    const nodeId = String(20 + index);
    assert.equal(graph[nodeId].inputs.image, reference);
    assert.deepEqual(graph['4'].inputs[`images.image_${index + 1}`], [nodeId, 0]);
  });
  assert.throws(() => qwenImage21ApiPrompt({
    ...qwenImage21Dimensions('1:1'), prompt: 'Too many.', seed: 42,
    referenceImages: [...references, 'aid/assets/reference-11.png'], outputPrefix: 'aid/qwen_image_2_1/test',
  }), /10/);
});

test('old Companion is rejected before generation and a compatible Companion receives it once', async () => {
  const original = globalThis.fetch;
  const calls = [];
  let supported = false;
  globalThis.fetch = async url => {
    calls.push(String(url));
    return Response.json(String(url).endsWith('/status') ? { ok: true, qwenImage21: supported } : { taskId: 'comfyui-image:new' });
  };
  try {
    await assert.rejects(fetchImageApi('/api/generate', undefined, 'comfyui-qwen-image-2-1', { method: 'POST' }), /更新/);
    assert.equal(calls.length, 1);
    supported = true;
    const response = await fetchImageApi('/api/generate', undefined, 'comfyui-qwen-image-2-1', { method: 'POST' });
    assert.equal((await response.json()).taskId, 'comfyui-image:new');
    assert.equal(calls.filter(url => url.endsWith('/generate')).length, 1);
  } finally {
    globalThis.fetch = original;
  }
});
