import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const appDir = process.cwd().endsWith(`${path.sep}app`) ? process.cwd() : path.join(process.cwd(), 'app');
const css = readFileSync(path.join(appDir, 'admin-release-readiness.css'), 'utf8');
const controlsCss = readFileSync(path.join(appDir, 'admin-release-controls.css'), 'utf8');
const layout = readFileSync(path.join(appDir, 'layout.tsx'), 'utf8');
const controller = readFileSync(path.join(appDir, 'admin-mobile-drawer-controller.tsx'), 'utf8');
const protectedLayout = readFileSync(path.join(appDir, '(admin)', 'admin-protected-layout.tsx'), 'utf8');

const controlsImport = "import './admin-release-controls.css'";

test('loads release correction and control layers after every legacy admin stylesheet', () => {
  const readinessIndex = layout.indexOf("import './admin-release-readiness.css'");
  const controlsIndex = layout.indexOf(controlsImport);
  const previousLayerIndex = layout.indexOf("import './admin-modern-platform-ops.css'");
  assert.ok(readinessIndex > previousLayerIndex);
  assert.ok(controlsIndex > readinessIndex);
  assert.equal(layout.slice(controlsIndex + controlsImport.length).includes("import './admin-"), false);
});

test('uses one tablet and mobile breakpoint in CSS and the drawer controller', () => {
  assert.match(css, /@media \(min-width: 1100px\)/);
  assert.match(css, /@media \(max-width: 1099px\)/);
  assert.match(controlsCss, /@media \(max-width: 1099px\)/);
  assert.match(controller, /MOBILE_DRAWER_MEDIA = '\(max-width: 1099px\)'/);
});

test('keeps sidebar open, collapse and profile controls visible on desktop', () => {
  assert.match(css, /\.admin-collapse-button,\s*\.admin-menu-button[\s\S]*display: inline-flex !important/);
  assert.match(css, /grid-template-rows: auto auto minmax\(0, 1fr\) auto !important/);
  assert.match(css, /\.admin-sidebar-footer[\s\S]*display: grid !important/);
});

test('keeps the complete profile menu and sign-out action inside the viewport', () => {
  assert.match(css, /\.admin-profile-menu--sidebar[\s\S]*inset: auto 0 calc\(100% \+ 8px\) 0 !important/);
  assert.match(css, /\.admin-profile-menu__logout[\s\S]*position: sticky/);
  assert.match(controlsCss, /admin-profile-menu__identity[\s\S]*display: grid !important/);
  assert.match(controlsCss, /admin-profile-menu__security[\s\S]*display: flex !important/);
  assert.match(protectedLayout, /className="admin-profile-menu__logout"/);
  assert.match(protectedLayout, /clearAdminSession\(\)/);
  assert.match(protectedLayout, /window\.location\.href = '\/login'/);
  assert.match(controller, /className="admin-mobile-drawer-controller__logout"/);
});

test('keeps every mobile drawer action visible without horizontal scrolling', () => {
  assert.match(controlsCss, /admin-mobile-drawer-controller__footer[\s\S]*repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(controlsCss, /admin-mobile-drawer-controller__footer[\s\S]*overflow: visible !important/);
  assert.match(controlsCss, /admin-mobile-drawer-controller__logout/);
  assert.equal(controlsCss.includes('overflow-x: auto'), false);
});

test('neutralizes legacy global width, padding, overflow and gold theme rules', () => {
  assert.match(controlsCss, /--brand: var\(--admin-modern-brand\)/);
  assert.match(controlsCss, /--card: var\(--admin-modern-surface\)/);
  assert.match(controlsCss, /\.admin-content-shell > main[\s\S]*max-width: none !important/);
  assert.match(controlsCss, /\.admin-content-shell > main[\s\S]*padding: 0 !important/);
  assert.match(controlsCss, /\.admin-content-shell section,[\s\S]*overflow: visible !important/);
  assert.match(controlsCss, /\.admin-topbar[\s\S]*display: grid !important/);
});

test('keeps card headers, actions, rows and filters within their parent width', () => {
  assert.match(controlsCss, /\.admin-ui-card__head[\s\S]*grid-template-columns: minmax\(0, 1fr\) auto !important/);
  assert.match(controlsCss, /\.admin-ui-card__action[\s\S]*flex-wrap: wrap !important/);
  assert.match(controlsCss, /\.admin-ui-row,[\s\S]*grid-template-columns: minmax\(0, 1fr\) auto !important/);
  assert.match(controlsCss, /\.admin-ui-toolbar,[\s\S]*flex-wrap: wrap !important/);
  assert.match(controlsCss, /@media \(max-width: 720px\)[\s\S]*grid-template-columns: 1fr !important/);
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

test('keeps the tablet topbar controls from colliding', () => {
  assert.match(controlsCss, /min-width: 1100px\) and \(max-width: 1350px/);
  assert.match(controlsCss, /\.admin-command-trigger > span/);
  assert.match(controlsCss, /\.admin-topbar-status/);
});

test('honors reduced motion for shell interactions', () => {
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /animation: none !important/);
  assert.match(controlsCss, /@media \(prefers-reduced-motion: reduce\)/);
});
