import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('./use-mobile-member-content-sources.ts', import.meta.url), 'utf8');

test('promotion dedupe guards indexed array access before merging', () => {
  assert.match(source, /const existing = typeof existingIndex === 'number' \? result\[existingIndex\] : undefined/);
  assert.match(source, /if \(existing && typeof existingIndex === 'number'\) \{/);
  assert.match(source, /const merged = mergeCampaign\(existing, campaign\)/);
  assert.match(source, /campaignKeys\(merged\)/);
  assert.doesNotMatch(source, /mergeCampaign\(result\[existingIndex\], campaign\)/);
});

test('promotion asset normalization guards the first split segment', () => {
  assert.match(source, /const pathWithoutQuery = value\.split/);
  assert.match(source, /pathWithoutQuery\.trim\(\)\.toLowerCase\(\)/);
  assert.doesNotMatch(source, /return value\.split/);
});
