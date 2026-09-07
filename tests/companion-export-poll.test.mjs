import test from 'node:test';
import assert from 'node:assert/strict';
import { pollJob } from '../lib/companionVideoExporter.ts';

test('native export surfaces terminal failure immediately and recovers transient transport errors', async () => {
  const originalFetch = globalThis.fetch;
  const originalWindow = globalThis.window;
  globalThis.window = { setTimeout: fn => setTimeout(fn, 0) };
  let calls = 0;
  try {
    globalThis.fetch = async () => {
      calls++;
      assert.ok(calls < 4, 'terminal failure must not be swallowed by the network retry counter');
      return Response.json({ job: { status: 'failed', progress: 86, error: '合并结果时长不匹配' } });
    };
    await assert.rejects(pollJob('project', 'job', undefined, () => {}), /合并结果时长不匹配/);
    assert.equal(calls, 1);
    calls = 0;
    globalThis.fetch = async () => {
      calls++;
      if (calls === 1) throw new TypeError('fetch failed');
      return Response.json({ job: { status: calls === 2 ? 'running' : 'completed', progress: 100 } });
    };
    assert.equal((await pollJob('project', 'job', undefined, () => {})).status, 'completed');
    assert.equal(calls, 3);
  } finally {
    globalThis.fetch = originalFetch;
    globalThis.window = originalWindow;
  }
});
