import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const appDir = process.cwd().endsWith(`${path.sep}app`) ? process.cwd() : path.join(process.cwd(), 'app');
const layout = readFileSync(path.join(appDir, 'layout.tsx'), 'utf8');
const shellCss = readFileSync(path.join(appDir, 'admin-shell-layout.css'), 'utf8');
const profileCss = readFileSync(path.join(appDir, 'admin-shell-profile-popover.css'), 'utf8');
const adoptionCss = readFileSync(path.join(appDir, 'admin-modernization-adoption.css'), 'utf8');
const viewportCss = readFileSync(path.join(appDir, 'admin-full-viewport-layout.css'), 'utf8');
const professionalCss = readFileSync(path.join(appDir, 'admin-professional-authority.css'), 'utf8');
const controller = readFileSync(path.join(appDir, 'admin-mobile-drawer-controller.tsx'), 'utf8');
const protectedLayout = readFileSync(path.join(appDir, '(admin)', 'layout.tsx'), 'utf8');
const navConfig = readFileSync(path.join(appDir, '(admin)', 'admin-nav.ts'), 'utf8');
const dashboardPage = readFileSync(path.join(appDir, '(admin)', 'dashboard', 'page.tsx'), 'utf8');
const dashboardProfessional = readFileSync(path.join(appDir, '(admin)', 'dashboard', 'dashboard-professional.tsx'), 'utf8');
const dataTable = readFileSync(path.join(appDir, '..', 'src', 'features', 'admin-modernization', 'data-table.tsx'), 'utf8');
const dataTableCss = readFileSync(path.join(appDir, '..', 'src', 'features', 'admin-modernization', 'data-table.module.css'), 'utf8');

const controlsImport = "import './admin-release-controls.css'";
const shellImport = "import './admin-shell-layout.css'";
const profileImport = "import './admin-shell-profile-popover.css'";
const adoptionImport = "import './admin-modernization-adoption.css'";
const uxImport = "import './admin-ux-overrides.css'";
const viewportImport = "import './admin-full-viewport-layout.css'";
const professionalImport = "import './admin-professional-authority.css'";

test('loads the professional Admin authority after legacy and viewport presentation CSS', () => {
  const controlsIndex = layout.indexOf(controlsImport);
  const shellIndex = layout.indexOf(shellImport);
  const profileIndex = layout.indexOf(profileImport);
  const adoptionIndex = layout.indexOf(adoptionImport);
  const uxIndex = layout.indexOf(uxImport);
  const viewportIndex = layout.indexOf(viewportImport);
  const professionalIndex = layout.indexOf(professionalImport);

  assert.ok(controlsIndex >= 0);
  assert.ok(shellIndex > controlsIndex);
  assert.ok(profileIndex > shellIndex);
  assert.ok(adoptionIndex > profileIndex);
  assert.ok(uxIndex > adoptionIndex);
  assert.ok(viewportIndex > uxIndex);
  assert.ok(professionalIndex > viewportIndex);
  assert.equal(layout.slice(professionalIndex + professionalImport.length).includes("import './admin-"), false);
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

test('puts finance wallet and risk charts before recent dashboard activity', () => {
  assert.match(dashboardPage, /dashboard-professional/);
  assert.match(dashboardProfessional, /Deposits vs withdrawals today/);
  assert.match(dashboardProfessional, /Wallet balance composition/);
  assert.match(dashboardProfessional, /Open risk severity/);
  assert.match(dashboardProfessional, /conic-gradient/);
  assert.ok(dashboardProfessional.indexOf('title={t.insights}') < dashboardProfessional.indexOf('title={t.recentActivity}'));
});

test('keeps important permission-allowed routes visible in the sidebar', () => {
  assert.doesNotMatch(navConfig, /sidebar: false/);
  for (const route of ['/operations', '/wallets', '/reports', '/member-insights', '/support-center', '/game-providers', '/webhook-logs', '/promotion-center', '/admin-roles', '/audit']) {
    assert.match(navConfig, new RegExp(`href: '${route.replaceAll('/', '\\/')}'`));
  }
});

test('fails closed for unregistered Admin routes', () => {
  assert.match(navConfig, /denyUnregisteredRoutePermission/);
  assert.match(navConfig, /return \[denyUnregisteredRoutePermission\] as const/);
  assert.match(navConfig, /canAccessNavItem/);
});

test('uses one 1100px desktop and mobile shell breakpoint', () => {
  assert.match(shellCss, /@media \(min-width: 1100px\)/);
  assert.match(shellCss, /@media \(max-width: 1099px\)/);
  assert.match(profileCss, /@media \(min-width: 1100px\)/);
  assert.match(profileCss, /@media \(max-width: 1099px\)/);
  assert.match(controller, /MOBILE_DRAWER_MEDIA = '\(max-width: 1099px\)'/);
});

test('keeps desktop sidebar collapse and mobile menu controls mutually exclusive', () => {
  assert.match(shellCss, /@media \(min-width: 1100px\)[\s\S]*\.admin-menu-button,[\s\S]*display: none !important/);
  assert.match(shellCss, /@media \(min-width: 1100px\)[\s\S]*\.admin-collapse-button[\s\S]*display: inline-flex !important/);
  assert.match(shellCss, /@media \(max-width: 1099px\)[\s\S]*\.admin-menu-button[\s\S]*display: inline-grid !important/);
  assert.match(shellCss, /@media \(max-width: 1099px\)[\s\S]*\.admin-collapse-button[\s\S]*display: none !important/);
});

test('keeps the complete profile and sign-out flow inside the viewport', () => {
  assert.match(shellCss, /\.admin-profile-menu--sidebar \.admin-profile-menu__logout[\s\S]*position: sticky/);
  assert.match(profileCss, /#admin-sidebar \.admin-profile-menu--sidebar[\s\S]*left: calc\(100% \+ 12px\)/);
  assert.match(profileCss, /max-height: min\(520px, calc\(100dvh - 24px\)\)/);
  assert.match(protectedLayout, /className="admin-profile-menu__logout"/);
  assert.match(protectedLayout, /clearAdminSession\(\)/);
  assert.match(protectedLayout, /window\.location\.href = '\/login'/);
  assert.match(controller, /className="admin-mobile-drawer-controller__logout"/);
});

test('keeps mobile drawer actions visible without horizontal scrolling', () => {
  assert.match(shellCss, /admin-mobile-drawer-controller__footer[\s\S]*repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(shellCss, /admin-mobile-drawer-controller__footer[\s\S]*overflow: visible !important/);
  assert.match(shellCss, /padding-bottom: calc\(env\(safe-area-inset-bottom\) \+ 154px\)/);
});

test('uses one sidebar offset and lets Admin content use the available workspace', () => {
  assert.match(shellCss, /--admin-shell-sidebar-width: 248px/);
  assert.match(shellCss, /--admin-shell-sidebar-collapsed-width: 72px/);
  assert.match(shellCss, /\.admin-shell[\s\S]*padding-left: var\(--admin-shell-sidebar-width\) !important/);
  assert.match(shellCss, /\.admin-main-shell[\s\S]*margin-left: 0 !important/);
  assert.match(shellCss, /\.admin-content-shell[\s\S]*max-width: none !important/);
  assert.match(shellCss, /--admin-shell-content-max: 1920px/);
});

test('keeps cards and grids responsive without fixed-height clipping', () => {
  assert.match(shellCss, /\.admin-content-shell \.admin-ui-card,[\s\S]*height: auto !important/);
  assert.match(shellCss, /max-height: none !important/);
  assert.match(shellCss, /grid-template-columns: repeat\(auto-fit, minmax\(min\(360px, 100%\), 1fr\)\)/);
  assert.match(adoptionCss, /\.admin-content-shell > \*[\s\S]*min-width: 0/);
});

test('uses proportional dashboard charts and safe mobile collapse', () => {
  assert.match(shellCss, /admin-risk-chart\)[\s\S]*grid-column: span 4 !important/);
  assert.match(shellCss, /admin-finance-chart\)[\s\S]*grid-column: span 8 !important/);
  assert.match(shellCss, /admin-dashboard__sections[\s\S]*minmax\(0, 1\.25fr\) minmax\(360px, \.75fr\)/);
  assert.match(shellCss, /@media \(max-width: 720px\)[\s\S]*grid-template-columns: 1fr !important/);
});

test('provides a responsive shared data table and mobile list pattern', () => {
  assert.match(dataTable, /export function AdminDataTable/);
  assert.match(dataTable, /className=\{styles\.desktopScroller\}/);
  assert.match(dataTable, /className=\{styles\.mobileList\}/);
  assert.match(dataTable, /getPaginationTokens/);
  assert.match(dataTableCss, /\.table th[\s\S]*position: sticky/);
  assert.match(dataTableCss, /@media \(max-width: 760px\)[\s\S]*\.desktopScroller[\s\S]*display: none/);
  assert.match(dataTableCss, /@media \(max-width: 760px\)[\s\S]*\.mobileList[\s\S]*display: block/);
});

test('uses production typography, compact number alignment and reduced motion', () => {
  assert.match(shellCss, /font-family: Inter, "Noto Sans Thai", "Leelawadee UI"/);
  assert.match(shellCss, /font-weight: 700 !important/);
  assert.match(dataTableCss, /font-variant-numeric: tabular-nums/);
  assert.match(adoptionCss, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(dataTableCss, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(layout, /themeColor: '#061019'/);
});
