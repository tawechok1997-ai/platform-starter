import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const appDir = process.cwd().endsWith(`${path.sep}app`) ? process.cwd() : path.join(process.cwd(), 'app');
const css = readFileSync(path.join(appDir, 'admin-release-readiness.css'), 'utf8');
const layout = readFileSync(path.join(appDir, 'layout.tsx'), 'utf8');
const controller = readFileSync(path.join(appDir, 'admin-mobile-drawer-controller.tsx'), 'utf8');
const protectedLayout = readFileSync(path.join(appDir, '(admin)', 'admin-protected-layout.tsx'), 'utf8');

test('loads the release correction layer after every legacy admin stylesheet', () => {
  const readinessIndex = layout.indexOf("import './admin-release-readiness.css'");
  const previousLayerIndex = layout.indexOf("import './admin-modern-platform-ops.css'");
  assert.ok(readinessIndex > previousLayerIndex);
  assert.equal(layout.slice(readinessIndex).includes("import './admin-"), false);
});

test('uses one tablet and mobile breakpoint in CSS and the drawer controller', () => {
  assert.match(css, /@media \(min-width: 1100px\)/);
  assert.match(css, /@media \(max-width: 1099px\)/);
  assert.match(controller, /MOBILE_DRAWER_MEDIA = '\(max-width: 1099px\)'/);
});

test('keeps sidebar open, collapse and profile controls visible on desktop', () => {
  assert.match(css, /\.admin-collapse-button,\s*\.admin-menu-button[\s\S]*display: inline-flex !important/);
  assert.match(css, /grid-template-rows: auto auto minmax\(0, 1fr\) auto !important/);
  assert.match(css, /\.admin-sidebar-footer[\s\S]*display: grid !important/);
});

test('keeps the profile menu and sign-out action inside the viewport', () => {
  assert.match(css, /\.admin-profile-menu--sidebar[\s\S]*inset: auto 0 calc\(100% \+ 8px\) 0 !important/);
  assert.match(css, /\.admin-profile-menu__logout[\s\S]*position: sticky/);
  assert.match(protectedLayout, /className="admin-profile-menu__logout"/);
  assert.match(protectedLayout, /clearAdminSession\(\)/);
  assert.match(protectedLayout, /window\.location\.href = '\/login'/);
  assert.match(controller, /className="admin-mobile-drawer-controller__logout"/);
});

test('allows every admin page and card to use the available workspace', () => {
  assert.match(css, /\.admin-ui-page,\s*\.admin-dashboard \.admin-ui-page[\s\S]*width: 100% !important/);
  assert.match(css, /\.admin-ui-card[\s\S]*overflow: visible !important/);
  assert.match(css, /\.admin-content-shell[\s\S]*width: 100% !important/);
});

test('uses a proportional dashboard grid without fixed clipping', () => {
  assert.match(css, /admin-finance-chart\)[\s\S]*grid-column: span 8 !important/);
  assert.match(css, /admin-risk-chart\)[\s\S]*grid-column: span 4 !important/);
  assert.match(css, /admin-dashboard__quick[\s\S]*repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(css, /admin-finance-chart__plot[\s\S]*height: auto !important/);
});

test('uses an admin-specific palette and production typography stack', () => {
  assert.match(css, /--admin-modern-brand: #38bdf8/);
  assert.match(css, /--admin-modern-cyan: #2dd4bf/);
  assert.match(css, /LINE Seed Sans TH/);
  assert.match(css, /Noto Sans Thai/);
  assert.match(layout, /themeColor: '#061019'/);
});

test('honors reduced motion for shell interactions', () => {
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /animation: none !important/);
});
