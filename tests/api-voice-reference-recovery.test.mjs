import test from 'node:test';
import assert from 'node:assert/strict';
import {createApiVoiceReferenceRecovery, createComfyUIVoiceReferenceRecovery, publicAudioAvailable} from '../lib/apiVoiceReferenceRecovery.ts';
const audio=Buffer.alloc(1200,2).toString('base64');
test('ComfyUI repairs expired managed voices while preserving inline audio and speaker ordering', async()=>{
 const old='https://res.cloudinary.com/test/video/upload/voice.mp3';
 const refs=[{name:'Inline',url:'data:audio/mpeg;base64,'+audio},{name:'A',url:old},{name:'R2',url:'https://aid-media.example/voice.mp3'},{name:'B',url:old}];
 let uploads=0;
 const recover=createComfyUIVoiceReferenceRecovery(createApiVoiceReferenceRecovery({
  available:async url=>url!==old,load:async()=>({audio}),upload:async(_,saved)=>{assert.equal(saved.audio,audio);uploads++;return 'https://new/voice.mp3';},save:async()=>{},
 }));
 assert.deepEqual(await recover(refs),refs.map(r=>r.url===old?{...r,url:'https://new/voice.mp3'}:r));
 assert.equal(uploads,1);
});
test('ComfyUI leaves native references untouched and propagates unrecoverable voice errors', async()=>{
 const passthrough=createComfyUIVoiceReferenceRecovery(async()=>assert.fail('no hosting for native audio'));
 const refs=[{name:'A',url:'data:audio/wav;base64,'+audio},{name:'B',url:'http://localhost:3018/voice.wav'}];
 assert.deepEqual(await passthrough(refs),refs);
 const recover=createComfyUIVoiceReferenceRecovery(createApiVoiceReferenceRecovery({available:async()=>false,load:async()=>undefined,upload:async()=>assert.fail('must not replace voice'),save:async()=>assert.fail()}));
 await assert.rejects(recover([{name:'A',url:'https://res.cloudinary.com/test/voice.mp3'}]),/未提交新的视频生成/);
});
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
