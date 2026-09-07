import test from 'node:test';
import assert from 'node:assert/strict';
import axios from 'axios';
import { createVideoTask, snapDurationToModel } from '../lib/apimart.ts';
import { apiVoiceReferenceUrls, selectVideoVoiceReferences, videoAudioCapability } from '../lib/videoCapabilities.ts';
import { generateStoryboardVideo } from '../lib/videoGenerator.ts';
const image = 'https://example.com/frame.png', audio = 'https://example.com/voice.wav';
function capture(t) {
  const calls = [];
  t.mock.method(axios, 'post', async (url, body) => { calls.push(body); return { data: { data: [{ task_id: 'task' }] } }; });
  t.mock.method(console, 'log', () => {}); t.mock.method(console, 'error', () => {});
  return calls;
}
test('Wan 3 defaults, auto duration and multimodal reference payload', async t => {
  const calls = capture(t);
  await createVideoTask('Walk', [], 'test', 'wan3.0-video');
  assert.deepEqual(calls[0], { model: 'wan3.0-video', prompt: 'Walk', duration: 5, size: '16:9', resolution: '720P', audio: true, generation_type: 'frame' });
  await createVideoTask('Speak', [image], 'test', 'wan3.0-video', '9:16', { duration: -1, quality: '1080p', audioUrls: [audio], generateAudio: true });
  assert.equal(calls[1].duration, -1); assert.equal(calls[1].generation_type, 'reference');
  assert.deepEqual(calls[1].audio_urls, [audio]); assert.deepEqual(calls[1].image_urls, [image]);
  assert.equal(calls[1].audio, true); assert.equal(calls[1].resolution, '1080P');
  assert.equal(snapDurationToModel(31, 'wan3.0-video'), 30);
});
test('Wan frame payload preserves both images and excludes audio refs', async t => {
  const calls = capture(t);
  const roles = [{ url: image, role: 'first_frame' }, { url: image + '?end', role: 'last_frame' }];
  await createVideoTask('Walk', [], 'test', 'wan3.0-video', '16:9', { imageRoles: roles });
  assert.deepEqual(calls[0].image_with_roles, roles); assert.equal(calls[0].image_urls, undefined);
  await assert.rejects(createVideoTask('Walk', [], 'test', 'wan3.0-video', '16:9', { imageRoles: roles, audioUrls: [audio] }), /不能混用/);
  assert.equal(calls.length, 1);
});
test('Wan rejects excess media, incompatible modes, invalid resolution and long prompts before POST', async t => {
  const calls = capture(t);
  for (const [images, options] of [[Array(11).fill(image), {}], [[image], { audioUrls: Array(6).fill(audio) }], [[image], { videoUrls: Array(6).fill(image) }], [[image], { generationType: 'frame', audioUrls: [audio] }], [[image], { resolution: '2K' }]]) {
    await assert.rejects(createVideoTask('Walk', images, 'test', 'wan3.0-video', '16:9', options));
  }
  await assert.rejects(createVideoTask('a'.repeat(20001), [], 'test', 'wan3.0-video'), /20000/);
  assert.equal(calls.length, 0);
});
test('H3 retains images with and without audio, and never mixes frame and reference fields', async t => {
  const calls = capture(t);
  await createVideoTask('Walk', [image], 'test', 'MiniMax-H3');
  assert.deepEqual(calls[0].image_urls, [image]);
  await createVideoTask('Speak', [image], 'test', 'MiniMax-H3', '16:9', { audioUrls: [audio] });
  assert.deepEqual(calls[1].image_urls, [image]); assert.deepEqual(calls[1].audio_urls, [audio]);
  assert.equal(calls[1].first_frame_image, undefined);
  await createVideoTask('Walk', [image], 'test', 'MiniMax-H3', '16:9', { generationType: 'frame' });
  assert.equal(calls[2].first_frame_image, image); assert.equal(calls[2].image_urls, undefined);
  await assert.rejects(createVideoTask('Speak', [], 'test', 'MiniMax-H3', '16:9', { imageRoles: [{ url: image, role: 'first_frame' }], audioUrls: [audio] }), /不能混用/);
  assert.equal(calls.length, 3);
});
test('cast selection preserves speaker ordering, rejects missing refs and distinguishes driving audio', () => {
  const refs = { A: 'a', B: 'b' };
  for (const [provider, model] of [['comfyui', 'MiniMax-H3'], ['apimart', 'wan3.0-video'], ['apimart', 'seedance-2.0-mini']]) {
    assert.deepEqual(selectVideoVoiceReferences(provider, model, ['B', 'A', 'B'], refs), [{ name: 'B', url: 'b' }, { name: 'A', url: 'a' }]);
    assert.throws(() => selectVideoVoiceReferences(provider, model, ['C'], refs), /缺少/);
  }
  assert.throws(() => selectVideoVoiceReferences('comfyui', '', ['A','B','C','D'], refs), /拆分/);
  assert.equal(videoAudioCapability('apimart', 'wan2.7').kind, 'driver');
  for (const [provider, model] of [['apimart', 'wan2.7'], ['apimart', 'sora-2-vip'], ['fal', 'MiniMax-H3']]) assert.deepEqual(selectVideoVoiceReferences(provider, model, ['A'], refs), []);
});
test('Story Mini and Wan retain references and enable sound with explicit character mapping', async t => {
  const calls = capture(t);
  const storyboard = { id: '1', sceneNumber: 1, prompt: 'A speaks.', imageUrl: image, characters: ['A'], dialogue: '你好', videoDuration: 5 };
  for (const model of ['seedance-2.0-mini', 'wan3.0-video']) {
    await generateStoryboardVideo(storyboard, 'test', model, '16:9', [audio], [], undefined, true, 'zh', false, ['A']);
    const body = calls.at(-1);
    assert.deepEqual(body.audio_urls, [audio]); assert.match(body.prompt, /A = 音频 1/);
    assert.equal(body.audio ?? body.generate_audio, true);
  }
  await assert.rejects(generateStoryboardVideo(storyboard, 'test', 'wan3.0-video', '16:9', [audio], [], image, true), /不能混用/);
  assert.equal(calls.length, 2);
});

test('API Fish derivatives share 15s without replacing originals or reordering voices', () => {
  const references = Array.from({ length: 5 }, (_, i) => ({ name: `Role${i}`, url: `https://res.cloudinary.com/test/video/upload/v1/voice-ref-timbre-v3-${i}.mp3` }));
  const delivered = apiVoiceReferenceUrls(references);
  assert.equal(delivered.length, 5);
  delivered.forEach((url, i) => { assert.match(url, /upload\/du_2.94\/v1/); assert.ok(url.endsWith(`${i}.mp3`)); });
  assert.ok(references.every(ref => !ref.url.includes('du_')));
  assert.deepEqual(apiVoiceReferenceUrls([{ name: 'A', url: audio }]), [audio]);
});
