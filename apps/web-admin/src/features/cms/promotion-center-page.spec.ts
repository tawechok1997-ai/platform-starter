import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('./promotion-center-page.tsx', import.meta.url), 'utf8');

test('promotion center keeps lifecycle and compatibility contract', () => {
  assert.equal(source.includes("type PromotionLifecycle = 'draft' | 'published' | 'archived'"), true);
  assert.equal(source.includes("item.lifecycle === 'published' || item.enabled === true"), true);
  assert.equal(source.includes("lifecycle === 'published' && item.enabled !== false"), true);
});

test('promotion center keeps search and lifecycle filtering', () => {
  assert.equal(source.includes("setQuery(event.target.value)"), true);
  assert.equal(source.includes("setLifecycleFilter"), true);
  assert.equal(source.includes("matchesQuery && matchesLifecycle"), true);
});

test('promotion center keeps bulk archive confirmation', () => {
  assert.equal(source.includes('selectedIds'), true);
  assert.equal(source.includes('archiveSelected'), true);
  assert.equal(source.includes('<AdminConfirmDialog'), true);
  assert.equal(source.includes("lifecycle: 'archived', enabled: false"), true);
});

test('member preview only shows published enabled campaigns', () => {
  assert.equal(source.includes("item.lifecycle === 'published' && item.enabled"), true);
  assert.equal(source.includes('sortedPreview.slice(0, 4)'), true);
});

test('promotion center keeps unsaved changes protection', () => {
  assert.equal(source.includes('useAdminUnsavedChanges'), true);
  assert.equal(source.includes('AdminUnsavedChangesNotice'), true);
});
