import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { diagnoseRepair, newRepairLedger, reserveRepair, resolveRepair, isRepairScopeBlocked } from '../lib/repairCenter.ts';
import { generationDraft, recoverGeneration } from '../lib/pipeline/generationDraft.ts';
import { createVoiceReferenceService } from '../lib/voiceReferenceGeneration.ts';

test('review, authentication and ambiguous submissions never authorize text repair or paid retry', () => {
 for (const error of ['The generated content was filtered by the safety system.', 'Your prompt or input was rejected by the content safety system.', '401 unauthorized', 'insufficient quota', '提交结果未确认']) {
  const result=diagnoseRepair(error,{validation:true,taskId:'existing',resumable:true});
  assert.equal(result.automatic,false,error);assert.notEqual(result.action,'repair-text');
 }
});
test('media failures are distinguished from credentials and text; original tasks are resumed with evidence only', () => {
 assert.equal(diagnoseRepair('Upstream status code: 401').action,'restore-media');
 assert.equal(diagnoseRepair('Upstream status code: 401').automatic,false);
 assert.equal(diagnoseRepair('链接已失效',{canRestoreMedia:true}).automatic,true);
 assert.equal(diagnoseRepair('Image generation timeout',{taskId:'existing',resumable:true}).action,'resume-task');
 assert.equal(diagnoseRepair('Image generation timeout').automatic,false);
 assert.equal(diagnoseRepair('save failed',{taskId:'existing',resumable:true,outputAvailable:true}).action,'restore-media');
 assert.equal(diagnoseRepair('missing action',{validation:true}).action,'repair-text');
 assert.equal(diagnoseRepair('something unknown').automatic,false);
});
test('repair budget survives serialization, blocks unchanged rewrites and logs no input or credential', () => {
 let ledger=newRepairLedger();const decision=diagnoseRepair('missing',{validation:true});
 for(let i=0;i<2;i++){
  assert.equal(reserveRepair(ledger,'shot-2',decision,{error:'Bearer secret-credential',progress:'private original prompt'}).allowed,true);
  ledger=JSON.parse(JSON.stringify(ledger));
 }
 assert.equal(reserveRepair(ledger,'shot-2',decision,{error:'Bearer secret-credential',progress:'private original prompt'}).allowed,false);
 assert.equal(isRepairScopeBlocked(ledger,'shot-2'),true);
 assert.doesNotMatch(JSON.stringify(ledger),/secret-credential|private original prompt/);
 assert.equal(reserveRepair(ledger,'shot-3',decision,{progress:'new'}).allowed,true);
 resolveRepair(ledger,'shot-3');assert.equal(ledger.events.at(-1).status,'resolved');
});
test('transient retries have a fixed limit even across fresh workers', () => {
 let ledger=newRepairLedger();const decision=diagnoseRepair('503 temporarily unavailable');
 for(let i=0;i<6;i++){assert.equal(reserveRepair(ledger,'image',decision).allowed,true);ledger=JSON.parse(JSON.stringify(ledger));}
 assert.equal(reserveRepair(ledger,'image',decision).allowed,false);
});
test('saved invalid writing stops repeated identical repairs after restart without losing its original', async () => {
 const root=await mkdtemp(path.join(tmpdir(),'aid-repair-hub-'));const old=process.env.AID_COMPANION_DATA_DIR;process.env.AID_COMPANION_DATA_DIR=root;
 try {
  const draft=generationDraft('hub-test',['private-fixture-key']);await draft.save('{"action":"keep"}');let calls=0;
  const run=()=>recoverGeneration({draft:generationDraft('hub-test',['private-fixture-key']),attempts:3,parse:()=>{throw Error('missing field');},generate:async raw=>{calls++;return raw;}});
  await assert.rejects(run(),/修复中枢/);assert.equal(calls,2);
  await assert.rejects(run(),/修复中枢/);assert.equal(calls,2);
  assert.equal(await draft.read(),'{"action":"keep"}');
 } finally {if(old===undefined)delete process.env.AID_COMPANION_DATA_DIR;else process.env.AID_COMPANION_DATA_DIR=old;await rm(root,{recursive:true,force:true});}
});
test('cached voice link expiry restores exact audio without another synthesis, including after upload failure',async()=>{
 const root=await mkdtemp(path.join(tmpdir(),'aid-voice-expiry-'));let synth=0,uploads=0,expired=false,fail=false;const audio=Buffer.alloc(1600,3);
 const deps={root,ready:async()=>{},available:async url=>!expired||url==='https://new/audio.mp3',synthesize:async()=>{synth++;return{buffer:audio,voiceId:'same'};},upload:async buffer=>{uploads++;assert.deepEqual(buffer,audio);if(fail)throw Error('upload failed');return{secure_url:expired?'https://new/audio.mp3':'https://old/audio.mp3',duration:8};}};
 const input={voiceId:'same',fishAudioKey:'fixture',language:'zh',strictVoice:true};
 try{
  await createVoiceReferenceService(deps)(input);expired=true;fail=true;
  await assert.rejects(createVoiceReferenceService(deps)(input),/试读已保留/);fail=false;
  const result=await createVoiceReferenceService(deps)(input);assert.equal(result.url,'https://new/audio.mp3');assert.equal(result.voiceId,'same');assert.equal(synth,1);assert.equal(uploads,3);
  await createVoiceReferenceService(deps)(input);assert.equal(uploads,3);
 }finally{await rm(root,{recursive:true,force:true});}
});


test('invalid image input and terminal receipts override stale resumable task context',()=>{
 for(const error of ['Invalid image file or mode for image 1','invalid_image_file',Object.assign(new Error('render failed'),{name:'TerminalImageTaskError'}),Object.assign(new Error('render failed'),{name:'TerminalVideoTaskError'})]){
  const decision=diagnoseRepair(error,{taskId:'stale-known-id',resumable:true,validation:true});
  assert.equal(decision.automatic,false);assert.notEqual(decision.action,'resume-task');assert.notEqual(decision.action,'repair-text');
 }
});
test('terminal image failure preserves one original receipt across persistence and repeated reports',async()=>{
 const {recordImageTaskFailure}=await import('../lib/imageTaskFailure.ts');
 const original={id:'shot-9',status:'generating',taskId:'paid-task',imageTaskMode:'single',prompt:'keep'};
 const failed=recordImageTaskFailure(original,'invalid_image_file');
 assert.equal(failed.taskId,'paid-task');assert.equal(failed.status,'failed');assert.equal(failed.prompt,'keep');assert.equal(failed.imageTaskMode,'single');
 const restored=recordImageTaskFailure(JSON.parse(JSON.stringify(failed)),'invalid_image_file');
 assert.equal(restored.imageFailureHistory.length,1);assert.equal(restored.imageFailureHistory[0].taskId,'paid-task');assert.equal(original.status,'generating');
});
