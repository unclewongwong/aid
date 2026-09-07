import test from 'node:test';
import assert from 'node:assert/strict';
import {hasExplicitGenerationModels} from '../lib/settingsReadiness.ts';
test('fresh, partial and corrupt browser settings cannot authorize fallback image/script models',()=>{
 for(const value of [undefined,null,{},[],{apiKey:'fixture'},{imageModel:'gpt-image-2'},{imageModel:' ',scriptModel:'gpt-4o'},'{}']) assert.equal(hasExplicitGenerationModels(value),false);
 assert.equal(hasExplicitGenerationModels({imageModel:'gpt-image-2',scriptModel:'gpt-5.6-luna'}),true);
 assert.equal(hasExplicitGenerationModels({imageModel:'seedream-5-0-pro',scriptModel:'gpt-4o'}),true);
});
