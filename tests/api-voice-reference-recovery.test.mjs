import test from 'node:test';
import assert from 'node:assert/strict';
import {createApiVoiceReferenceRecovery, publicAudioAvailable} from '../lib/apiVoiceReferenceRecovery.ts';
const audio=Buffer.alloc(1200,2).toString('base64');
test('disabled voice host recovers identical cached audio once and preserves speaker order',async()=>{
 let uploads=0,saved;
 const recover=createApiVoiceReferenceRecovery({available:async url=>url==='https://new/voice',load:async()=>({audio,voiceId:'original'}),upload:async(_,value)=>{uploads++;assert.equal(value.audio,audio);return 'https://new/voice';},save:async(_,value)=>{saved=value;}});
 const refs=[{name:'A',url:'https://old/voice'},{name:'B',url:'https://old/voice'}];
 assert.deepEqual(await recover(refs),refs.map(r=>({...r,url:'https://new/voice'})));
 assert.equal(uploads,1);assert.equal(saved.voiceId,'original');assert.equal(saved.audio,audio);
 await recover(refs);assert.equal(uploads,1);
});
test('restart uses restored URL in disk cache and never uploads valid references',async()=>{
 let upload=0;
 const recover=createApiVoiceReferenceRecovery({available:async url=>url!=='https://old/voice',load:async()=>({audio,url:'https://new/voice'}),upload:async()=>{upload++;},save:async()=>assert.fail('no write needed')});
 assert.equal((await recover([{name:'A',url:'https://old/voice'}]))[0].url,'https://new/voice');
 assert.equal((await recover([{name:'B',url:'https://valid/voice'}]))[0].url,'https://valid/voice');assert.equal(upload,0);
});
test('missing cache, unavailable uploaded media and transient errors stop before generation',async()=>{
 for(const mode of ['missing','upload-invalid','network']){
  let loads=0;
  const recover=createApiVoiceReferenceRecovery({available:async()=>{if(mode==='network')throw new Error('HTTP 503');return false;},load:async()=>{loads++;return mode==='missing'?undefined:{audio};},upload:async()=> 'https://new/voice',save:async()=>assert.fail('do not save invalid URL')});
  await assert.rejects(recover([{name:'A',url:'https://old/voice'}]),/未提交新的视频生成/);
  if(mode==='network')assert.equal(loads,0);
 }
});
test('public audio probing distinguishes disabled storage from transient errors and non-media',async t=>{
 t.mock.method(globalThis,'fetch',async()=>new Response(null,{status:401}));assert.equal(await publicAudioAvailable('https://res.cloudinary.com/test/video/upload/a.mp3'),false);
 globalThis.fetch=async()=>new Response(null,{status:503});await assert.rejects(publicAudioAvailable('https://res.cloudinary.com/test/video/upload/a.mp3'),/暂时/);
 globalThis.fetch=async()=>new Response(null,{headers:{'content-type':'text/html'}});assert.equal(await publicAudioAvailable('https://res.cloudinary.com/test/video/upload/a.mp3'),false);
 globalThis.fetch=async()=>new Response(null,{headers:{'content-type':'audio/mpeg'}});assert.equal(await publicAudioAvailable('https://res.cloudinary.com/test/video/upload/a.mp3'),true);
});
