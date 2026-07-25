import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const appRoot = path.resolve(process.cwd(), 'app');
const layoutSource = readFileSync(path.join(appRoot, 'layout.tsx'), 'utf8');
const css = readFileSync(path.join(appRoot, 'admin-modern-command-center.css'), 'utf8');

test('loads the modern Admin layer after all legacy presentation layers', () => {
  const legacyIndex = layoutSource.indexOf("import './admin-sidebar-profile-header.css';");
  const modernIndex = layoutSource.indexOf("import './admin-modern-command-center.css';");
  assert.notEqual(legacyIndex, -1);
  assert.notEqual(modernIndex, -1);
  assert.equal(modernIndex > legacyIndex, true);
});

test('defines a coherent command-center token system', () => {
  for (const token of [
    '--admin-modern-bg',
    '--admin-modern-surface',
    '--admin-modern-border',
    '--admin-modern-brand',
    '--admin-modern-success',
    '--admin-modern-warning',
    '--admin-modern-danger',
    '--admin-modern-sidebar',
    '--admin-modern-content',
  ]) assert.equal(css.includes(token), true, `${token} must remain defined`);
});

test('supports desktop, tablet, mobile and narrow-phone layouts', () => {
  assert.equal(css.includes('@media (min-width: 1100px)'), true);
  assert.equal(css.includes('@media (max-width: 1099px)'), true);
  assert.equal(css.includes('@media (max-width: 720px)'), true);
  assert.equal(css.includes('@media (max-width: 420px)'), true);
  assert.equal(css.includes('env(safe-area-inset-bottom)'), true);
});

test('keeps data-heavy Admin surfaces professional and usable', () => {
  assert.equal(css.includes("body[data-app-surface='admin'] table"), true);
  assert.equal(css.includes('position: sticky'), true);
  assert.equal(css.includes('overflow-x: auto'), true);
  assert.equal(css.includes('font-variant-numeric: tabular-nums'), true);
  assert.equal(css.includes('.admin-ui-filter-bar__controls'), true);
});

test('styles finance and risk charts with purposeful motion', () => {
  assert.equal(css.includes('.admin-finance-chart__plot'), true);
  assert.equal(css.includes('.admin-finance-chart__bar > span'), true);
  assert.equal(css.includes('.admin-risk-chart'), true);
  assert.equal(css.includes('@keyframes admin-modern-chart-grow'), true);
  assert.equal(css.includes('@keyframes admin-modern-chart-grow-x'), true);
});

test('respects reduced-motion accessibility', () => {
  assert.equal(css.includes('@media (prefers-reduced-motion: reduce)'), true);
  assert.equal(css.includes('animation-duration: .01ms !important'), true);
  assert.equal(css.includes('transition-duration: .01ms !important'), true);
});
