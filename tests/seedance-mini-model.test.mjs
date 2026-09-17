import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_SEEDANCE_MINI_REFERENCE_IMAGES,
  normalizeVideoModel,
  SEEDANCE_MINI,
  validateSeedanceMiniReferences,
} from '../lib/videoModels.ts';

test('retired Seedance model names migrate to APIMart Mini', () => {
  for (const model of [
    'seedance-2.0-fast',
    'doubao-seedance-2.0-fast',
    'doubao-seedance-2.0',
    'doubao-seedance-1-5-pro',
    SEEDANCE_MINI,
  ]) {
    assert.equal(normalizeVideoModel(model), SEEDANCE_MINI);
  }
});

test('unrelated video models remain unchanged', () => {
  assert.equal(normalizeVideoModel('MiniMax-H3'), 'MiniMax-H3');
  assert.equal(normalizeVideoModel('wan2.7'), 'wan2.7');
});

test('Seedance Mini accepts up to nine reference images', () => {
  assert.equal(MAX_SEEDANCE_MINI_REFERENCE_IMAGES, 9);
  assert.equal(validateSeedanceMiniReferences({ imageCount: 9, hasImageRoles: false }), null);
  assert.match(
    validateSeedanceMiniReferences({ imageCount: 10, hasImageRoles: false }),
    /最多支持 9 张参考图/,
  );
});

test('Seedance Mini keeps first/last frames separate from audio and video references', () => {
  assert.equal(validateSeedanceMiniReferences({ imageCount: 2, hasImageRoles: true }), null);
  assert.match(
    validateSeedanceMiniReferences({ imageCount: 2, hasImageRoles: true, audioCount: 1 }),
    /不能同时使用参考视频或参考音频/,
  );
  assert.match(
    validateSeedanceMiniReferences({ imageCount: 2, hasImageRoles: true, videoCount: 1 }),
    /不能同时使用参考视频或参考音频/,
  );
});
