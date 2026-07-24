import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const source = readFileSync(path.join(process.cwd(), 'app/(admin)/anti-bot/page.tsx'), 'utf8');

test('presents anti-bot setup as a four-step readiness flow', () => {
  assert.equal(source.includes('Setup Checklist'), true);
  assert.equal(source.includes('<Step number="1"'), true);
  assert.equal(source.includes('<Step number="2"'), true);
  assert.equal(source.includes('<Step number="3"'), true);
  assert.equal(source.includes('<Step number="4"'), true);
  assert.equal(source.includes('Setup progress'), true);
});

test('blocks unsafe enable and stale credential testing', () => {
  assert.equal(source.includes("const providerReady = providerTested || (config.enabled && config.secretConfigured && !credentialsDirty)"), true);
  assert.equal(source.includes('const readyToEnable = hasSiteKey && hasSecret && hasProtectedRoute && providerReady'), true);
  assert.equal(source.includes('if (config.enabled && !readyToEnable)'), true);
  assert.equal(source.includes('if (value && !readyToEnable)'), true);
  assert.equal(source.includes('const savedProviderConfig = hasSiteKey && config.secretConfigured && !credentialsDirty'), true);
  assert.equal(source.includes("if (!savedProviderConfig)"), true);
  assert.equal(source.includes('disabled={saving || (!config.enabled && !readyToEnable)}'), true);
});

test('validates API payloads and serializes async actions', () => {
  assert.equal(source.includes("type BusyKey = '' | 'load' | 'save' | 'test'"), true);
  assert.equal(source.includes('if (busyKey) return;'), true);
  assert.equal(source.includes('!isConfig(payload)'), true);
  assert.equal(source.includes('!isTestResult(payload)'), true);
  assert.equal(source.includes('finally'), true);
  assert.equal(source.includes('data?.message'), false);
  assert.equal(source.includes('Promise.all'), false);
});

test('locks editable controls while anti-bot requests are active', () => {
  assert.equal(source.includes('disabled={saving}'), true);
  assert.equal(source.includes("busyKey === 'load'"), true);
  assert.equal(source.includes("busyKey === 'test'"), true);
  assert.equal(source.includes("busyKey === 'save'"), true);
});

test('uses the shared admin UI contract throughout the anti-bot page', () => {
  for (const component of ['AdminPage', 'AdminCard', 'AdminMetricGrid', 'AdminMetric', 'AdminNotice', 'AdminButton', 'AdminStack']) {
    assert.equal(source.includes(component), true, `${component} must remain in use`);
  }
});