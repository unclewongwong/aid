import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { NextRequest } from 'next/server';
import { POST, GET } from '../app/api/companion/series/route.ts';
import { createSeries, parseOutline, parseEpisodes } from '../lib/series/domain.ts';
import { withSeriesDb, openSettings } from '../lib/series/store.ts';
import { outlineFixture, episodeFixtures } from './fixtures/series.mjs';

const settings = { apiKey: 'fixture-key', fishAudioKey: 'fixture-fish', imageModel: 'fixture-image', videoProvider: 'apimart', videoModel: 'seedance-2.0-mini' };
test('enqueue, claim, resume, retry and paused episode Produce retain the chosen model without discarding paid media', async () => {
  const before = process.env.AID_COMPANION_DATA_DIR;
  const root = await mkdtemp(path.join(tmpdir(), 'aid-video-selection-'));
  process.env.AID_COMPANION_DATA_DIR = root;
  const request = async body => {
    const response = await POST(new NextRequest('http://127.0.0.1:3018/api/companion/series', { method: 'POST', body: JSON.stringify(body) }));
    const data = await response.json();
    assert.equal(response.status, 200, JSON.stringify(data));
    return data;
  };
  try {
    const p = createSeries({ name: '模型路由测试', brief: '照片修复师寻找父亲', episodeCount: 3 });
    Object.assign(p, parseOutline(outlineFixture(), p));
    p.episodes = parseEpisodes(episodeFixtures(), p, 1, 3);
    p.characters.forEach(c => Object.assign(c, { locked: true, bibleUrl: 'https://test/image', voiceId: c.id, voiceReferenceUrl: 'https://test/audio' }));
    p.locations.forEach(l => { l.imageUrl = 'https://test/location'; });
    await withSeriesDb(db => { db.projects.push(p); });
    await request({ action: 'enqueue', seriesId: p.id, kind: 'produce', episodeIds: [p.episodes[0].id], settings });
    const claim = (await request({ action: 'claim', workerId: 'fixture-worker', mode: 'companion' })).claim;
    assert.equal(claim.settings.videoProvider, 'apimart');
    assert.equal(claim.settings.videoModel, 'seedance-2.0-mini');
    const jobId = claim.job.id;
    const paidShot = { id: 'paid', videoTaskId: 'comfyui-paid', videoProviderUsed: 'comfyui', videoStatus: 'generating', imageUrl: 'https://test/frame' };
    const pauseFixture = async status => withSeriesDb(db => {
      db.jobs.find(j => j.id === jobId).status = status;
      db.projects[0].paused = true;
      db.projects[0].episodes[0].production = { storyboards: [paidShot] };
    });
    const assertState = async model => withSeriesDb(async db => {
      const j = db.jobs.find(j => j.id === jobId);
      const sealed = await openSettings(j.sealedSettings);
      assert.equal(sealed.videoModel, model);
      assert.equal(sealed.apiKey, 'fixture-key');
      assert.equal(sealed.videoProvider, 'apimart');
      assert.deepEqual(j.videoSelection, { videoProvider: 'apimart', videoModel: model });
      assert.deepEqual(db.projects[0].episodes[0].production.storyboards, [paidShot]);
    });
    await pauseFixture('paused');
    await request({ action: 'resume', seriesId: p.id, settings: { videoProvider: 'apimart', videoModel: 'wan3.0-video', apiKey: '' } });
    await assertState('wan3.0-video');
    await pauseFixture('failed');
    await request({ action: 'retry', jobId, settings: { videoProvider: 'apimart', videoModel: 'MiniMax-H3', apiKey: '' } });
    await assertState('MiniMax-H3');
    await pauseFixture('paused');
    const resumed = await request({ action: 'enqueue', seriesId: p.id, kind: 'produce', episodeIds: [p.episodes[0].id], settings });
    assert.equal(resumed.added, 1);
    await assertState('seedance-2.0-mini');
    await withSeriesDb(db => { assert.equal(db.jobs.length, 1); assert.equal(db.jobs[0].status, 'queued'); });
    const snapshot = await (await GET(new NextRequest('http://127.0.0.1:3018/api/companion/series'))).json();
    assert.equal(snapshot.jobs[0].videoSelection.videoProvider, 'apimart');
    assert.equal(snapshot.jobs[0].sealedSettings, undefined);
    assert.equal(JSON.stringify(snapshot).includes('fixture-key'), false);
  } finally {
    if (before === undefined) delete process.env.AID_COMPANION_DATA_DIR; else process.env.AID_COMPANION_DATA_DIR = before;
    await rm(root, { recursive: true, force: true });
  }
});
