import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const appDir = process.cwd().endsWith(`${path.sep}app`) ? process.cwd() : path.join(process.cwd(), 'app');
const layout = readFileSync(path.join(appDir, 'layout.tsx'), 'utf8');
const viewportCss = readFileSync(path.join(appDir, 'admin-full-viewport-layout.css'), 'utf8');
const professionalCss = readFileSync(path.join(appDir, 'admin-professional-authority.css'), 'utf8');
const permanentSidebarCss = readFileSync(path.join(appDir, 'admin-permanent-sidebar.css'), 'utf8');
const staticGroupsCss = readFileSync(path.join(appDir, 'admin-static-sidebar-groups.css'), 'utf8');
const smartAccordionCss = readFileSync(path.join(appDir, 'admin-sidebar-smart-accordion.css'), 'utf8');
const dataPageCss = readFileSync(path.join(appDir, 'admin-data-page-layout.css'), 'utf8');
const universalFullWidthCss = readFileSync(path.join(appDir, 'admin-universal-full-width.css'), 'utf8');
const protectedLayout = readFileSync(path.join(appDir, '(admin)', 'layout.tsx'), 'utf8');
const dashboardPage = readFileSync(path.join(appDir, '(admin)', 'dashboard', 'page.tsx'), 'utf8');
const dashboardProfessional = readFileSync(path.join(appDir, '(admin)', 'dashboard', 'dashboard-professional.tsx'), 'utf8');

const controlsImport = "import './admin-release-controls.css'";
const shellImport = "import './admin-shell-layout.css'";
const profileImport = "import './admin-shell-profile-popover.css'";
const adoptionImport = "import './admin-modernization-adoption.css'";
const uxImport = "import './admin-ux-overrides.css'";
const viewportImport = "import './admin-full-viewport-layout.css'";
const professionalImport = "import './admin-professional-authority.css'";
const permanentSidebarImport = "import './admin-permanent-sidebar.css'";
const staticGroupsImport = "import './admin-static-sidebar-groups.css'";
const smartAccordionImport = "import './admin-sidebar-smart-accordion.css'";
const dataPageImport = "import './admin-data-page-layout.css'";
const universalFullWidthImport = "import './admin-universal-full-width.css'";

test('loads Admin presentation authorities in stable override order', () => {
  const controlsIndex = layout.indexOf(controlsImport);
  const shellIndex = layout.indexOf(shellImport);
  const profileIndex = layout.indexOf(profileImport);
  const adoptionIndex = layout.indexOf(adoptionImport);
  const uxIndex = layout.indexOf(uxImport);
  const viewportIndex = layout.indexOf(viewportImport);
  const professionalIndex = layout.indexOf(professionalImport);
  const permanentSidebarIndex = layout.indexOf(permanentSidebarImport);
  const staticGroupsIndex = layout.indexOf(staticGroupsImport);
  const smartAccordionIndex = layout.indexOf(smartAccordionImport);
  const dataPageIndex = layout.indexOf(dataPageImport);
  const universalFullWidthIndex = layout.indexOf(universalFullWidthImport);

  assert.ok(controlsIndex >= 0);
  assert.ok(shellIndex > controlsIndex);
  assert.ok(profileIndex > shellIndex);
  assert.ok(adoptionIndex > profileIndex);
  assert.ok(uxIndex > adoptionIndex);
  assert.ok(viewportIndex > uxIndex);
  assert.ok(professionalIndex > viewportIndex);
  assert.ok(permanentSidebarIndex > professionalIndex);
  assert.ok(staticGroupsIndex > permanentSidebarIndex);
  assert.ok(smartAccordionIndex > staticGroupsIndex);
  assert.ok(dataPageIndex > smartAccordionIndex);
  assert.ok(universalFullWidthIndex > dataPageIndex);
  assert.equal(layout.slice(universalFullWidthIndex + universalFullWidthImport.length).includes("import './admin-"), false);
});

test('standardizes professional page headers and safe text spacing', () => {
  assert.match(professionalCss, /\.admin-content-shell \.admin-ui-page__head[\s\S]*min-height: 112px/);
  assert.match(professionalCss, /grid-template-columns: minmax\(0, 1fr\) auto !important/);
  assert.match(professionalCss, /\.admin-ui-page__head h1[\s\S]*font-size: clamp\(27px, 2\.1vw, 35px\)/);
  assert.match(professionalCss, /overflow-wrap: anywhere/);
  assert.match(professionalCss, /table th:first-child[\s\S]*padding-left/);
  assert.match(professionalCss, /table td:last-child[\s\S]*padding-right/);
});

test('uses underline locale tabs instead of an input-looking language box', () => {
  assert.match(professionalCss, /\.admin-topbar \.admin-language-toggle[\s\S]*border: 0 !important/);
  assert.match(professionalCss, /button\[aria-pressed='true'\][\s\S]*color: #f8fafc !important/);
  assert.match(professionalCss, /button\[aria-pressed='true'\]::after[\s\S]*background: #7c8cff/);
  assert.match(protectedLayout, /changeLocale\('th'\)/);
  assert.match(protectedLayout, /changeLocale\('en'\)/);
});

test('keeps the desktop sidebar permanent while submenus follow the active route', () => {
  assert.match(permanentSidebarCss, /\.admin-collapse-button[\s\S]*display: none !important/);
  assert.match(permanentSidebarCss, /\.admin-shell--collapsed[\s\S]*padding-left: var\(--admin-shell-sidebar-width\) !important/);
  assert.match(staticGroupsCss, /Permanent Admin navigation groups/);
  assert.match(smartAccordionCss, /Route-aware Admin sidebar accordion/);
  assert.match(smartAccordionCss, /\.admin-nav-group__trigger[\s\S]*pointer-events: auto !important/);
  assert.match(smartAccordionCss, /\.admin-nav-group__chevron[\s\S]*display: inline-flex !important/);
  assert.match(smartAccordionCss, /\.admin-nav-submenu\[data-open='false'\][\s\S]*grid-template-rows: 0fr !important/);
  assert.match(smartAccordionCss, /\.admin-nav-submenu\[data-open='true'\][\s\S]*grid-template-rows: minmax\(0, 1fr\) !important/);
  assert.match(protectedLayout, /setOpenGroups\(activeGroup \? new Set\(\[activeGroup\.id\]\) : new Set\(\)\)/);
});

test('removes the legacy shell grid and expands single dashboard panels', () => {
  assert.match(viewportCss, /\.admin-shell[\s\S]*display: block !important/);
  assert.match(viewportCss, /grid-template-columns: none !important/);
  assert.match(viewportCss, /\.admin-main-shell[\s\S]*width: 100% !important/);
  assert.match(viewportCss, /section:has\(> article:only-child\)[\s\S]*grid-template-columns: minmax\(0, 1fr\) !important/);
  assert.match(viewportCss, /article:only-child[\s\S]*grid-column: 1 \/ -1 !important/);
});

test('pins root loading and authorization states to the complete viewport', () => {
  assert.match(viewportCss, /body\[data-app-surface='admin'\][\s\S]*width: 100%/);
  assert.match(viewportCss, /\.admin-app-state,[\s\S]*\.admin-loading-screen[\s\S]*position: fixed !important/);
  assert.match(viewportCss, /\.admin-loading-screen[\s\S]*inset: 0 !important/);
  assert.match(viewportCss, /\.admin-loading-screen[\s\S]*min-height: 100dvh !important/);
});

test('lets data-heavy pages use the whole card width', () => {
  assert.match(viewportCss, /Data-heavy pages must use the whole card/);
  assert.match(viewportCss, /\.admin-content-shell table[\s\S]*width: 100% !important/);
  assert.match(viewportCss, /\.admin-content-shell table[\s\S]*min-width: 100% !important/);
  assert.match(viewportCss, /:has\(> table\)[\s\S]*max-width: none !important/);
});

test('uses a full-width authority for games, provider presets and wallet analytics', () => {
  assert.match(dataPageCss, /Full-width authority for data-heavy Admin pages/);
  assert.match(dataPageCss, /input\[placeholder='เช่น demo-slot-001'\][\s\S]*grid-template-columns: minmax\(260px, 2fr\)/);
  assert.match(dataPageCss, /input\[placeholder='ชื่อ, รหัส หรือรูปแบบ'\][\s\S]*minmax\(440px, 1\.55fr\)/);
  assert.match(dataPageCss, /\.admin-wallet-analytics__hero[\s\S]*minmax\(0, 2fr\) minmax\(300px, \.8fr\)/);
  assert.match(dataPageCss, /\.admin-wallet-analytics__table-shell[\s\S]*width: 100% !important/);
  assert.match(dataPageCss, /@media \(max-width: 720px\)[\s\S]*grid-template-columns: minmax\(0, 1fr\) !important/);
});

test('enforces full-width behavior across every Admin route', () => {
  assert.match(universalFullWidthCss, /Universal full-width authority for the Admin workspace/);
  assert.match(universalFullWidthCss, /\.admin-content-shell \.admin-ui-page > \*/);
  assert.match(universalFullWidthCss, /\.admin-ui-grid:has\(> :only-child\)[\s\S]*grid-template-columns: minmax\(0, 1fr\) !important/);
  assert.match(universalFullWidthCss, /\.admin-ui-grid > :only-child[\s\S]*grid-column: 1 \/ -1 !important/);
  assert.match(universalFullWidthCss, /form\[style\*='grid'\][\s\S]*repeat\(auto-fit, minmax\(min\(240px, 100%\), 1fr\)\)/);
  assert.match(universalFullWidthCss, /:where\(table,[\s\S]*width: 100% !important/);
  assert.match(universalFullWidthCss, /@media \(max-width: 720px\)[\s\S]*grid-template-columns: minmax\(0, 1fr\) !important/);
});

test('puts finance wallet and risk charts before recent dashboard activity', () => {
  assert.match(dashboardPage, /dashboard-professional/);
  assert.match(dashboardProfessional, /Deposits vs withdrawals today/);
  assert.match(dashboardProfessional, /Wallet balance composition/);
});
