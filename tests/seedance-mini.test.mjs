import test from 'node:test';
import assert from 'node:assert/strict';
import axios from 'axios';
import { createVideoTask, getVideoTaskStatus, snapDurationToModel } from '../lib/apimart.ts';
import { normalizeVideoModel, SEEDANCE_MINI } from '../lib/videoModels.ts';

const image = 'https://example.com/first.png';
const audio = 'https://example.com/voice.wav';
const video = 'https://example.com/reference.mp4';

function capture(t) {
  const calls = [];
  t.mock.method(axios, 'post', async (url, body, config) => {
    calls.push({ url, body, config });
    return { data: { code: 200, data: [{ status: 'submitted', task_id: 'mini-task' }] } };
  });
  t.mock.method(console, 'log', () => {});
  t.mock.method(console, 'error', () => {});
  return calls;
}

test('retired Seedance selections migrate; unrelated models remain unchanged', () => {
  for (const model of ['seedance-2.0', 'seedance-2.0-fast', 'doubao-seedance-2.0', 'doubao-seedance-2.0-fast', 'seedance-2-0', 'doubao-seedance-1-5-pro', SEEDANCE_MINI]) {
    assert.equal(normalizeVideoModel(model), SEEDANCE_MINI);
  }
  for (const model of ['MiniMax-H3', 'wan2.7', 'sora-2-vip']) assert.equal(normalizeVideoModel(model), model);
});

test('Mini submits documented text-to-video defaults and retains task ID', async t => {
  const calls = capture(t);
  assert.equal(await createVideoTask('A cat walks.', [], 'test-key', SEEDANCE_MINI, '9:16'), 'mini-task');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://api.apimart.ai/v1/videos/generations');
  assert.equal(calls[0].config.headers.Authorization, 'Bearer test-key');
  assert.deepEqual(calls[0].body, { model: SEEDANCE_MINI, prompt: 'A cat walks.', duration: 5, size: '9:16', resolution: '720p', generate_audio: true });
});

test('stale API requests use Mini and retain long prompts without truncation', async t => {
  const calls = capture(t);
  const prompt = '剧情与逐字台词。'.repeat(800);
  await createVideoTask(prompt, [image], 'test-key', 'doubao-seedance-2.0-fast', '1:1', { duration: 22, quality: '480p', generateAudio: false });
  assert.equal(calls[0].body.model, SEEDANCE_MINI);
  assert.equal(calls[0].body.prompt, prompt);
  assert.equal(calls[0].body.duration, 15);
  assert.equal(calls[0].body.resolution, '480p');
  assert.equal(calls[0].body.generate_audio, false);
  assert.deepEqual(calls[0].body.image_urls, [image]);
});

test('Mini keeps voice references even when audio generation is enabled', async t => {
  const calls = capture(t);
  await createVideoTask('Speak.', [image], 'test-key', SEEDANCE_MINI, '16:9', { duration: 4, generateAudio: true, audioUrls: [audio], videoUrls: [video] });
  assert.deepEqual(calls[0].body.audio_urls, [audio]);
  assert.deepEqual(calls[0].body.video_urls, [video]);
  assert.equal(calls[0].body.generate_audio, true);
});

test('Mini first/last frames exclude image_urls', async t => {
  const calls = capture(t);
  const imageRoles = [{ url: image, role: 'first_frame' }, { url: 'https://example.com/end.png', role: 'last_frame' }];
  await createVideoTask('Move.', [image], 'test-key', SEEDANCE_MINI, '16:9', { imageRoles });
  assert.deepEqual(calls[0].body.image_with_roles, imageRoles);
  assert.equal('image_urls' in calls[0].body, false);
});

test('invalid Mini combinations fail before any billable submission', async t => {
  const calls = capture(t);
  const roles = [{ url: image, role: 'first_frame' }];
  for (const [images, options, message] of [
    [[image], { imageRoles: roles, audioUrls: [audio] }, /首尾帧/],
    [[image], { imageRoles: roles, videoUrls: [video] }, /首尾帧/],
    [[], { audioUrls: [audio] }, /一起使用/],
    [[image], { resolution: '1080P' }, /480p 或 720p/],
    [[image], { duration: NaN }, /有效秒数/],
    [Array(10).fill(image), {}, /9 张/],
    [[image], { audioUrls: Array(4).fill(audio) }, /3 个/],
    [[image], { videoUrls: Array(4).fill(video) }, /3 个/],
  ]) await assert.rejects(createVideoTask('Move.', images, 'test-key', SEEDANCE_MINI, '16:9', options), message);
  assert.equal(calls.length, 0);
});

test('Mini duration is an integer in the documented range', () => {
  for (const [input, expected] of [[1, 4], [4, 4], [4.2, 5], [15, 15], [30, 15]]) {
    assert.equal(snapDurationToModel(input, SEEDANCE_MINI), expected);
  }
});

test('Mini reuses task polling without creating another generation', async t => {
  const calls = capture(t);
  const result = { status: 'completed', result: { videos: [{ url: ['https://example.com/result.mp4'] }] } };
  t.mock.method(axios, 'get', async (url, config) => {
    assert.equal(url, 'https://api.apimart.ai/v1/tasks/mini-task');
    assert.equal(config.headers.Authorization, 'Bearer test-key');
    return { data: { code: 200, data: result } };
  });
  assert.deepEqual(await getVideoTaskStatus('mini-task', 'test-key'), result);
  assert.equal(calls.length, 0);
});
