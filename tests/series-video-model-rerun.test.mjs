import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp,rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { NextRequest } from 'next/server';
import { POST } from '../app/api/companion/series/route.ts';
import { createSeries,parseOutline,parseEpisodes } from '../lib/series/domain.ts';
import { withSeriesDb,openSettings,sealSettings } from '../lib/series/store.ts';
import { rerunChangedEpisodeVideos } from '../lib/series/videoModelRerun.ts';
import { seriesRetryBlocker } from '../lib/series/jobHistory.ts';
import { outlineFixture,episodeFixtures } from './fixtures/series.mjs';

const old={videoProvider:'apimart',videoModel:'seedance-2.0-mini'}, next={videoProvider:'apimart',videoModel:'wan3.0-video'};
const settings={...next,apiKey:'fixture-key',fishAudioKey:'fixture-fish',imageModel:'fixture-image'};
function fixture(){
  const p=createSeries({name:'切换模型',brief:'照片修复师寻找父亲',episodeCount:3});
  Object.assign(p,parseOutline(outlineFixture(),p));p.episodes=parseEpisodes(episodeFixtures(),p,1,3);
  p.characters.forEach(c=>Object.assign(c,{locked:true,bibleUrl:'https://test/character',voiceId:c.id,voiceReferenceUrl:'https://test/voice'}));
  p.locations.forEach(l=>{l.imageUrl='https://test/location';});
  for(const [i,e] of p.episodes.entries()){
    e.script=[{number:1,visual:'原定稿画面',dialogue:[]}];
    e.deliveries=[{id:`old-${i}`,episodeVersion:e.version,fileName:'old.mp4',bytes:100,createdAt:'2026-09-08T01:00:00Z'}];
    e.production={id:`production-${i}`,voiceReferences:[{id:'voice',url:'https://test/voice'}],videoSegmentPlan:{segments:[{id:'old-segment'}]},storyboards:[{id:'shot',sceneNumber:1,status:'completed',imageUrl:'https://test/image',audioUrl:'https://test/audio',prompt:'原图提示',videoPrompt:'旧视频提示',videoUrl:'https://test/old.mp4',videoTaskId:'paid-task',videoProviderUsed:'apimart',videoStatus:'completed',videoContinuityChainId:'old-chain'}]};
  }
  return p;
}
test('Produce selected completed episodes switches API models, keeps script/images/voices/history and is idempotent',async()=>{
  const before=process.env.AID_COMPANION_DATA_DIR,root=await mkdtemp(path.join(tmpdir(),'aid-rerun-'));process.env.AID_COMPANION_DATA_DIR=root;
  try{
    const p=fixture(),snapshot=structuredClone(p),target=p.episodes[0];
    await withSeriesDb(async db=>{db.projects.push(p);for(const [i,e] of p.episodes.entries())db.jobs.push({id:`old-${i}`,seriesId:p.id,episodeId:e.id,kind:'produce',status:'completed',stage:'done',attempts:1,createdAt:'2026-09-08T01:00:00Z',updatedAt:'2026-09-08T01:00:00Z',sealedSettings:await sealSettings({...settings,...old})});});
    const submit=()=>POST(new NextRequest('http://localhost/api/companion/series',{method:'POST',body:JSON.stringify({action:'enqueue',kind:'produce',seriesId:p.id,episodeIds:[target.id],settings,rerunChangedVideoModel:true})}));
    const first=await submit();assert.equal(first.status,200);assert.deepEqual(await first.json(),{added:1,rerun:1});
    await withSeriesDb(async db=>{
      const e=db.projects[0].episodes[0];assert.equal(e.version,target.version+1);assert.deepEqual(e.script,target.script);
      assert.deepEqual(e.deliveries,target.deliveries);assert.deepEqual(e.production.voiceReferences,target.production.voiceReferences);
      assert.equal(e.production.storyboards[0].imageUrl,'https://test/image');assert.equal(e.production.storyboards[0].audioUrl,'https://test/audio');
      assert.equal(e.production.storyboards[0].videoTaskId,undefined);assert.equal(e.production.storyboards[0].videoUrl,undefined);assert.equal(e.production.storyboards[0].videoContinuityChainId,undefined);
      assert.equal(e.production.videoSegmentPlan,undefined);assert.notEqual(e.production.id,target.production.id);
      assert.deepEqual(e.videoHistory[0].production,target.production);assert.deepEqual(db.projects[0].episodes.slice(1),snapshot.episodes.slice(1));
      const j=db.jobs.find(j=>j.status==='queued');assert.deepEqual(j.videoSelection,next);assert.equal((await openSettings(j.sealedSettings)).videoModel,next.videoModel);
    });
    const repeat=await submit();assert.deepEqual(await repeat.json(),{added:0,rerun:0});
    await withSeriesDb(db=>{assert.equal(db.jobs.filter(j=>j.status==='queued').length,1);assert.equal(db.projects[0].episodes[0].videoHistory.length,1);});
  }finally{if(before===undefined)delete process.env.AID_COMPANION_DATA_DIR;else process.env.AID_COMPANION_DATA_DIR=before;await rm(root,{recursive:true,force:true});}
});

test('running conflicts reject the whole selection before mutation; paused paid tasks are archived and cannot resume',()=>{
  const p=fixture();p.episodes.forEach(e=>{e.videoSelection=old;});
  const jobs=p.episodes.map((e,i)=>({id:`j-${i}`,seriesId:p.id,episodeId:e.id,kind:'produce',status:i===1?'running':'paused',writeScope:`episode:${e.id}`,videoSelection:old}));
  const before=structuredClone(p);
  assert.throws(()=>rerunChangedEpisodeVideos(p,jobs,undefined,next),/暂停/);assert.deepEqual(p,before);
  jobs[1].status='paused';assert.equal(rerunChangedEpisodeVideos(p,jobs,new Set([p.episodes[0].id]),{videoProvider:'comfyui',videoModel:'minimax-h3'}),1);
  assert.equal(jobs[0].status,'failed');assert.equal(jobs[0].supersededByVideoModel,true);assert.match(seriesRetryBlocker(jobs[0],jobs),/新视频模型/);
  assert.deepEqual(p.episodes[1],before.episodes[1]);assert.equal(p.episodes[0].videoHistory[0].production.storyboards[0].videoTaskId,'paid-task');
});

test('legacy media without model records reruns once; same-model completed episodes remain intact',()=>{
  const p=fixture();assert.equal(rerunChangedEpisodeVideos(p,[],new Set([p.episodes[0].id]),next),1);
  const e=p.episodes[0];e.deliveries.push({id:'new',episodeVersion:e.version});
  const before=structuredClone(p);assert.equal(rerunChangedEpisodeVideos(p,[],new Set([e.id]),next),0);assert.deepEqual(p,before);
});
