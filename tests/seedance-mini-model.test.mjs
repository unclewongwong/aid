import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeVideoModel, SEEDANCE_MINI } from '../lib/videoModels.ts';

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
