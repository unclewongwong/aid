import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createSeries, parseOutline } from '../lib/series/domain.ts';
import { normalizeSingleEpisodeOutline } from '../lib/series/outlineSchedule.ts';
import { seriesPrompt, legacySeriesPrompt } from '../lib/series/prompts.ts';
import { generateSeriesStage } from '../lib/series/generation.ts';
import { createSeriesGenerationCache, migrateSeriesOutlineCache } from '../lib/series/generationCache.ts';
import { outlineFixture } from './fixtures/series.mjs';

const brief = '大唐长安深秋，五十二岁的裴慎之请沈七估价白玉杯。买价八百贯，估价五贯，碎后才知完整值一千二百贯。二十年的执念终于放下。';
function project(count = 1) { return createSeries({ name: '五贯', brief, episodeCount: count }); }
function badOutline() {
  const raw = outlineFixture();
  raw.bible.arcs = [
    { start: 1, end: 4, goal: '估价白玉杯', reversal: '只值五贯' },
    { start: 5, end: 8, goal: '维护旧日体面', reversal: '发现自己不懂玉' },
    { start: 9, end: 12, goal: '争夺杯子', reversal: '杯子摔碎' },
    { start: 13, end: 16, goal: '放下身份执念', reversal: '得知老玉价值仍决定放手' },
  ];
  raw.bible.promises = [{ question: '杯子价值几何', plantedIn: 2, payoffIn: 14, answer: '完整品一千二百贯，但不再用价格证明自己' }];
  return raw;
}

test('configured count wins over any episode or numeric wording in source', () => {
  for (const count of [1, 2, 12, 100]) {
    assert.equal(createSeries({ name: '设置权威', brief: brief + '第16集，全季共20集。', episodeCount: count }).episodeCount, count);
  }
});

test('single episode recovers the real 16-shot range pattern while preserving story text', () => {
  const raw = badOutline();
  const before = structuredClone(raw);
  const result = parseOutline(raw, project());
  assert.deepEqual(result.bible.arcs, [{ start: 1, end: 1, goal: before.bible.arcs.map(a => a.goal).join('\n'), reversal: before.bible.arcs.map(a => a.reversal).join('\n') }]);
  assert.equal(result.bible.promises[0].plantedIn, 1);
  assert.equal(result.bible.promises[0].payoffIn, 1);
  assert.equal(result.bible.promises[0].answer, before.bible.promises[0].answer);
  assert.equal(result.bible.ending, before.bible.ending);
  assert.deepEqual(raw, before);
});

test('one-episode normalization is idempotent and does not fabricate missing story', () => {
  const raw = normalizeSingleEpisodeOutline(badOutline(), 1);
  assert.deepEqual(normalizeSingleEpisodeOutline(raw, 1), raw);
  raw.bible.arcs[0].goal = '';
  assert.throws(() => parseOutline(raw, project()), /阶段目标/);
});

test('outline JSON example and instructions use the selected count, including one and two', () => {
  for (const count of [1, 2, 12, 100]) {
    const prompt = seriesPrompt('outline', project(count));
    const schema = JSON.parse(prompt.split('格式：')[1].split('\n')[0]);
    assert.equal(schema.bible.arcs[0].end, count);
    assert.equal(schema.bible.promises[0].payoffIn, count);
    assert.ok(prompt.includes(`episodeCount=${count}`));
    assert.match(prompt, /全部是集号，不是镜号/);
  }
});

test('invalid multi-episode ranges identify configured count and actual range for repair', () => {
  const raw = badOutline();
  assert.throws(() => parseOutline(raw, project(2)), /共2集.*实际为1–4.*集号，不是镜号/);
  assert.deepEqual(normalizeSingleEpisodeOutline(raw, 2), raw);
});

test('cached invalid one-episode outline succeeds without any model call or episode rewrite', async () => {
  const p = project();
  p.episodes = [{ id: 'ep-1', number: 1, synopsis: '已保存正文' }];
  const before = structuredClone(p.episodes);
  const result = await generateSeriesStage('outline', p, undefined, {
    read: async () => JSON.stringify(badOutline()),
    chat: async () => { throw new Error('must not buy another repair'); },
  });
  assert.equal(result.bible.arcs[0].end, 1);
  assert.deepEqual(p.episodes, before);
});

test('new response with wrong ranges is accepted locally after exactly one call', async () => {
  let calls = 0;
  let saved;
  const result = await generateSeriesStage('outline', project(), undefined, {
    chat: async () => { calls++; return JSON.stringify(badOutline()); },
    save: async raw => { saved = raw; },
  });
  assert.equal(calls, 1);
  assert.equal(result.bible.arcs.length, 1);
  assert.deepEqual(JSON.parse(saved), badOutline());
});

test('new prompt recovers exact legacy cache without overwriting the original', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'aid-outline-cache-'));
  try {
    const oldKey = 'a'.repeat(64), key = 'b'.repeat(64);
    const legacy = createSeriesGenerationCache(root, oldKey);
    const raw = JSON.stringify(badOutline());
    await legacy.save(raw);
    await legacy.saveState({ version: 1, responses: [] });
    const migrated = await migrateSeriesOutlineCache(root, key, oldKey);
    const result = await generateSeriesStage('outline', project(), undefined, { ...migrated, chat: async () => { throw new Error('duplicate purchase'); } });
    assert.equal(result.bible.arcs[0].end, 1);
    assert.equal(await legacy.read(), raw);
    await migrated.save('newer draft');
    assert.equal(await (await migrateSeriesOutlineCache(root, key, oldKey)).read(), 'newer draft');
    assert.notEqual(seriesPrompt('outline', project()), legacySeriesPrompt('outline', project()));
  } finally { await rm(root, { recursive: true, force: true }); }
});
