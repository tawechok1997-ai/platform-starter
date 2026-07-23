import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('./content-center-page.tsx', import.meta.url), 'utf8');

test('content center adopts lifecycle controls and published-only previews', () => {
  assert.equal(source.includes('LifecycleEditorCard'), true);
  assert.equal(source.includes('cmsLifecyclePatch'), true);
  assert.equal(source.includes('isCmsPublished'), true);
  assert.equal(source.includes("lifecycle !== 'published'"), true);
});

test('content center exposes editable normalized raw JSON', () => {
  assert.equal(source.includes('parseCmsContentJson'), true);
  assert.equal(source.includes('aria-label="CMS Raw JSON"'), true);
  assert.equal(source.includes('applyRawJson'), true);
  assert.equal(source.includes('resetRawJson'), true);
});

test('content center guards unapplied JSON and form edits', () => {
  assert.equal(source.includes("pendingRawJson: rawDirty ? rawJson : ''"), true);
  assert.equal(source.includes('AdminUnsavedChangesNotice'), true);
  assert.equal(source.includes('open={confirmReload}'), true);
  assert.equal(source.includes('window.confirm'), false);
});

test('content center releases async state through finally blocks', () => {
  assert.equal(source.includes('setLoading(false);'), true);
  assert.equal(source.includes('setSaving(false);'), true);
  assert.equal(source.includes('setUploading(false);'), true);
  assert.equal((source.match(/finally \{/g) ?? []).length >= 4, true);
});

test('content center keeps private asset upload and usage guards', () => {
  assert.equal(source.includes("'/admin/settings/cms-assets'"), true);
  assert.equal(source.includes('assetUsage(content, asset.id)'), true);
  assert.equal(source.includes('SHA-256'), true);
});
