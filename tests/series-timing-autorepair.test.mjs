import test from 'node:test';
import assert from 'node:assert/strict';
import { createSeries, parseOutline, parseEpisodes, parseScript } from '../lib/series/domain.ts';
import { outlineFixture, episodeFixtures, shotFixture } from './fixtures/series.mjs';
import { scriptTimingIssues, checkScriptDialogue } from '../lib/series/scriptRepair.ts';
import { speechRuntimeSeconds, validateSpeechContract } from '../lib/speechAudioContract.ts';
import { generateSeriesStage } from '../lib/series/generation.ts';
import { repairEpisodeDialogue } from '../lib/series/productionDialogueRepair.ts';
import { executeSeriesClaim } from '../lib/series/runner.ts';
import { seriesScriptAssetFingerprint } from '../lib/series/scriptStructureRepair.ts';
function fixture() {
 const p=createSeries({name:'超时修稿测试',brief:'短句表达原意',episodeCount:3});
 Object.assign(p,parseOutline(outlineFixture(),p));p.language='en';p.episodes=parseEpisodes(episodeFixtures(),p,1,3);
 const shots=parseScript(shotFixture(),p,p.episodes[0]); shots.forEach(s=>s.dialogue=[]);
 for(const [i,count] of [[1,21],[4,19]]) {shots[i].seconds=15;shots[i].dialogue=[{characterId:'c1',text:Array(count).fill('well-known').join(' '),emotion:'calm'}];}
 p.episodes[0].script=shots;
 return p;
}
const patch = { repairs:[1,4].map(i=>({path:`shots[${i}].dialogue[0].text`,value:'The facts are already known.'})) };
const review = preservesMeaning => ({checks:patch.repairs.map(r=>({path:r.path,preservesMeaning,reason:preservesMeaning?'Meaning retained in fixture.':'The original negation was lost.'}))});
test('saved shots missed by the old word budget now fail the same clock as production',()=>{
 const p=fixture();const shots=p.episodes[0].script;
 assert.ok(shots[1].dialogue[0].text.split(/\s+/).length<=Math.floor(14.2*2.4));
 assert.ok(speechRuntimeSeconds([shots[1].dialogue[0].text])>19);
 assert.deepEqual([...new Set(scriptTimingIssues(shots,'en').map(i=>i.shotNumber))],[2,5]);
 for(const i of [1,4]) assert.match(validateSpeechContract([{sceneNumber:i+1,characters:['A'],speech:[{character:'A',exactLine:shots[i].dialogue[0].text,source:'user_exact',lipSync:true}]}]),/15 秒/);
});
test('old draft is compressed, independently reviewed, retained and reusable without another request',async()=>{
 const p=fixture();let saved,calls=0;
 const result=await generateSeriesStage('script',p,p.episodes[0].id,{save:async raw=>{saved=raw;},chat:async prompt=>{calls++;return JSON.stringify(prompt.startsWith('DIALOGUE_MEANING_REVIEW')?review(true):patch);}});
 assert.equal(calls,2);checkScriptDialogue(result.script,'en');
 const repaired=repairEpisodeDialogue(p,p.episodes[0],result.script,'timing');
 assert.equal(repaired.script.length,16);assert.equal(repaired.dialogueRepairs[0].before[0].dialogue[0].text,p.episodes[0].script[1].dialogue[0].text);
 assert.deepEqual(repaired.script[0],p.episodes[0].script[0]);assert.equal(p.episodes[0].script[1].dialogue[0].text.split(' ').length,21);
 await generateSeriesStage('script',p,p.episodes[0].id,{read:async()=>saved,chat:async()=>assert.fail('No repeat generation')});
});
test('meaning rejection or unavailable review never replaces original; retries are bounded',async()=>{
 for(const unavailable of [false,true]) {
 const p=fixture();let saves=0,calls=0;
 await assert.rejects(generateSeriesStage('script',p,p.episodes[0].id,{save:async()=>{saves++;},chat:async prompt=>{calls++;if(prompt.startsWith('DIALOGUE_MEANING_REVIEW')){if(unavailable)throw new Error('review unavailable');return JSON.stringify(review(false));}return JSON.stringify(patch);}}),/原稿已保留/);
 assert.equal(saves,0);assert.equal(calls,6);
 }
});
test('timing patches preserve images and unrelated paid media, refusing affected paid clips and authored scripts',()=>{
 const p=fixture(),e=p.episodes[0];p.characters.forEach(c=>c.voiceId='voice');
 e.production={storyboards:e.script.map(s=>({id:`s${s.number}`,sceneNumber:s.number,imageUrl:`image${s.number}`,videoUrl:s.number===1?'paid-video':undefined,speech:s.dialogue.map(d=>({character:p.characters.find(c=>c.id===d.characterId).name,voiceId:'voice',exactLine:d.text}))}))};
 const repaired=structuredClone(e.script);for(const i of [1,4])repaired[i].dialogue[0].text=patch.repairs[0].value;
 const next=repairEpisodeDialogue(p,e,repaired,'timing');assert.equal(next.production.storyboards[0].videoUrl,'paid-video');assert.equal(next.production.storyboards[1].imageUrl,'image2');assert.equal(next.production.storyboards[1].speech[0].exactLine,patch.repairs[0].value);
 e.production.storyboards[0].videoSegmentId='legacy';e.production.storyboards[1].videoSegmentId='legacy';assert.throws(()=>repairEpisodeDialogue(p,e,repaired,'timing'),/已有视频/);delete e.production.storyboards[0].videoSegmentId;delete e.production.storyboards[1].videoSegmentId;
 e.production.storyboards[1].videoTaskId='submitted';assert.throws(()=>repairEpisodeDialogue(p,e,repaired,'timing'),/已有视频/);
 p.sourceMode='authored_screenplay';assert.throws(()=>repairEpisodeDialogue(p,e,repaired,'timing'),/不能自动缩短/);
});
test('runner checks a saved current-fingerprint script before handing it to Story',async()=>{
 const p=fixture(),e=p.episodes[0];
 p.characters.forEach((c,i)=>Object.assign(c,{locked:true,bibleUrl:`https://example.com/${i}.png`,voiceId:`voice${i}`,voiceReferenceUrl:`https://example.com/${i}.mp3`}));p.locations.forEach(l=>l.imageUrl='https://example.com/location.png');e.scriptAssetFingerprint=seriesScriptAssetFingerprint(p,e);
 const result=structuredClone(e.script);for(const i of [1,4])result[i].dialogue[0].text=patch.repairs[0].value;
 const previous=globalThis.fetch;let requests=0;const stages=[];
 globalThis.fetch=async(url,init)=>{if(url==='/api/companion/status')return Response.json({ok:false});if(url==='/api/series/generate'){requests++;return Response.json({script:result});}if(url==='/api/companion/series'){const body=JSON.parse(init.body);stages.push(body.stage);return Response.json({revision:body.project.revision+1});}throw new Error(`Unexpected ${url}`);};
 try {await executeSeriesClaim({project:p,job:{id:'j',episodeId:e.id,kind:'script',lease:'test'},settings:{apiKey:'test'}},new AbortController().signal,()=>{});assert.equal(requests,1);assert.ok(stages.some(s=>s?.includes('台词超时')));assert.equal(e.dialogueRepairs.length,1);checkScriptDialogue(e.script,'en');}
 finally{globalThis.fetch=previous;}
});
