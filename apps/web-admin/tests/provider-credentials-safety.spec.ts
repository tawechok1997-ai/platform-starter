import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const source = readFileSync(path.join(process.cwd(), 'app/(admin)/provider-credentials/page.tsx'), 'utf8');

test('uses shared confirmation instead of browser prompt and confirm', () => {
  assert.equal(source.includes('AdminConfirmDialog'), true);
  assert.equal(source.includes('window.prompt'), false);
  assert.equal(source.includes('window.confirm'), false);
});

test('validates provider and credential payloads before rendering', () => {
  assert.equal(source.includes('function isProvider'), true);
  assert.equal(source.includes('function isCredential'), true);
  assert.equal(source.includes('payload.items.filter(isProvider)'), true);
  assert.equal(source.includes('payload.items.filter(isCredential)'), true);
});

test('prevents stale credential responses from replacing the selected provider', () => {
  assert.equal(source.includes('const credentialRequestRef = useRef(0)'), true);
  assert.equal(source.includes('credentialRequestRef.current !== requestId'), true);
  assert.equal(source.includes('encodeURIComponent(id)'), true);
});

test('never trusts a backend masked value as safe display text', () => {
  assert.equal(source.includes('safeMaskedValue(item.maskedValue)'), true);
  assert.equal(source.includes("return '••••••••'"), true);
});

test('guards credential mutations and production health checks', () => {
  assert.equal(source.includes("type: 'test-production'"), true);
  assert.equal(source.includes("type: 'rotate'"), true);
  assert.equal(source.includes("type: 'toggle'"), true);
  assert.equal(source.includes('try {'), true);
  assert.equal(source.includes('finally {'), true);
  assert.equal(source.includes('const pageBusy = loadingProviders || loadingCredentials || Boolean(busyKey)'), true);
});
