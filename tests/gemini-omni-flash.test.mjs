import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GEMINI_OMNI_1_1_FLASH,
  MAX_GEMINI_OMNI_REFERENCE_IMAGES,
  normalizeGeminiOmniResolution,
  validateGeminiOmniInputs,
  videoModelAcceptsExplicitDuration,
} from '../lib/videoModels.ts';

test('Gemini Omni 1.1 Flash uses the documented model name and image limit', () => {
  assert.equal(GEMINI_OMNI_1_1_FLASH, 'gemini-omni-1.1-flash');
  assert.equal(MAX_GEMINI_OMNI_REFERENCE_IMAGES, 10);
  assert.equal(validateGeminiOmniInputs({ imageCount: 10 }), null);
  assert.match(validateGeminiOmniInputs({ imageCount: 11 }), /最多支持 10 张图片/);
});

test('Gemini Omni validates video and audio references before submission', () => {
  assert.equal(validateGeminiOmniInputs({ imageCount: 2, videoCount: 1 }), null);
  assert.match(validateGeminiOmniInputs({ imageCount: 1, videoCount: 2 }), /最多支持 1 条参考视频/);
  assert.match(validateGeminiOmniInputs({ imageCount: 1, audioCount: 1 }), /不支持上传参考音频/);
});

test('Gemini Omni normalizes resolution and never sends an explicit duration', () => {
  assert.equal(normalizeGeminiOmniResolution('360P'), '360p');
  assert.equal(normalizeGeminiOmniResolution('2160p'), '4k');
  assert.equal(normalizeGeminiOmniResolution('invalid'), '720p');
  assert.equal(videoModelAcceptsExplicitDuration(GEMINI_OMNI_1_1_FLASH), false);
  assert.equal(videoModelAcceptsExplicitDuration('seedance-2.0-mini'), true);
});
