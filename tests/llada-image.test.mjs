import test from 'node:test';
import assert from 'node:assert/strict';
import { lladaImageApiPrompt, lladaImageDimensions } from '../lib/lladaImageWorkflow.ts';
import { normalizeImageModel, getImageModelCapabilities, imageModelRequiresApiKey } from '../lib/imageModels.ts';
import { fetchImageApi, imageApiUrl } from '../lib/comfyuiClient.ts';
import { createProviderImageTask } from '../lib/imageTaskProvider.ts';

test('retired settings route to LLaDA locally while historical tasks keep their status route', () => {
  assert.equal(normalizeImageModel('comfyui-z-image-turbo'), 'comfyui-llada-image-turbo');
  for (const id of ['comfyui-z-image-turbo', 'comfyui-llada-image-turbo']) {
    assert.equal(getImageModelCapabilities(id).maxReferenceImages, 1);
    assert.equal(imageModelRequiresApiKey(id), false);
    assert.equal(imageApiUrl('/api/generate', undefined, id), 'http://127.0.0.1:3018/api/generate');
  }
  assert.equal(imageApiUrl('/api/check-image-status', undefined, 'comfyui-image:old-prompt'), 'http://127.0.0.1:3018/api/check-image-status');
});

test('all aspect ratios use edit-compatible sizes and carry the exact reference into the queued node', () => {
  for (const ratio of ['1:1', '16:9', '9:16', '4:3']) {
    const dimensions = lladaImageDimensions(ratio);
    const graph = lladaImageApiPrompt({ ...dimensions, prompt: 'Preserve this package; change the room.', seed: 42, referenceImage: 'aid/assets/package.png', outputPrefix: 'aid/llada_image/test' });
    assert.equal(graph['1'].inputs.width % 32, 0);
    assert.equal(graph['1'].inputs.height % 32, 0);
    assert.equal(graph['1'].inputs.reference_image, 'aid/assets/package.png');
    assert.equal(graph['1'].class_type, 'AIDLLaDAImage');
    assert.deepEqual(graph['2'].inputs.images, ['1', 0]);
  }
});

test('excess references fail before creating a cloud task, including a separate style reference', async () => {
  await assert.rejects(createProviderImageTask('test', ['https://example.com/a.png', 'https://example.com/b.png'], '', 'comfyui-llada-image-turbo', '1:1'), /一张/);
  await assert.rejects(createProviderImageTask('test', ['https://example.com/a.png'], '', 'comfyui-llada-image-turbo', '1:1', undefined, {}, { styleReference: { imageUrl: 'https://example.com/style.png' } }), /参考图已满/);
});

test('old Companion is rejected before any generation request; compatible Companion receives it once', async () => {
  const original = globalThis.fetch;
  const calls = [];
  let supported = false;
  globalThis.fetch = async (url, init) => {
    calls.push(String(url));
    return Response.json(String(url).endsWith('/status') ? { ok: true, lladaImageTurbo: supported } : { taskId: 'comfyui-image:new' });
  };
  try {
    await assert.rejects(fetchImageApi('/api/generate', undefined, 'comfyui-llada-image-turbo', { method: 'POST' }), /更新/);
    assert.equal(calls.length, 1);
    supported = true;
    const response = await fetchImageApi('/api/generate', undefined, 'comfyui-llada-image-turbo', { method: 'POST' });
    assert.equal((await response.json()).taskId, 'comfyui-image:new');
    assert.equal(calls.filter(url => url.endsWith('/generate')).length, 1);
  } finally {
    globalThis.fetch = original;
  }
});
