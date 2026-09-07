// Browser smoke uses an isolated profile and mocks every API: no paid requests.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';
import { createSeries, parseOutline, parseEpisodes } from '../lib/series/domain.ts';
import { outlineFixture, episodeFixtures, shotFixture } from './fixtures/series.mjs';
const require = createRequire(import.meta.url);
const { chromium } = require(require.resolve('playwright', { paths: [process.env.AID_TEST_NODE_MODULES || '/tmp/aid-ui-tools'] }));
const base = process.env.AID_TEST_URL || 'http://127.0.0.1:3039';
const p = createSeries({ name: '侯府 · 模型选择预览', brief: '虚构界面测试', episodeCount: 3 });
Object.assign(p, parseOutline(outlineFixture(), p));
p.episodes = parseEpisodes(episodeFixtures(), p, 1, 3);
p.episodes.forEach(e => { e.script = [shotFixture()]; });
const settings = { apiKey: 'fixture', fishAudioKey: 'fixture', imageModel: 'gpt-image-2', scriptModel: 'gpt-5.6-luna', videoProvider: 'apimart', videoModel: 'seedance-2.0-mini', comfyui: { localCompanionUrl: base } };
const browser = await chromium.launch({ headless: true, channel: 'chrome' });
try {
  const page = await browser.newPage({ viewport: { width: 1500, height: 1000 } });
  const errors = [], submitted = [];
  let modelSupport = true;
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/api/**', async route => {
    const url = new URL(route.request().url());
    if (url.pathname === '/api/companion/series') {
      if (route.request().method() === 'GET') return route.fulfill({ json: { projects: [p], jobs: [], workerOnline: true } });
      const body = route.request().postDataJSON();
      if (body.action === 'claim') return route.fulfill({ json: { claim: null } });
      if (body.action === 'enqueue') submitted.push(body);
      return route.fulfill({ json: { added: 1 } });
    }
    if (url.pathname === '/api/companion/status') return route.fulfill({ json: {
      seriesSingleShotImages: true, seriesVideoModelSelection: modelSupport, seriesAssetScriptReconciliation: true, storySingleImageShots: true,
      seriesObjectEvidenceRepair: true, h3DasiwaCheckpointPair: true, seriesDialogueTimingRepair: true,
    } });
    return route.fulfill({ json: {} });
  });
  await page.addInitScript(({settings}) => {
    if (!sessionStorage.getItem('aid-test-unconfigured') && !localStorage.getItem('appSettings')) localStorage.setItem('appSettings', JSON.stringify(settings));
    if (!localStorage.getItem('aid:current-project:v2')) localStorage.setItem('aid:current-project:v2', JSON.stringify({ id: 'story-fixture', name: 'Story模型测试', characters: [], storyContent: '虚构测试故事', storyOutline: '', storyboards: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }));
  }, {settings});
  await page.goto(`${base}/series`);
  await page.getByRole('button', { name: '分集故事', exact: true }).click();
  const choice = page.getByRole('combobox', { name: '成片视频模型' }).last();
  await choice.selectOption('apimart:wan3.0-video');
  await page.getByRole('button', { name: '成片', exact: true }).last().click();
  await page.waitForFunction(() => document.body.textContent.includes('已加入队列'));
  assert.equal(submitted.at(-1).settings.videoProvider, 'apimart');
  assert.equal(submitted.at(-1).settings.videoModel, 'wan3.0-video');
  await mkdir('out/verification/video-model-selection', { recursive: true });
  await page.screenshot({ path: 'out/verification/video-model-selection/series.png', fullPage: true });
  await page.reload();
  await page.getByRole('button', { name: '分集故事', exact: true }).click();
  assert.equal(await page.getByRole('combobox', { name: '成片视频模型' }).last().inputValue(), 'apimart:wan3.0-video');
  const before = submitted.length;
  modelSupport = false;
  await page.getByRole('button', { name: '成片', exact: true }).last().click();
  await page.getByText('请更新 Companion 后再开始制作，旧版会覆盖所选视频模型。', { exact: true }).waitFor();
  assert.equal(submitted.length, before);
  await page.goto(`${base}/story`);
  const storyChoice = page.getByRole('combobox', { name: '成片视频模型' });
  await storyChoice.selectOption('fal:minimax/h3-max/image-to-video');
  await page.reload();
  await storyChoice.waitFor();
  await page.waitForFunction(() => document.querySelector('[aria-label="成片视频模型"]').value === 'fal:minimax/h3-max/image-to-video');
  const defaults = await page.evaluate(() => JSON.parse(localStorage.getItem('appSettings')));
  assert.equal(defaults.videoProvider, 'apimart');
  assert.equal(defaults.videoModel, 'seedance-2.0-mini');
  await page.screenshot({ path: 'out/verification/video-model-selection/story.png', fullPage: true });
  await page.evaluate(() => { sessionStorage.setItem('aid-test-unconfigured', '1'); localStorage.removeItem('appSettings'); });
  await page.goto(`${base}/series`);
  await page.getByRole('button', {name:'确认模型设置',exact:true}).waitFor();
  const noConfigSubmissions = submitted.length;
  await page.getByRole('button', {name:'一键成片',exact:true}).click();
  await page.getByRole('heading', {name:'AID 设置',exact:true}).waitFor();
  assert.equal(submitted.length,noConfigSubmissions);
  await page.goto(`${base}/story`);
  await page.getByRole('alert').filter({hasText:'不会使用初始默认值开始制作'}).waitFor();
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button',{name:'✨ 一键成片',exact:true}).click();
  await page.getByRole('heading',{name:'AID 设置',exact:true}).waitFor();
  assert.equal(submitted.length,noConfigSubmissions);
  assert.deepEqual(errors, []);
  console.log('PASS: toolbar selection reaches API request, survives reload, guards old Companion; Story choice is isolated from Series and defaults; fresh browsers cannot submit default generation settings.');
} finally { await browser.close(); }
