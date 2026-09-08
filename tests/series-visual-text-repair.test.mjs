import test from 'node:test';
import assert from 'node:assert/strict';
import { applyApprovedVisualTextRepairs } from '../lib/series/visualTextRepair.ts';
import { mergeRegeneratedVisualPrompts } from '../lib/visualPromptRewrite.ts';

const shot={number:1,seconds:11,characterIds:["c1"],objectIds:[],visual:'错误的包',action:'举起包',imagePrompt:'wrong bag',dialogue:[{characterId:'c1',text:'电脑为什么手提？'}]};
const project={paused:true,brief:'她一手挎着包，一手拎着电脑。',locations:[],objects:[],characters:[{id:'c1',name:'林夏'}]};
const episode={number:1,title:'测试',version:1,deliveries:[],script:[shot],production:{storyboards:[{id:'s1',sceneNumber:1,status:'completed',imageUrl:'https://old/image',taskId:'original'}, {id:'s2',sceneNumber:2,status:'generating',taskId:'in-flight',prompt:'keep'}]}};
const patch={number:1,sourceQuote:'一手拎着电脑',before:{visual:shot.visual,action:shot.action,imagePrompt:shot.imagePrompt},after:{visual:'她一手挎包，一手拎着电脑。',action:'她举起包，另一手拎着电脑。',imagePrompt:'同一女子拿着包和电脑。'}};
test('reviewed source correction archives original image and changes only targeted visual text',()=>{
 const result=applyApprovedVisualTextRepairs(project,episode,[patch],'review-1');
 assert.deepEqual(result.script[0].dialogue,episode.script[0].dialogue);assert.equal(result.script[0].seconds,11);
 assert.equal(result.production.storyboards[0].imageUrl,undefined);
 assert.equal(result.visualTextRepairs[0].storyboards[0].imageUrl,'https://old/image');
 assert.deepEqual(result.production.storyboards[1],episode.production.storyboards[1]);assert.equal(episode.script[0].visual,'错误的包');
});
test('source evidence, paused state and exact originals are required and cannot authorize dialogue edits',()=>{
 assert.throws(()=>applyApprovedVisualTextRepairs({...project,paused:false},episode,[patch],'r'),/暂停/);
 assert.throws(()=>applyApprovedVisualTextRepairs(project,episode,[{...patch,sourceQuote:'invented'}],'r'),/逐字依据/);
 assert.throws(()=>applyApprovedVisualTextRepairs(project,episode,[{...patch,before:{...patch.before,action:'stale'}}],'r'),/原稿已更新/);
 assert.throws(()=>applyApprovedVisualTextRepairs(project,episode,[{...patch,after:{...patch.after,dialogue:[]}}],'r'),/只能修改/);
});
test('targeted directing rewrite keeps unaffected paid images and their complete original prompts',()=>{
 const retained=[{sceneNumber:1,visualPromptRewriteId:'r',prompt:'old',action:'locked'},{sceneNumber:2,prompt:'approved',imageUrl:'paid',taskId:'known'}];
 const fresh=[{sceneNumber:1,prompt:'fixed',description:'fixed'},{sceneNumber:2,prompt:'unwanted'}];
 const result=mergeRegeneratedVisualPrompts(retained,fresh);assert.equal(result[0].prompt,'fixed');assert.equal(result[0].action,'locked');assert.deepEqual(result[1],retained[1]);
});
