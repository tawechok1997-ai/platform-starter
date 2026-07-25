import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const appRoot = path.resolve(process.cwd(), 'app');
const layoutSource = readFileSync(path.join(appRoot, 'layout.tsx'), 'utf8');
const cssSource = readFileSync(path.join(appRoot, 'admin-modern-platform-ops.css'), 'utf8');
const providerSource = readFileSync(path.join(appRoot, '(admin)/provider-health/page.tsx'), 'utf8');
const growthSource = readFileSync(path.join(appRoot, '(admin)/growth-center/page.tsx'), 'utf8');

test('loads platform operations styles after audit styles', () => {
  const auditIndex = layoutSource.indexOf("import './admin-modern-audit.css';");
  const platformIndex = layoutSource.indexOf("import './admin-modern-platform-ops.css';");
  assert.notEqual(auditIndex, -1);
  assert.notEqual(platformIndex, -1);
  assert.equal(platformIndex > auditIndex, true);
});

test('keeps Provider Health views and actions class based', () => {
  assert.equal(providerSource.includes('admin-provider-health'), true);
  assert.equal(providerSource.includes('admin-provider-health__views'), true);
  assert.equal(providerSource.includes('admin-provider-health__actions'), true);
  assert.equal(providerSource.includes("toLocaleString('th-TH')"), true);
  assert.equal(providerSource.includes("style={{ display: 'flex'"), false);
});

test('keeps Growth Center queues and read-only guard explicit', () => {
  assert.equal(growthSource.includes('admin-growth-center__queue-grid'), true);
  assert.equal(growthSource.includes('admin-growth-queue__row'), true);
  assert.equal(growthSource.includes('admin-growth-center__guard'), true);
  assert.equal(growthSource.includes('ไม่อนุมัติ ไม่จ่ายเงิน'), true);
  assert.equal(growthSource.includes("toLocaleString('th-TH')"), true);
});

test('preserves responsive and reduced-motion platform operations behavior', () => {
  assert.equal(cssSource.includes('@media (max-width: 1099px)'), true);
  assert.equal(cssSource.includes('@media (max-width: 720px)'), true);
  assert.equal(cssSource.includes('env(safe-area-inset-bottom)'), true);
  assert.equal(cssSource.includes('@media (prefers-reduced-motion: reduce)'), true);
});
