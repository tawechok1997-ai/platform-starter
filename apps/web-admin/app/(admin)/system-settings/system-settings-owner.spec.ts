import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('./page.tsx', import.meta.url), 'utf8');

test('system settings route uses the central P6 ownership registry', () => {
  assert.match(source, /ADMIN_SETTINGS_ROUTE_REGISTRY/);
  assert.match(source, /definition\.owner === '\/system-settings'/);
  assert.match(source, /definition\.replacementRoute \?\? definition\.route/);
});

test('system settings route adopts shared P7 surfaces instead of local layout owners', () => {
  for (const component of ['AdminPage', 'AdminCard', 'AdminGrid', 'AdminMetricGrid', 'AdminStack']) {
    assert.equal(source.includes(component), true, `${component} must remain in the system settings workspace`);
  }
  assert.equal(source.includes('style={{'), false);
  assert.equal(source.includes('<table'), false);
  assert.equal(source.includes('position: fixed'), false);
});

test('sensitive provider settings expose permission and ownership context', () => {
  assert.match(source, /Permission: \{definition\.permissionBase\}/);
  assert.match(source, /Write owner เดียว/);
  assert.match(source, /การยืนยัน, เหตุผล และ Audit/);
});
