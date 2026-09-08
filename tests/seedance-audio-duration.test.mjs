import test from 'node:test';
import assert from 'node:assert/strict';
import axios from 'axios';
import { createSeedanceAudioDelivery, decodeSeedanceAudio, seedanceAudioFrameBudgets, seedanceAudioWav, seedanceAudioDelivery } from '../lib/seedanceAudioDelivery.ts';
import { createVideoTask } from '../lib/apimart.ts';
import { apiVoiceReferenceUrls } from '../lib/videoCapabilities.ts';
const rate = 24000;

test('total allowance is at most ten seconds for one to three voices; short clips leave room for longer ones', () => {
  for (const durations of [[30], [12, 15], [20, 20, 20], [2, 30], [1, 2, 30], [2, 3]]) {
    const frames = seedanceAudioFrameBudgets(durations.map(n => n * rate));
    assert.equal(frames.length, durations.length);
    assert.ok(frames.every(n => n >= 2 * rate));
    assert.ok(frames.reduce((a,b) => a+b,0) <= 10 * rate);
  }
  assert.deepEqual(seedanceAudioFrameBudgets([2 * rate, 30 * rate]), [2 * rate, 8 * rate]);
  assert.deepEqual(seedanceAudioFrameBudgets([2 * rate, 3 * rate]), [2 * rate, 3 * rate]);
});

test('actual WAV encoding and FFmpeg decoding preserve speaker order and the aggregate duration', async () => {
  const sources = [12, 17, 20].map((seconds, i) => {
    const pcm = Buffer.alloc(seconds * rate * 2);
    for (let n=0;n<pcm.length/2;n++) pcm.writeInt16LE(Math.round(8000*Math.sin(2*Math.PI*(220+i*110)*n/rate)), n*2);
    return seedanceAudioWav(pcm, seconds*rate);
  });
  const before = sources.map(b => Buffer.from(b));
  const uploads = [];
  const prepare = createSeedanceAudioDelivery({
    read: async url => sources[Number(url)], decode: decodeSeedanceAudio,
    upload: async (bytes,key) => { uploads.push({bytes,key}); return key; },
  });
  const result = await prepare(['0','1','2']);
  assert.equal(result.length,3);assert.deepEqual(sources,before);
  const decoded = await Promise.all(result.map(key => decodeSeedanceAudio(uploads.find(u=>u.key===key).bytes)));
  assert.ok(decoded.reduce((n,b)=>n+b.length/2/rate,0) <= 10);
  for(let i=0;i<3;i++) assert.equal(decoded[i].readInt16LE(10*2),before[i].readInt16LE(44+10*2));
  await prepare(['0','1','2']); assert.equal(uploads.length,3);
});

test('preparation failure blocks the billable request; retry does not cache failures', async t => {
  let reads=0, posts=0;
  const prepare=createSeedanceAudioDelivery({read:async()=>{reads++;throw new Error('unavailable');},decode:async b=>b,upload:async()=>''});
  t.mock.method(seedanceAudioDelivery,'prepare',prepare);
  t.mock.method(axios,'post',async()=>{posts++;return {};});
  t.mock.method(console,'log',()=>{});t.mock.method(console,'error',()=>{});
  for(let i=0;i<2;i++) await assert.rejects(createVideoTask('Hello',['https://example.com/image.png'],'key','seedance-2.0-mini','16:9',{audioUrls:['https://example.com/voice.wav']}),/音色参考 1/);
  assert.equal(posts,0);assert.equal(reads,2);
});

test('shared Mini boundary submits processed references once and leaves caller inputs intact', async t => {
  const urls=['https://r2.example/a.wav','https://r2.example/b.wav'];
  const prepared=['https://r2.example/short-a.wav','https://r2.example/short-b.wav'];
  let preparations=0;const bodies=[];
  t.mock.method(seedanceAudioDelivery,'prepare',async incoming=>{assert.deepEqual(incoming,urls);preparations++;return prepared;});
  t.mock.method(axios,'post',async(_,body)=>{bodies.push(body);return {data:{data:[{task_id:'accepted'}]}};});
  t.mock.method(console,'log',()=>{});t.mock.method(console,'error',()=>{});
  const options={audioUrls:urls,duration:15};
  await createVideoTask('Speech text',['https://example.com/image.png'],'key','seedance-2.0-mini','16:9',options);
  assert.equal(preparations,1);assert.deepEqual(bodies[0].audio_urls,prepared);
  assert.equal(bodies[0].duration,15);assert.equal(bodies[0].prompt,'Speech text');assert.deepEqual(options.audioUrls,urls);
  assert.deepEqual(apiVoiceReferenceUrls([{name:'A',url:'https://res.cloudinary.com/test/video/upload/a.wav'}],'seedance-2.0-mini'),['https://res.cloudinary.com/test/video/upload/a.wav']);
});
