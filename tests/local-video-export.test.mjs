import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const execFileAsync = promisify(execFile);

test('Companion persists, reuses, retries and natively merges local clips', { timeout: 120_000 }, async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'aid-local-export-test-'));
  const ffmpeg = require('ffmpeg-static');
  const ffprobe = require('ffprobe-static').path;
  process.env.AID_COMPANION_DATA_DIR = temporary;
  process.env.FFMPEG_PATH = ffmpeg;
  process.env.FFPROBE_PATH = ffprobe;

  try {
    const sourceFiles = [path.join(temporary, 'red.mp4'), path.join(temporary, 'blue.mp4')];
    await execFileAsync(ffmpeg, [
      '-y', '-f', 'lavfi', '-i', 'color=c=red:s=320x180:d=0.7:r=24',
      '-f', 'lavfi', '-i', 'sine=frequency=440:duration=0.7',
      '-shortest', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', sourceFiles[0],
    ]);
    await execFileAsync(ffmpeg, [
      '-y', '-f', 'lavfi', '-i', 'color=c=blue:s=180x320:d=1.7:r=24',
      '-c:v', 'libx264', '-pix_fmt', 'yuv420p', sourceFiles[1],
    ]);

    const server = await import('../lib/companionVideoExportServer.ts');
    const projectId = 'recoverable-project';
    const clips = [];
    for (let index = 0; index < sourceFiles.length; index += 1) {
      const bytes = await readFile(sourceFiles[index]);
      const sha256 = createHash('sha256').update(bytes).digest('hex');
      const makeRequest = () => new Request('http://127.0.0.1/segment', {
        method: 'POST',
        headers: { 'Content-Type': 'video/mp4' },
        body: bytes,
      });
      const first = await server.persistExportSegment(makeRequest(), projectId, `clip-${index}`, sha256);
      const reused = await server.persistExportSegment(makeRequest(), projectId, `clip-${index}`, sha256);
      assert.equal(first.reused, false);
      assert.equal(reused.reused, true);
      clips.push({
        clipId: `clip-${index}`,
        name: `Clip ${index}`,
        duration: index === 0 ? 0.7 : 1.7,
        trimStart: index === 1 ? 0.05 : 0,
        trimEnd: 0,
        pacingSections: index === 0 ? [
          { sourceStart: 0, sourceEnd: 0.35, rate: 1, kind: 'emotion', reason: 'protect emotion' },
          { sourceStart: 0.35, sourceEnd: 0.7, rate: 1.25, kind: 'action', reason: 'accelerate action' },
        ] : [
          { sourceStart: 0, sourceEnd: 1.7, rate: 1.2, kind: 'narrative', reason: 'accelerate narrative' },
        ],
        segmentSha256: sha256,
      });
    }

    const created = await server.createOrResumeExportJob(projectId, clips, 'recovered-film.mp4', '9:16');
    const statusRoute = await import(new URL('../lib/companionVideoExportServer.ts?route=status', import.meta.url).href);
    assert.notEqual(statusRoute.ensureExportJobRunning, server.ensureExportJobRunning);
    let job = created;
    const deadline = Date.now() + 90_000;
    while (job.status !== 'completed' && job.status !== 'failed' && Date.now() < deadline) {
      await new Promise(resolve => setTimeout(resolve, 250));
      job = await statusRoute.recoverExportJob(projectId, created.jobId);
    }
    assert.equal(job.status, 'completed', job.error);
    assert.equal(job.progress, 100);
    const download = await server.exportDownloadInfo(projectId, created.jobId);
    assert.ok((await stat(download.filePath)).size > 0);
    const normalizedDirectory = path.join(
      temporary,
      'video-exports',
      server.safeStorageId(projectId),
      'jobs',
      server.safeStorageId(created.jobId),
      'normalized',
    );
    const normalizedDurations = [];
    for (const fileName of ['000.mp4', '001.mp4']) {
      const { stdout } = await execFileAsync(ffprobe, [
        '-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', path.join(normalizedDirectory, fileName),
      ]);
      normalizedDurations.push(Number(stdout.trim()));
    }
    assert.ok(normalizedDurations[0] > 0.55 && normalizedDurations[0] < 0.7, `unexpected first paced clip duration ${normalizedDurations[0]}`);
    // 0.65 / 1.2 + 1 protected second; the preceding clip remains accelerated.
    assert.ok(normalizedDurations[1] > 1.5 && normalizedDurations[1] < 1.62, `unexpected second paced clip duration ${normalizedDurations[1]}`);
    const { stdout: dimensions } = await execFileAsync(ffprobe, [
      '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', download.filePath,
    ]);
    const [width, height] = dimensions.trim().split(',').map(Number);
    assert.ok(height > width, `expected portrait export, received ${width}x${height}`);
    const { stdout: outputDurationText } = await execFileAsync(ffprobe, [
      '-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', download.filePath,
    ]);
    const outputDuration = Number(outputDurationText.trim());
    assert.ok(outputDuration > 2.1 && outputDuration < 2.3, `expected paced output with a protected ending near 2.17s, received ${outputDuration}s`);
    await execFileAsync(ffmpeg, ['-v', 'error', '-xerror', '-i', download.filePath, '-f', 'null', '-']);

    const resumed = await server.createOrResumeExportJob(projectId, clips, 'recovered-film.mp4', '9:16');
    assert.equal(resumed.status, 'completed');
    assert.equal(resumed.jobId, created.jobId);

    // Reproduce a cached MP4 with valid metadata but damaged compressed data,
    // plus a short yet playable final output. Neither may be accepted as done.
    const damagedPath = path.join(normalizedDirectory, '000.mp4');
    const damaged = Buffer.from(await readFile(damagedPath));
    for (let offset = 0; offset + 8 < damaged.length;) {
      const size = damaged.readUInt32BE(offset);
      if (size < 8) break;
      if (damaged.toString('ascii', offset + 4, offset + 8) === 'mdat') {
        damaged.fill(0, offset + 8, Math.min(offset + size, offset + 2048));
        break;
      }
      offset += size;
    }
    const untouchedPath = path.join(normalizedDirectory, '001.mp4');
    const untouchedMtime = (await stat(untouchedPath)).mtimeMs;
    await writeFile(damagedPath, damaged);
    await writeFile(download.filePath, await readFile(untouchedPath));
    await server.createOrResumeExportJob(projectId, clips, 'recovered-film.mp4', '9:16');
    do {
      await new Promise(resolve => setTimeout(resolve, 100));
      job = await statusRoute.recoverExportJob(projectId, created.jobId);
    } while (!['completed', 'failed'].includes(job.status) && Date.now() < deadline);
    assert.equal(job.status, 'completed', job.error);
    assert.equal((await stat(untouchedPath)).mtimeMs, untouchedMtime, 'valid normalized clip must be reused');
    await execFileAsync(ffmpeg, ['-v', 'error', '-xerror', '-i', download.filePath, '-f', 'null', '-']);
    const repaired = await server.probeMedia(download.filePath);
    assert.ok(repaired.duration > 2.1 && repaired.duration < 2.3);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});

test('six API clips with audio longer than video preserve their planned export duration', { timeout: 120_000 }, async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'aid-api-export-test-'));
  const ffmpeg = require('ffmpeg-static');
  process.env.AID_COMPANION_DATA_DIR = temporary;
  process.env.FFMPEG_PATH = ffmpeg;
  process.env.FFPROBE_PATH = require('ffprobe-static').path;
  try {
    const source = path.join(temporary, 'api.mp4');
    await execFileAsync(ffmpeg, [
      '-y', '-f', 'lavfi', '-i', 'color=c=blue:s=180x320:d=15.041667:r=24',
      '-f', 'lavfi', '-i', 'sine=frequency=440:duration=15.104',
      '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', source,
    ]);
    const server = await import('../lib/companionVideoExportServer.ts');
    const { withFilmEndingPacing, clippedPacingSections } = await import('../lib/videoPacing.ts');
    const bytes = await readFile(source);
    const sha = createHash('sha256').update(bytes).digest('hex');
    const duration = (await server.probeMedia(source)).duration;
    const projectId = 'six-api-clips';
    const clips = [];
    for (let i = 0; i < 6; i++) {
      await server.persistExportSegment(new Request('http://localhost/segment', { method: 'POST', body: bytes }), projectId, `clip-${i}`, sha);
      clips.push({ clipId: `clip-${i}`, name: `Scene ${i+1}`, duration, trimStart: 0, trimEnd: 0, segmentSha256: sha,
        pacingSections: [{ sourceStart: 0, sourceEnd: duration, rate: 1.08, kind: 'dialogue', reason: 'dialogue' }] });
    }
    const expected = withFilmEndingPacing(clips).reduce((sum, clip) => sum + clippedPacingSections(clip).reduce((n,s) => n + (s.sourceEnd-s.sourceStart)/s.rate, 0), 0);
    // Old exports accepted individually decodable caches up to 250 ms short.
    // Resume must repair these too, without discarding or downloading sources.
    const oldCache = path.join(temporary, 'video-exports', server.safeStorageId(projectId), 'jobs',
      server.safeStorageId(server.exportJobId(withFilmEndingPacing(clips), '9:16')), 'normalized', '000.mp4');
    await mkdir(path.dirname(oldCache), { recursive: true });
    await execFileAsync(ffmpeg, ['-y', '-i', source, '-t', String(duration / 1.08 - 0.1), '-c:v', 'libx264', '-c:a', 'aac', oldCache]);
    const oldCacheTime = (await stat(oldCache)).mtimeMs;
    const created = await server.createOrResumeExportJob(projectId, clips, 'api-film.mp4', '9:16');
    let job;
    const deadline = Date.now() + 90_000;
    do {
      await new Promise(resolve => setTimeout(resolve, 100));
      job = await server.readExportJob(projectId, created.jobId);
    } while (!['completed', 'failed'].includes(job.status) && Date.now() < deadline);
    assert.equal(job.status, 'completed', job.error);
    assert.notEqual((await stat(oldCache)).mtimeMs, oldCacheTime, 'short legacy cache must be repaired');
    const result = await server.exportDownloadInfo(projectId, created.jobId);
    const actual = (await server.probeMedia(result.filePath)).duration;
    assert.ok(Math.abs(actual - expected) < 0.3, `expected ${expected}, received ${actual}`);
  } finally { await rm(temporary, { recursive: true, force: true }); }
});
