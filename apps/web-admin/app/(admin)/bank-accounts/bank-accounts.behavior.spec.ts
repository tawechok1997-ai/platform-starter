import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('./page.tsx', import.meta.url), 'utf8');

test('bank accounts use the shared Admin locale contract', () => {
  assert.match(source, /useAdminLocale/);
  assert.match(source, /copyByLocale/);
  assert.match(source, /th:/);
  assert.match(source, /en:/);
});

test('bank account async mutations always clean up state', () => {
  assert.match(source, /finally \{ setLoading\(false\); \}/);
  assert.match(source, /finally \{ setSaving\(false\); \}/);
  assert.ok((source.match(/finally \{ setBusyId\(''\); \}/g)?.length ?? 0) >= 2);
});

test('bank accounts do not surface backend error messages directly', () => {
  assert.doesNotMatch(source, /data\?\.message/);
  assert.match(source, /copy\.loadFailed/);
  assert.match(source, /copy\.saveFailed/);
  assert.match(source, /copy\.reviewFailed/);
});

test('bank account financial controls stay disabled while busy', () => {
  assert.match(source, /const queueBusy = loading \|\| saving \|\| Boolean\(busyId\)/);
  assert.match(source, /disabled=\{queueBusy\}/);
});
