import test from 'node:test';
import assert from 'node:assert/strict';
import axios from 'axios';
import { POST } from '../app/api/image-to-video/route.ts';
import { videoImageCapability, validateVideoImageCount } from '../lib/videoImageCapabilities.ts';

const images = Array.from({length: 11}, (_, i) => `https://example.com/image-${i + 1}.png`);
const request = (model, count, mode = 'reference', extra = {}) => POST(new Request('http://localhost/api/image-to-video', {
  method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ mainImage:images[0],referenceImages:images.slice(1,count),prompt:'女子站在客厅里，拿起茶杯，微笑着看向窗外。',apiKey:'fixture',videoModel:model,videoProvider:'apimart',generationType:mode,duration:8,...extra }),
}));
function capture(t) {
  const calls=[];
  t.mock.method(console,'log',()=>{}); t.mock.method(console,'error',()=>{});
  t.mock.method(axios,'post',async (url,body)=>{calls.push({url,body});return {data:{data:[{task_id:'fixture-video',status:'submitted'}]}};});
  return calls;
}

test('all supported API reference sets reach the paid payload in order without becoming a last frame',async t=>{
  const calls=capture(t);
  for(const [model,count] of [['seedance-2.0-mini',9],['wan3.0-video',10],['MiniMax-H3',9],['grok-imagine-1.5-video-apimart',7],['Omni-Flash-Ext',3],['happyhorse-1.0',9],['veo3.1-fast',3]]){
    const response=await request(model,count);assert.equal(response.status,200,JSON.stringify(await response.json()));
    const {body}=calls.at(-1);assert.deepEqual(body.image_urls,images.slice(0,count),model);
    assert.equal(body.image_with_roles,undefined,model);assert.equal(body.last_frame_image,undefined,model);
    if(['wan3.0-video','Omni-Flash-Ext','veo3.1-fast'].includes(model))assert.equal(body.generation_type,'reference');
  }
  assert.equal(calls.length,7); // Hosted URLs are not re-uploaded to storage.
});

test('single HappyHorse reference and frame choices use their distinct documented fields',async t=>{
  const calls=capture(t);
  for(const mode of ['reference','frame']){
    const res=await request('happyhorse-1.0',1,mode);assert.equal(res.status,200);
    const body=calls.at(-1).body;
    if(mode==='reference'){assert.deepEqual(body.image_urls,[images[0]]);assert.equal(body.first_frame_image,undefined);}
    else {assert.equal(body.first_frame_image,images[0]);assert.equal(body.image_urls,undefined);}
  }
});

test('oversized, unsupported and Omni two-image inputs fail before upload, rewrite or paid submit',async t=>{
  const calls=capture(t);
  for(const [model,count,mode] of [['seedance-2.0-mini',10,'reference'],['wan3.0-video',11,'reference'],['MiniMax-H3',10,'reference'],['Omni-Flash-Ext',2,'reference'],['veo3.1-quality',3,'reference'],['wan2.7',3,'frame'],['sora-2-vip',2,'frame'],['veo3.1-fast',3,'frame']]){
    const res=await request(model,count,mode,{prompt:'English input must fail validation before any paid rewrite'});assert.equal(res.status,400,model);
  }
  assert.equal(calls.length,0);
  assert.throws(()=>validateVideoImageCount(videoImageCapability('fal','minimax/h3-max/image-to-video'),'reference',3));
});

test('frame mode preserves first/last roles for Seedance, Wan and H3',async t=>{
  const calls=capture(t);
  for(const model of ['seedance-2.0-mini','wan3.0-video','MiniMax-H3','veo3.1-fast']){
    const res=await request(model,2,'frame',{secondImageRole:'last_frame'});assert.equal(res.status,200,JSON.stringify(await res.json()));
    const body=calls.at(-1).body;
    if(model==='veo3.1-fast'){assert.deepEqual(body.image_urls,images.slice(0,2));assert.equal(body.generation_type,'frame');}
    else assert.deepEqual(body.image_with_roles,[{url:images[0],role:'first_frame'},{url:images[1],role:'last_frame'}]);
  }
});
