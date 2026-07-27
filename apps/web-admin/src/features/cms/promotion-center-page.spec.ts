import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const boundarySource = readFileSync(new URL('./promotion-center-page.tsx', import.meta.url), 'utf8');
const source = readFileSync(new URL('./promotion-center-media-page.tsx', import.meta.url), 'utf8');

test('promotion center delegates to the responsive media implementation', () => {
  assert.equal(boundarySource.includes('promotion-center-media-page'), true);
  assert.equal(boundarySource.includes('adminApiFetch'), false);
  assert.equal(boundarySource.includes('useState'), false);
});

test('promotion center keeps lifecycle and compatibility contract', () => {
  assert.equal(source.includes("type PromotionLifecycle = 'draft' | 'published' | 'archived'"), true);
  assert.equal(source.includes("item.lifecycle === 'published' || item.enabled === true"), true);
  assert.equal(source.includes("lifecycle === 'published' && item.enabled !== false"), true);
  assert.equal(source.includes('desktopImageUrl'), true);
  assert.equal(source.includes('mobileImageUrl'), true);
});

test('promotion center keeps search and lifecycle filtering', () => {
  assert.equal(source.includes('setQuery(event.target.value)'), true);
  assert.equal(source.includes('setFilter(event.target.value as LifecycleFilter)'), true);
  assert.equal(source.includes("filter === 'all' || item.lifecycle === filter"), true);
});

test('promotion center keeps bulk archive confirmation', () => {
  assert.equal(source.includes('selectedIds'), true);
  assert.equal(source.includes('archiveSelected'), true);
  assert.equal(source.includes('open={confirmArchive}'), true);
  assert.equal(source.includes("lifecycle: 'archived', enabled: false"), true);
});

test('member preview only shows published enabled campaigns', () => {
  assert.equal(source.includes("item.lifecycle === 'published' && item.enabled"), true);
  assert.equal(source.includes('preview.slice(0, 6)'), true);
});

test('promotion center keeps unsaved changes protection', () => {
  assert.equal(source.includes('useAdminUnsavedChanges'), true);
  assert.equal(source.includes('AdminUnsavedChangesNotice'), true);
  assert.equal(source.includes('canUpdate && isDirty'), true);
});

test('promotion center uses shared confirmation before discarding edits', () => {
  assert.equal(source.includes('confirmReload'), true);
  assert.equal(source.includes('requestReload'), true);
  assert.equal(source.includes('open={confirmReload}'), true);
  assert.equal(source.includes('setConfirmReload(false); void load();'), true);
  assert.equal(source.includes('window.confirm'), false);
});

test('promotion center releases loading and saving states in finally blocks', () => {
  assert.equal(source.includes('setLoading(false);'), true);
  assert.equal(source.includes('setSaving(false);'), true);
  assert.equal((source.match(/finally \{/g) ?? []).length >= 2, true);
});
