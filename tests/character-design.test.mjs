import assert from 'node:assert/strict';
import test from 'node:test';

import { buildCharacterBiblePrompt, buildCharacterConceptGridPrompt } from '../lib/promptArchitecture.ts';
import { buildCloudinaryGridCellUrls } from '../lib/gridCloudinary.ts';
import { buildGptCharacterBiblePrompt, buildGptCharacterConceptPrompt, buildGptSceneReferencePrompt, buildGptCharacterAnchorPrompt } from '../lib/gptImageReferences.ts';
import { parseImageAppearanceCheck } from '../lib/series/imageAppearanceAudit.ts';
import { isTransientAutoProductionError } from '../lib/autoProduction.ts';

test('ordinary character portraits preserve the brief without unrelated fitting or creature instructions', () => {
  const description = '成年女性，妆容精致，身形利落，服装和配饰讲究，常用明亮色或高级感中性色；始终重视名牌包、餐桌摆盘和自拍状态，情绪变化从兴奋张扬到短暂嘴硬、迟疑，最后松弛下来。';
  const prompt = buildGptCharacterAnchorPrompt({ name: '小雨', description, costumeDesc: '米色外套与耳饰', age: '成年', hasIdentityReference: false });
  assert.ok(prompt.includes(description));
  assert.match(prompt, /米色外套与耳饰/);
  assert.match(prompt, /AGE: 成年/);
  assert.match(prompt, /retain the specified makeup/);
  assert.doesNotMatch(prompt, /Image 1|References lock|merfolk|tail|creature|fitting.room|wardrobe fitting|physically present|do not invent.*makeup/i);
  assert.ok(prompt.length < 1200);
  assert.equal(isTransientAutoProductionError('The generated content was filtered by the safety system.'), false);
});

test('portrait reference and authored age remain authoritative without making everyone an adult', () => {
  const prompt = buildGptCharacterAnchorPrompt({ name: 'Mira', description: 'A young mermaid in a green coat', age: '10', hasIdentityReference: true });
  assert.match(prompt, /Image 1 defines/);
  assert.match(prompt, /AGE: 10/);
  assert.match(prompt, /fish tail/);
  assert.doesNotMatch(prompt, /adult|over 21|wardrobe fitting/i);
});

test('photographic anchor keeps merfolk anatomy without requesting a multi-view layout', () => {
  const prompt = buildGptCharacterAnchorPrompt({name:'Luna',description:'A mermaid with a silver hair streak',hasIdentityReference:true});
  assert.match(prompt, /One photograph only, no character sheet/);
  assert.match(prompt, /Merfolk retain their fish tail, never human legs or shoes/);
});

test('appearance review distinguishes failures and uncertainty from passed photography', () => {
  assert.equal(parseImageAppearanceCheck('{"medium":"photographic","evidence":[]}').photographic,true);
  assert.equal(parseImageAppearanceCheck('{"medium":"cg_or_illustration","evidence":["drawn hair"]}').photographic,false);
  assert.equal(parseImageAppearanceCheck('{"medium":"uncertain","evidence":[]}').photographic,null);
  assert.throws(()=>parseImageAppearanceCheck('{"medium":"good","evidence":[]}'));
});

test('photographic GPT role cards lock species and identity without inheriting CG medium', () => {
  const prompt = buildGptCharacterBiblePrompt({ name: 'Bram', description: 'An elderly shark person with a scarred muzzle and dark armor', hasIdentityReference: true, visualStyle: 'cinematic-natural' });
  assert.match(prompt, /photorealistic costume-continuity/);
  assert.match(prompt, /not their rendering style/);
  assert.match(prompt, /never redesigned into human actors/);
  assert.match(prompt, /Four supporting full-body photographs/);
  assert.doesNotMatch(prompt, /source medium intact|8 consistent head|identity and medium authority/);
  assert.match(prompt, /do not invent freckles, scars/i);
});

test('explicit nonphotographic styles retain the original reference-card contract', () => {
  for (const visualStyle of ['anime', '3d-cg', 'stop-motion', 'follow-reference']) {
    const input = { name: 'Hero', description: 'Fixed design', visualStyle, hasIdentityReference: true };
    assert.equal(buildGptCharacterBiblePrompt(input), buildCharacterBiblePrompt(input));
    const concept = { ...input, candidateCount: 4, hasReferences: true };
    assert.equal(buildGptCharacterConceptPrompt(concept), buildCharacterConceptGridPrompt(concept));
  }
});

test('GPT scouting reference depicts one usable location rather than several miniatures', () => {
  const prompt = buildGptSceneReferencePrompt('Underwater throne hall with pearl columns', 'cinematic-natural', '1:1');
  assert.match(prompt, /one photorealistic location-scouting photograph, 1:1/);
  assert.match(prompt, /Underwater throne hall/);
  assert.doesNotMatch(prompt, /hero establishing view plus/);
});

test('builds four- and nine-direction character selection boards', () => {
  const four = buildCharacterConceptGridPrompt({
    name: 'Meme',
    role: 'Mermaid',
    age: 'Childlike',
    personality: 'curious, playful, gentle, brave',
    coreTheme: 'A fearless explorer with a kind heart',
    description: 'large brown curls, warm brown eyes, turquoise tail',
    costumeDesc: 'green shell pendant and green bandeau',
    candidateCount: 4,
    visualStyle: '3d-cinema',
  });
  const nine = buildCharacterConceptGridPrompt({
    name: 'Meme',
    description: 'large brown curls, warm brown eyes, turquoise tail',
    candidateCount: 9,
  });

  assert.match(four, /exactly 4 distinct candidates/i);
  assert.match(four, /2 by 2 grid/i);
  assert.match(nine, /exactly 9 distinct candidates/i);
  assert.match(nine, /3 by 3 grid/i);
  assert.match(four, /one character per cell/i);
});

test('carries locked character metadata into the final production bible', () => {
  const prompt = buildCharacterBiblePrompt({
    name: 'Meme',
    role: 'Mermaid',
    age: 'Childlike',
    personality: 'curious, playful, gentle, brave',
    coreTheme: 'A fearless explorer with a kind heart',
    description: 'large brown curls, warm brown eyes, turquoise tail',
    costumeDesc: 'green shell pendant and green bandeau',
    hasIdentityReference: true,
    visualStyle: '3d-cinema',
  });

  assert.match(prompt, /Role \/ identity: Mermaid/);
  assert.match(prompt, /Approximate age: Childlike/);
  assert.match(prompt, /Personality keywords: curious, playful, gentle, brave/);
  assert.match(prompt, /Silhouette lock/);
  assert.match(prompt, /Expression system: 8/);
  assert.match(prompt, /Continuity palette/);
});

test('splits concept contact sheets according to the selected grid size', () => {
  const source = 'https://res.cloudinary.com/demo/image/upload/v1/character-grid.jpg';
  const four = buildCloudinaryGridCellUrls(source, 2048, 2048, 2);
  const nine = buildCloudinaryGridCellUrls(source, 3072, 3072, 3);
  assert.equal(four.length, 4);
  assert.equal(nine.length, 9);
  assert.notEqual(four[0], four[1]);
  assert.notEqual(nine[0], nine[8]);
});
