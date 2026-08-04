import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const appRoot = path.resolve(process.cwd(), 'app');
const layoutSource = readFileSync(path.join(appRoot, 'layout.tsx'), 'utf8');
const cssSource = readFileSync(path.join(appRoot, 'admin-modern-audit.css'), 'utf8');
const auditSource = readFileSync(path.join(appRoot, '(admin)/audit/page.tsx'), 'utf8');
const activitySource = readFileSync(path.join(appRoot, '(admin)/activity-center/page.tsx'), 'utf8');

test('loads audit styles after governance styles', () => {
  const governanceIndex = layoutSource.indexOf("import './admin-modern-governance.css';");
  const auditIndex = layoutSource.indexOf("import './admin-modern-audit.css';");
  assert.notEqual(governanceIndex, -1);
  assert.notEqual(auditIndex, -1);
  assert.equal(auditIndex > governanceIndex, true);
});

test('keeps Audit Logs class based and redacted', () => {
  assert.equal(auditSource.includes('admin-audit-page'), true);
  assert.equal(auditSource.includes('admin-audit-filter-grid'), true);
  assert.equal(auditSource.includes('admin-audit-payload'), true);
  assert.equal(auditSource.includes('stringifyAdminPayload(value)'), true);
  assert.equal(auditSource.includes('const logBoxStyle'), false);
  assert.equal(auditSource.includes('const preStyle'), false);
});

test('keeps Activity Center responsive and class based', () => {
  assert.equal(activitySource.includes('admin-activity-center'), true);
  assert.equal(activitySource.includes('admin-activity-event__button'), true);
  assert.equal(activitySource.includes('<AdminDrawer'), true);
  assert.equal(activitySource.includes('admin-activity-drawer'), false);
  assert.equal(activitySource.includes('const rowStyle'), false);
  assert.equal(activitySource.includes('const detailButtonStyle'), false);
});

test('preserves mobile payload, drawer and reduced-motion behavior', () => {
  assert.equal(cssSource.includes('@media (max-width: 720px)'), true);
  assert.equal(cssSource.includes('env(safe-area-inset-top)'), true);
  assert.equal(cssSource.includes('env(safe-area-inset-bottom)'), true);
  assert.equal(cssSource.includes('@media (prefers-reduced-motion: reduce)'), true);
  assert.equal(cssSource.includes('max-height: 360px'), true);
});