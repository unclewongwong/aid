import test from 'node:test';
import assert from 'node:assert/strict';
import { recoverCompletedVideoForExport } from '../lib/videoExportRecovery.ts';

test('six completed API clips export even when shot five has no task receipt', async () => {
  const boards = Array.from({ length: 6 }, (_, i) => ({ id: `scene-${i + 1}`, sceneNumber: i + 1, videoStatus: 'completed', videoUrl: `https://example.com/${i + 1}.mp4`, videoTaskId: i === 4 ? undefined : `task-${i + 1}` }));
  const deps = { cached: async () => assert.fail('existing URLs need no cache or generation'), download: async () => assert.fail('must not regenerate') };
  assert.deepEqual(await Promise.all(boards.map(b => recoverCompletedVideoForExport(b, deps))), boards);
});

test('completed clip without a receipt can recover from its persisted URL or cache', async () => {
  const board = { id: 'scene-5', sceneNumber: 5, videoStatus: 'completed', videoSourceUrl: 'https://example.com/paid.mp4', videoCacheKey: 'existing-key' };
  assert.equal((await recoverCompletedVideoForExport(board, { cached: async () => undefined })).videoUrl, board.videoSourceUrl);
  assert.equal((await recoverCompletedVideoForExport(board, { cached: async () => 'blob:cached' })).videoUrl, 'blob:cached');
});

test('receipt alone and incomplete tasks cannot be exported as a finished clip', async () => {
  await assert.rejects(recoverCompletedVideoForExport({ sceneNumber: 5, videoStatus: 'generating', videoTaskId: 'task-5' }, { cached: async () => undefined }), /尚未完成/);
  await assert.rejects(recoverCompletedVideoForExport({ sceneNumber: 5, videoStatus: 'completed', videoTaskId: 'task-5' }, { cached: async () => undefined }), /无法恢复/);
});
