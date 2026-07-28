import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const appDir = process.cwd().endsWith(`${path.sep}app`) ? process.cwd() : path.join(process.cwd(), 'app');
const rootLayout = readFileSync(path.join(appDir, 'layout.tsx'), 'utf8');
const css = readFileSync(path.join(appDir, 'admin-content-insets.css'), 'utf8');

test('loads the content inset authority after every legacy Admin layout stylesheet', () => {
  const fullWidthIndex = rootLayout.indexOf("import './admin-universal-full-width.css'");
  const insetIndex = rootLayout.indexOf("import './admin-content-insets.css'");
  const controllerIndex = rootLayout.indexOf("import { AdminMobileDrawerController }");

  assert.ok(fullWidthIndex >= 0);
  assert.ok(insetIndex > fullWidthIndex);
  assert.ok(controllerIndex > insetIndex);
  assert.match(rootLayout, /<body data-app-surface="admin">/);
});

test('keeps a readable page gutter on desktop, tablet and narrow mobile screens', () => {
  assert.match(css, /--admin-page-inline-inset:\s*clamp\(24px,\s*2\.3vw,\s*36px\)/);
  assert.match(css, /\.admin-content-shell > \.admin-ui-page[\s\S]*padding-inline:\s*var\(--admin-page-inline-inset\) !important/);
  assert.match(css, /@media \(max-width: 1023px\)[\s\S]*--admin-page-inline-inset:\s*20px/);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*--admin-page-inline-inset:\s*16px/);
  assert.match(css, /padding-left:\s*max\(var\(--admin-page-inline-inset\),\s*env\(safe-area-inset-left\)\) !important/);
  assert.match(css, /padding-right:\s*max\(var\(--admin-page-inline-inset\),\s*env\(safe-area-inset-right\)\) !important/);
});

test('normalizes card, metric, row, toolbar, filter and state-surface insets', () => {
  for (const selector of [
    '.admin-ui-card',
    '.admin-ui-command-panel',
    '.admin-ui-metric',
    '.admin-ui-row',
    '.admin-ui-section-row',
    '.admin-ui-toolbar',
    '.admin-ui-action-strip',
    '.admin-ui-filter-bar',
    '.admin-ui-empty',
    '.admin-ui-notice',
    '.admin-ui-skeleton',
  ]) {
    assert.ok(css.includes(selector), `missing inset authority for ${selector}`);
  }

  assert.match(css, /\.admin-ui-card,[\s\S]*\.admin-ui-command-panel[\s\S]*padding:\s*var\(--admin-surface-inline-inset\) !important/);
  assert.match(css, /--admin-surface-inline-inset:\s*18px/);
  assert.match(css, /--admin-compact-inline-inset:\s*16px/);
});

test('protects long copy, table edges and confirmation dialog content', () => {
  assert.match(css, /overflow-wrap:\s*anywhere/);
  assert.match(css, /white-space:\s*pre-wrap/);
  assert.match(css, /:where\(th, td\)[\s\S]*padding-inline:\s*var\(--admin-table-inline-inset\) !important/);
  assert.match(css, /:where\(th, td\):first-child[\s\S]*padding-left:/);
  assert.match(css, /:where\(th, td\):last-child[\s\S]*padding-right:/);
  assert.match(css, /\.admin-confirm-layer[\s\S]*safe-area-inset-left[\s\S]*safe-area-inset-right/);
  assert.match(css, /\.admin-confirm-dialog[\s\S]*padding:\s*var\(--admin-surface-inline-inset\) !important/);
});
