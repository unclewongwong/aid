import test from 'node:test';
import assert from 'node:assert/strict';
import { visualAssetSourceKey, visualAssetDescription } from '../lib/storyVisualAssets.ts';
import { materialQuestions, requireMaterialFacts } from '../lib/materialFacts.ts';
import { diagnoseRepair } from '../lib/repairCenter.ts';
import { supplementMaterialFacts, materialRepairScope } from '../lib/series/materialRepair.ts';
import { createStoryImageRequestPreparer } from '../lib/storyImageRequest.ts';
const object = {id:'o1',name:'潘达面膜',description:'用户原商品',imageUrl:'https://example.com/original.jpg'};
object.visualIdentity={version:1,sourceKey:visualAssetSourceKey(object),kind:'packaging',appearance:'gold packet',scale:'',states:'sealed'};
const board={id:'b9',sceneNumber:9,status:'completed',objects:['潘达面膜'],description:'贴到脸上',prompt:'wearing a golden face mask',imageUrl:'https://example.com/old.png',taskId:'paid'};
const fact={contents:'灰黑色纱布面膜',packaging:'金色包装',usage:'贴脸时为柔软纱布'};
const project=()=>({id:'p',revision:3,paused:true,objects:[structuredClone(object)],episodes:[{id:'e',number:1,version:1,deliveries:[],script:[{number:9,objectIds:['o1'],visual:'敷面膜',action:'交谈',seconds:8,dialogue:['原台词']}],production:{objects:[structuredClone(object)],storyboards:[structuredClone(board),{id:'b10',sceneNumber:10,status:'completed',objects:[],prompt:'empty room',imageUrl:'keep',taskId:'keep-task'}]}}]});
test('unknown contents stop before paid submission; packaging-only shot needs no clarification',async()=>{
 assert.equal(materialQuestions(board,[object]).length,1);
 assert.equal(materialQuestions({...board,description:'手持包装',prompt:'holds packet'},[object]).length,0);
 let calls=0; const prepare=createStoryImageRequestPreparer(async()=>{calls++;throw Error('network');});
 await assert.rejects(prepare({storyboard:board,objects:[object],characters:[],apiKey:'test',imageModel:'gpt-image-2',aspectRatio:'9:16'}),/需要补充素材事实/);
 assert.equal(calls,0);
 try {requireMaterialFacts(board,[object]);} catch(error){assert.equal(diagnoseRepair(error,{taskId:'old',resumable:true}).automatic,false);assert.equal(diagnoseRepair(error).code,'material-information');}
});
test('confirmed user contents coexist with original image facts and expire after replacing source',()=>{
 const confirmed={...object,materialFacts:{...fact,source:'user',sourceUrl:object.imageUrl,confirmedAt:'now'}};
 assert.equal(materialQuestions(board,[confirmed]).length,0);
 const description=visualAssetDescription(confirmed);assert.match(description,/灰黑色纱布/);assert.match(description,/gold packet/);assert.match(description,/用户原商品/);
 assert.doesNotMatch(visualAssetDescription({...confirmed,imageUrl:'https://example.com/new'}),/USER CONFIRMED/);
});
test('targeted repair is atomic, archives originals, preserves screenplay and untouched shots',()=>{
 const p=project(), original=structuredClone(p), result=supplementMaterialFacts(p,'o1',fact,3);
 assert.deepEqual(p,original);assert.deepEqual(result.episodes[0].script,p.episodes[0].script);
 assert.deepEqual(result.episodes[0].production.storyboards[1],p.episodes[0].production.storyboards[1]);
 assert.equal(result.episodes[0].production.storyboards[0].imageUrl,undefined);
 assert.match(result.episodes[0].production.storyboards[0].visualPromptRewriteId,/material-facts/);
 assert.equal(result.materialRepairHistory[0].productions[0].production.storyboards[0].taskId,'paid');
 assert.equal(result.objects[0].imageUrl,object.imageUrl);assert.equal(result.objects[0].materialFacts.contents,fact.contents);
 assert.deepEqual(materialRepairScope(p,'o1')[0].shots,[9]);
});
test('stale revisions, active queue, in-flight targets and empty facts cannot overwrite checkpoints',()=>{
 assert.throws(()=>supplementMaterialFacts(project(),'o1',fact,2),/已有更新/);
 assert.throws(()=>supplementMaterialFacts({...project(),paused:false},'o1',fact,3),/暂停/);
 assert.throws(()=>supplementMaterialFacts(project(),'o1',{},3),/请填写/);
 const p=project();p.episodes[0].production.storyboards[0].status='generating';
 assert.throws(()=>supplementMaterialFacts(p,'o1',fact,3),/运行中/);
});
test('delivered episode creates a new version while preserving old delivery and source transport copy',()=>{
 const p=project();p.episodes[0].deliveries=[{episodeVersion:1,url:'old-film'}];p.objects[0].imageApiReference={sourceUrl:object.imageUrl,model:'official',imageUrl:'webp'};
 const r=supplementMaterialFacts(p,'o1',fact,3);assert.equal(r.episodes[0].version,2);assert.deepEqual(r.episodes[0].deliveries,p.episodes[0].deliveries);assert.deepEqual(r.objects[0].imageApiReference,p.objects[0].imageApiReference);
});
test('tail-frame dependents lose only video, and running dependents prevent repair',()=>{
 const p=project(), boards=p.episodes[0].production.storyboards;
 boards[0].videoContinuityChainId='chain';boards[0].videoUrl='wrong-mask-video';
 boards[1].videoContinuityChainId='chain';boards[1].videoUrl='depends-on-old-tail';
 const result=supplementMaterialFacts(p,'o1',fact,3);
 assert.equal(result.episodes[0].production.storyboards[1].imageUrl,'keep');
 assert.equal(result.episodes[0].production.storyboards[1].videoUrl,undefined);
 boards[1].videoStatus='generating';boards[1].videoTaskId='paid-running';
 assert.throws(()=>supplementMaterialFacts(p,'o1',fact,3),/运行中/);
});
test('repeated submission of identical confirmed facts is a no-op, not another regeneration',()=>{
 const p=supplementMaterialFacts(project(),'o1',fact,3);
 p.episodes[0].production.storyboards[0].imageUrl='corrected-paid-image';
 const next=supplementMaterialFacts(p,'o1',fact,3);
 assert.deepEqual(next,p);assert.equal(next.materialRepairHistory.length,1);
});
test('actual project cleaner survives save/reload and preserves provider copy plus user facts',async()=>{
 const {cleanObject}=await import('../hooks/useProject.ts');
 const source={...object,materialFacts:{...fact,source:'user',sourceUrl:object.imageUrl,confirmedAt:'now'},imageApiReference:{sourceUrl:object.imageUrl,model:'gpt-image-2-official',imageUrl:'https://example.com/same-pixels.webp'},imageFile:{mustNotPersist:true}};
 const saved=JSON.parse(JSON.stringify(cleanObject(source)));
 assert.deepEqual(saved.materialFacts,source.materialFacts);assert.deepEqual(saved.imageApiReference,source.imageApiReference);assert.equal(saved.imageFile,undefined);
 let network=0;const prepare=createStoryImageRequestPreparer(async()=>{network++;throw Error('unexpected upload')});
 const payload=JSON.parse(await prepare({storyboard:board,objects:[saved],characters:[],apiKey:'test',imageModel:'gpt-image-2-official',aspectRatio:'9:16'}));
 assert.equal(network,0);assert.equal(payload.objects[0].imageUrl,source.imageApiReference.imageUrl);assert.match(payload.objects[0].description,/灰黑色纱布/);
});
test('saving existing facts repairs a legacy checkpoint that lost confirmed metadata',()=>{
 const p=supplementMaterialFacts(project(),'o1',fact,3);p.objects[0].imageApiReference={sourceUrl:object.imageUrl,model:'official',imageUrl:'copy'};
 delete p.episodes[0].production.objects[0].materialFacts;
 const next=supplementMaterialFacts(p,'o1',fact,3);
 assert.equal(next.episodes[0].production.objects[0].materialFacts.contents,fact.contents);
 assert.deepEqual(next.episodes[0].production.objects[0].imageApiReference,p.objects[0].imageApiReference);
});
test('explicit product names in visual description survive a director dropping object IDs',()=>{
 const p=project();p.episodes[0].script=[];
 p.episodes[0].production.storyboards[0]={...board,objects:[],prompt:'wearing mask',description:'脸上贴着潘达面膜'};
 assert.deepEqual(materialRepairScope(p,'o1')[0].shots,[9]);
 assert.equal(materialQuestions(p.episodes[0].production.storyboards[0],[object]).length,1);
});
