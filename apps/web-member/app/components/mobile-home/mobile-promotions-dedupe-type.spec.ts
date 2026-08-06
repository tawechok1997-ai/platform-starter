import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const route = readFileSync(new URL('../../mobile/member/promotions/page.tsx', import.meta.url), 'utf8');

test('promotion dedupe guards indexed array access before merging', () => {
  assert.match(route, /const existingCampaign = result\[existingIndex\]/);
  assert.match(route, /if \(existingCampaign\) \{/);
  assert.match(route, /const mergedCampaign = mergeCampaign\(existingCampaign, campaign\)/);
  assert.match(route, /campaignKeys\(mergedCampaign\)/);
  assert.doesNotMatch(route, /mergeCampaign\(result\[existingIndex\], campaign\)/);
});

test('promotion asset normalization guards the first split segment', () => {
  assert.match(route, /const pathWithoutQuery = value\.split/);
  assert.match(route, /pathWithoutQuery\.trim\(\)\.toLowerCase\(\)/);
  assert.doesNotMatch(route, /return value\.split/);
});
