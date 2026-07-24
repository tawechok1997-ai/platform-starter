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

test('blocks enabling anti-bot until keys routes and provider test are ready', () => {
  assert.equal(source.includes('const readyToEnable = hasSiteKey && hasSecret && hasProtectedRoute && providerTested'), true);
  assert.equal(source.includes('if (config.enabled && !readyToEnable)'), true);
  assert.equal(source.includes('if (value && !readyToEnable)'), true);
  assert.equal(source.includes('disabled={saving || (!config.enabled && !readyToEnable)}'), true);
});

test('uses the shared admin UI contract throughout the anti-bot page', () => {
  for (const component of ['AdminPage', 'AdminCard', 'AdminMetricGrid', 'AdminMetric', 'AdminNotice', 'AdminButton', 'AdminStack']) {
    assert.equal(source.includes(component), true, `${component} must remain in use`);
  }
});
