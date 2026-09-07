import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { NextRequest } from 'next/server';
import { POST } from '../app/api/companion/series/route.ts';
import { createSeries, parseOutline, parseEpisodes } from '../lib/series/domain.ts';
import { withSeriesDb, sealSettings } from '../lib/series/store.ts';
import { outlineFixture, episodeFixtures } from './fixtures/series.mjs';
import { seriesJobScope, seriesJobsConflict } from '../lib/series/concurrency.ts';
import { planAutoVideoBatches } from '../lib/autoProduction.ts';

function project() {
  const p = createSeries({ name: '并发测试', brief: '照片修复师寻找父亲', episodeCount: 3 });
  Object.assign(p, parseOutline(outlineFixture(), p));
  p.episodes = parseEpisodes(episodeFixtures(), p, 1, 3);
  p.characters.forEach(c => Object.assign(c, { locked: true, bibleUrl: 'https://test/image', voiceId: c.id, voiceReferenceUrl: 'https://test/audio' }));
  p.locations.forEach(l => { l.imageUrl = 'https://test/location'; });
  return p;
}
async function fixture(run) {
  const before = process.env.AID_COMPANION_DATA_DIR;
  const root = await mkdtemp(path.join(tmpdir(), 'aid-concurrent-'));
  process.env.AID_COMPANION_DATA_DIR = root;
  let id = 0;
  const add = async (p, kind, episodeId, assetId) => withSeriesDb(async db => {
    if (!db.projects.some(item => item.id === p.id)) db.projects.push(p);
    const job = { id: `job-${++id}`, seriesId: p.id, kind, episodeId, assetId, status: 'queued', attempts: 0, stage: '', createdAt: '', updatedAt: '', sealedSettings: await sealSettings({ apiKey: 'test' }) };
    db.jobs.push(job);
    return job.id;
  });
  const request = async body => {
    const response = await POST(new NextRequest('http://127.0.0.1:3018/api/companion/series', { method: 'POST', body: JSON.stringify(body) }));
    return { status: response.status, ...await response.json() };
  };
  const claim = async () => (await request({ action: 'claim', workerId: 'test-worker', mode: 'companion' })).claim;
  const checkpoint = (c, p = c.project) => request({ action: 'checkpoint', jobId: c.job.id, lease: c.job.lease, project: p });
  try { await run({ add, request, claim, checkpoint }); }
  finally { if (before === undefined) delete process.env.AID_COMPANION_DATA_DIR; else process.env.AID_COMPANION_DATA_DIR = before; await rm(root, { recursive: true, force: true }); }
}

test('independent projects run while another project is producing; claims cannot duplicate a job', () => fixture(async ({ add, claim }) => {
  const a = project(), b = project();
  await add(a, 'produce', a.episodes[0].id); await add(b, 'develop');
  const [first, second] = await Promise.all([claim(), claim()]);
  assert.ok(first && second); assert.notEqual(first.job.id, second.job.id);
  assert.equal(await claim(), null);
}));

test('different episodes run concurrently and interleaved checkpoints preserve both, rejecting stale writes', () => fixture(async ({ add, claim, checkpoint }) => {
  const p = project();
  await add(p, 'produce', p.episodes[0].id); await add(p, 'script', p.episodes[1].id);
  const a = await claim(), b = await claim();
  assert.ok(a && b);
  a.project.episodes[0].title = 'A1'; b.project.episodes[1].title = 'B1';
  const stale = structuredClone(a.project);
  a.project.revision = (await checkpoint(a)).revision;
  b.project.revision = (await checkpoint(b)).revision;
  a.project.episodes[0].title = 'A2';
  assert.equal((await checkpoint(a)).status, 200);
  assert.notEqual((await checkpoint(a, stale)).status, 200);
  await withSeriesDb(db => {
    assert.equal(db.projects[0].episodes[0].title, 'A2');
    assert.equal(db.projects[0].episodes[1].title, 'B1');
  });
}));

test('same episode stays exclusive and older workers retain whole-project ownership', () => fixture(async ({ add, claim }) => {
  const p = project();
  await add(p, 'produce', p.episodes[0].id); await add(p, 'script', p.episodes[0].id);
  assert.ok(await claim()); assert.equal(await claim(), null);
  await withSeriesDb(db => { delete db.jobs[0].writeScope; });
  await add(p, 'script', p.episodes[1].id);
  assert.equal(await claim(), null);
}));

test('single asset preparation runs concurrently without overwriting another asset', () => fixture(async ({ add, claim, checkpoint }) => {
  const p = project();
  await add(p, 'prepare', undefined, p.characters[0].id);
  await add(p, 'prepare', undefined, p.locations[0].id);
  const a = await claim(), b = await claim();
  assert.ok(a && b);
  a.project.characters[0].bibleUrl = 'https://test/new-character';
  b.project.locations[0].imageUrl = 'https://test/new-location';
  assert.equal((await checkpoint(a)).status, 200);
  assert.equal((await checkpoint(b)).status, 200);
  await withSeriesDb(db => {
    assert.equal(db.projects[0].characters[0].bibleUrl, 'https://test/new-character');
    assert.equal(db.projects[0].locations[0].imageUrl, 'https://test/new-location');
  });
}));

test('pending shared preparation blocks dependent production but not other projects', () => fixture(async ({ add, claim }) => {
  const p = project(), other = project();
  await add(p, 'produce', p.episodes[0].id);
  const prep = await add(p, 'prepare');
  await withSeriesDb(db => { db.jobs.find(j => j.id === prep).resumeAfter = Date.now() + 60000; });
  await add(other, 'develop');
  assert.equal((await claim()).job.seriesId, other.id);
  assert.equal(await claim(), null);
}));

test('pause and expired leases affect only their owning jobs, preserving other projects', () => fixture(async ({ add, claim, request, checkpoint }) => {
  const a = project(), b = project();
  await add(a, 'script', a.episodes[0].id); await add(b, 'script', b.episodes[0].id);
  const first = await claim(), second = await claim();
  await request({ action: 'pause', seriesId: a.id });
  const heartbeat = c => request({ action: 'heartbeat', jobId: c.job.id, lease: c.job.lease });
  assert.equal((await heartbeat(first)).continue, false);
  assert.equal((await heartbeat(second)).continue, true);
  await withSeriesDb(db => { db.jobs[0].heartbeatAt = 1; });
  await claim();
  assert.notEqual((await checkpoint(first)).status, 200);
  assert.equal((await checkpoint(second)).status, 200);
}));

test('authored projects and jobs that prepare missing shared assets retain project ownership', () => {
  const p = project(), job = { seriesId: p.id, kind: 'produce', episodeId: p.episodes[0].id };
  assert.match(seriesJobScope(job, p), /^episode:/);
  p.characters[0].locked = false;
  assert.equal(seriesJobScope(job, p), 'project');
  p.sourceMode = 'authored_screenplay';
  assert.equal(seriesJobScope(job, p), 'project');
  assert.equal(seriesJobsConflict(job, 'episode:e1', { seriesId: 'another', writeScope: 'project' }), false);
});

test('API groups start together while previous-tail references keep their dependency boundary', () => {
  const groups = Array.from({ length: 5 }, (_, i) => [{ id: String(i) }]);
  assert.equal(planAutoVideoBatches(groups, groups.length).length, 1);
  assert.deepEqual(planAutoVideoBatches(groups, 2).map(b => b.length), [2, 2, 1]);
  groups[2][0].videoStartMode = 'previous-segment-tail';
  assert.deepEqual(planAutoVideoBatches(groups, groups.length).map(b => b.length), [2, 1, 2]);
});

test('worker claims again before the first API finishes and keeps pause signals independent', async () => {
  const { readFile } = await import('node:fs/promises');
  const ts = (await import('typescript')).default;
  const { runInNewContext } = await import('node:vm');
  const effects = [], ticks = [], heartbeats = [], executions = [], finished = [];
  const claims = ['first', 'second'].map(id => ({ job: { id, lease: id } }));
  const request = async body => {
    if (body.action === 'claim') return { claim: claims.shift() || null };
    if (body.action === 'heartbeat') return { continue: body.jobId !== 'first' };
    if (body.action === 'finish') finished.push(body);
    return {};
  };
  const execute = (claim, signal) => new Promise((resolve, reject) => {
    executions.push({ id: claim.job.id, signal, resolve });
    signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true });
  });
  const source = await readFile(new URL('../app/series/worker/page.tsx', import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const exports = {};
  runInNewContext(compiled, {
    exports, require: name => {
      if (name === 'react') return { useEffect: effect => effects.push(effect), useState: () => ['', () => {}] };
      if (name === 'react/jsx-runtime') return { jsx: () => null, jsxs: () => null };
      if (name.endsWith('/runner')) return { seriesRequest: request, executeSeriesClaim: execute };
      if (name.endsWith('/apiResponse')) return { ApiResponseError: Error };
      throw new Error(name);
    },
    AbortController, AbortSignal, URLSearchParams, crypto: { randomUUID: () => 'test' },
    window: { location: { search: '?mode=companion' } },
    setTimeout: fn => { ticks.push(fn); return ticks.length; }, clearTimeout: () => {},
    setInterval: fn => { heartbeats.push(fn); return heartbeats.length; }, clearInterval: () => {},
  });
  exports.default();
  const stop = effects[0]();
  const flush = () => new Promise(resolve => setImmediate(resolve));
  await flush();
  assert.equal(executions.length, 1);
  assert.equal(ticks.length, 1, 'polling must continue while execution remains pending');
  await ticks.shift()(); await flush();
  assert.equal(executions.length, 2);
  await heartbeats[0](); await flush();
  assert.equal(executions[0].signal.aborted, true);
  assert.equal(executions[1].signal.aborted, false);
  assert.equal(finished[0].paused, true);
  stop(); await flush();
  assert.equal(executions[1].signal.reason, 'worker-unmounted');
  assert.equal(finished[1].interrupted, true);
});
