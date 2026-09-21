import test from 'node:test';
import assert from 'node:assert/strict';
import {
  APIMART_REGION_COOKIE,
  DEFAULT_APIMART_REGION,
  getApiMartBaseUrl,
  normalizeApiMartRegion,
} from '../lib/apimartRegion.ts';

test('APIMart overseas route remains the safe default', () => {
  assert.equal(DEFAULT_APIMART_REGION, 'overseas');
  assert.equal(normalizeApiMartRegion(undefined), 'overseas');
  assert.equal(normalizeApiMartRegion('unexpected'), 'overseas');
  assert.equal(getApiMartBaseUrl('overseas'), 'https://api.apimart.ai/v1');
});

test('APIMart mainland route uses the domestic host', () => {
  assert.equal(normalizeApiMartRegion('mainland'), 'mainland');
  assert.equal(getApiMartBaseUrl('mainland'), 'https://api.aishuch.com/v1');
  assert.equal(APIMART_REGION_COOKIE, 'aid_apimart_region');
});
