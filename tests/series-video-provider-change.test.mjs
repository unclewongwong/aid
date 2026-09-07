import assert from 'node:assert/strict';
import test from 'node:test';
import {
  enforceSeriesVideoProvider,
  mergeResumedSeriesSettings,
  resetEpisodeVideosForProviderChange,
} from '../lib/series/videoProviderChange.ts';

test('series respects explicit API choices and only normalizes fixed-provider model names', () => {
  for (const [videoProvider, videoModel, expectedModel] of [
    ['apimart', 'MiniMax-H3', 'MiniMax-H3'],
    ['apimart', 'wan3.0-video', 'wan3.0-video'],
    ['apimart', 'seedance-2.0-mini', 'seedance-2.0-mini'],
    ['apimart', 'minimax-h3', 'MiniMax-H3'],
    ['fal', 'wan3.0-video', 'minimax/h3-max/image-to-video'],
    ['comfyui', 'wan3.0-video', 'minimax-h3'],
  ]) {
    const settings = enforceSeriesVideoProvider({ videoProvider, videoModel, apiKey: 'fixture' });
    assert.equal(settings.videoProvider, videoProvider);
    assert.equal(settings.videoModel, expectedModel);
    assert.equal(settings.apiKey, 'fixture');
  }
});

test('resume replaces old forced ComfyUI with the explicit API model and retains credentials', () => {
  const settings = mergeResumedSeriesSettings({videoProvider: 'comfyui', videoModel: 'minimax-h3', apiKey: 'saved'},
    {videoProvider: 'apimart', videoModel: 'wan3.0-video', apiKey: ''});
  assert.equal(settings.videoProvider, 'apimart');
  assert.equal(settings.videoModel, 'wan3.0-video');
  assert.equal(settings.apiKey, 'saved');
});

test('resuming with a new video provider keeps sealed credentials and nested Companion settings', () => {
  const previous = {
    apiProvider: 'apimart', apiKey: '', scriptModel: 'gpt-4o', imageModel: 'gpt-image-2',
    videoModel: 'doubao-seedance-1-5-pro', videoProvider: 'apimart', dmxApiKey: 'dmx-secret',
    comfyui: { sshHost: 'gpu', sshPort: 22, sshUser: 'root', sshKeyPath: '~/.ssh/id', comfyPort: 8188, workflowRoot: '/root/ComfyUI', h3Fl2vaProfile: 'dasiwa4' },
  };
  const resumed = mergeResumedSeriesSettings(previous, {
    videoProvider: 'comfyui',
    comfyui: { timeoutSeconds: 7200 },
  }, 'server-key');
  assert.equal(resumed.videoProvider, 'comfyui');
  assert.equal(resumed.videoModel, 'minimax-h3');
  assert.equal(resumed.apiKey, 'server-key');
  assert.equal(resumed.dmxApiKey, 'dmx-secret');
  assert.equal(resumed.comfyui.sshHost, 'gpu');
  assert.equal(resumed.comfyui.timeoutSeconds, 7200);
});

test('provider change invalidates paid video artifacts while preserving images and audio', () => {
  const episode = {
    production: {
      storyboards: [{
        id: 'scene-1', sceneNumber: 1, description: 'shot', prompt: 'frame', characters: [],
        status: 'completed', imageUrl: 'https://images.test/1.webp', audioUrl: 'data:audio/test',
        videoStatus: 'completed', videoTaskId: 'task-seedance', videoUrl: 'https://videos.test/1.mp4',
        videoSourceUrl: 'https://videos.test/source.mp4', videoCacheKey: 'cache-1',
        videoSegmentId: 'segment-1', videoSegmentStoryboardIds: ['scene-1'],
        videoProviderUsed: 'apimart', videoPrompt: 'seedance prompt', videoPromptOverride: true,
      }],
    },
  };
  assert.equal(resetEpisodeVideosForProviderChange(episode), 1);
  const shot = episode.production.storyboards[0];
  assert.equal(shot.imageUrl, 'https://images.test/1.webp');
  assert.equal(shot.audioUrl, 'data:audio/test');
  assert.equal(shot.videoStatus, 'pending');
  assert.equal(shot.videoTaskId, undefined);
  assert.equal(shot.videoUrl, undefined);
  assert.equal(shot.videoProviderUsed, undefined);
  assert.equal(shot.videoPrompt, undefined);
});
