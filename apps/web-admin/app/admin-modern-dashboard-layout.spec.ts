import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const appRoot = path.resolve(process.cwd(), 'app');
const layout = readFileSync(path.join(appRoot, 'layout.tsx'), 'utf8');
const css = readFileSync(path.join(appRoot, 'admin-modern-dashboard-layout.css'), 'utf8');

test('loads dashboard composition after the shared modern Admin system', () => {
  const sharedIndex = layout.indexOf("import './admin-modern-command-center.css';");
  const dashboardIndex = layout.indexOf("import './admin-modern-dashboard-layout.css';");
  assert.notEqual(sharedIndex, -1);
  assert.notEqual(dashboardIndex, -1);
  assert.equal(dashboardIndex > sharedIndex, true);
});

test('uses a twelve-column desktop analytics composition', () => {
  assert.equal(css.includes('grid-template-columns: repeat(12, minmax(0, 1fr))'), true);
  assert.equal(css.includes(".admin-ui-card:has(.admin-risk-chart)"), true);
  assert.equal(css.includes(".admin-ui-card:has(.admin-finance-chart)"), true);
  assert.equal(css.includes('grid-column: span 5'), true);
  assert.equal(css.includes('grid-column: span 7'), true);
});

test('collapses analytics safely for tablet and mobile', () => {
  assert.equal(css.includes('@media (max-width: 1280px)'), true);
  assert.equal(css.includes('@media (max-width: 860px)'), true);
  assert.equal(css.includes('@media (max-width: 720px)'), true);
  assert.equal(css.includes('grid-template-columns: 1fr'), true);
});

test('keeps chart values readable and numerically aligned', () => {
  assert.equal(css.includes('font-variant-numeric: tabular-nums'), true);
  assert.equal(css.includes(".admin-finance-chart__net[data-tone='positive']"), true);
  assert.equal(css.includes(".admin-finance-chart__net[data-tone='negative']"), true);
  assert.equal(css.includes(".admin-risk-chart__pressure[data-tone='danger']"), true);
});
