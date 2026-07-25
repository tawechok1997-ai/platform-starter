import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const appRoot = path.resolve(process.cwd(), 'app');
const layout = readFileSync(path.join(appRoot, 'layout.tsx'), 'utf8');
const css = readFileSync(path.join(appRoot, 'admin-modern-modules.css'), 'utf8');

test('loads module polish after the shared command-center and dashboard layers', () => {
  const sharedIndex = layout.indexOf("import './admin-modern-command-center.css';");
  const dashboardIndex = layout.indexOf("import './admin-modern-dashboard-layout.css';");
  const moduleIndex = layout.indexOf("import './admin-modern-modules.css';");
  assert.notEqual(sharedIndex, -1);
  assert.notEqual(dashboardIndex, -1);
  assert.notEqual(moduleIndex, -1);
  assert.equal(moduleIndex > sharedIndex, true);
  assert.equal(moduleIndex > dashboardIndex, true);
});

test('keeps data tables, selected rows and sticky bulk actions professional', () => {
  assert.equal(css.includes('.admin-data-table__toolbar'), true);
  assert.equal(css.includes("tbody tr[data-selected='true']"), true);
  assert.equal(css.includes("tbody tr[aria-selected='true']"), true);
  assert.equal(css.includes('.admin-bulk-action'), true);
  assert.equal(css.includes('position: sticky'), true);
  assert.equal(css.includes('env(safe-area-inset-bottom)'), true);
});

test('styles reports with readable chart grids and animated values', () => {
  assert.equal(css.includes('.admin-reports__chart'), true);
  assert.equal(css.includes('.admin-reports__bar-fill'), true);
  assert.equal(css.includes('@keyframes admin-module-bar'), true);
  assert.equal(css.includes('font-variant-numeric: tabular-nums'), true);
});

test('organizes promotion and risk operations as responsive workflows', () => {
  assert.equal(css.includes('.admin-promotion-ops__tabs'), true);
  assert.equal(css.includes('.admin-promotion-ops__toolbar'), true);
  assert.equal(css.includes('.admin-promotion-ops__card'), true);
  assert.equal(css.includes('.admin-risk-operations__flow'), true);
  assert.equal(css.includes('.admin-risk-operations__step'), true);
  assert.equal(css.includes('@media (max-width: 720px)'), true);
});

test('respects reduced motion across data and operation modules', () => {
  assert.equal(css.includes('@media (prefers-reduced-motion: reduce)'), true);
  assert.equal(css.includes('animation-duration: .01ms !important'), true);
  assert.equal(css.includes('transition-duration: .01ms !important'), true);
});
