import fs from 'node:fs';

const responsive = fs.readFileSync('packages/design-tokens/responsive-layout.css', 'utf8');
const dataDisplay = fs.readFileSync('packages/design-tokens/data-display.css', 'utf8');
const overlays = fs.readFileSync('packages/design-tokens/overlays.css', 'utf8');
const adminLayout = fs.readFileSync('apps/web-admin/app/layout.tsx', 'utf8');
const memberLayout = fs.readFileSync('apps/web-member/app/layout.tsx', 'utf8');
const memberChrome = fs.readFileSync('apps/web-member/app/member-chrome.tsx', 'utf8');
const memberHome = fs.readFileSync('apps/web-member/app/member-home.tsx', 'utf8');
const mobileHeaderOwner = fs.readFileSync('apps/web-member/app/components/public-mobile-source-header-owner.tsx', 'utf8');
const mobileHeaderPath = 'apps/web-member/app/components/public-mobile-source-header.tsx';
const mobileHeader = fs.existsSync(mobileHeaderPath)
  ? fs.readFileSync(mobileHeaderPath, 'utf8')
  : '';

const legacyNavigationContract = memberChrome.includes('PUBLIC_HOME_NAV.map');
const desktopRuntimeNavigationContract = [
  memberChrome.includes('navigation={runtime.navigation}'),
  memberChrome.includes('navigation.filter((item) => item.desktop).map'),
  memberChrome.includes("viewportMode === 'desktop'"),
].every(Boolean);
const activeMobileHeaderContract = [
  fs.existsSync(mobileHeaderPath),
  mobileHeader.includes('runtime.navigation.filter'),
  mobileHeader.includes('item.mobile'),
].every(Boolean);
const mobileHomeNavigationContract = [
  !fs.existsSync(mobileHeaderPath),
  mobileHeaderOwner.includes('return null'),
  memberHome.includes("viewportMode === 'mobile'"),
  memberHome.includes('<MobileHomeRoot'),
  memberHome.includes('<MobileCategoryTabRuntime'),
].every(Boolean);
const runtimeNavigationContract = desktopRuntimeNavigationContract
  && (activeMobileHeaderContract || mobileHomeNavigationContract);

const checks = [
  ['shared container', responsive.includes('.ui-container')],
  ['shared stack', responsive.includes('.ui-stack')],
  ['shared grid', responsive.includes('.ui-grid')],
  ['shared safe area', responsive.includes('.ui-safe-area') && responsive.includes('env(safe-area-inset-bottom)')],
  ['shared visibility', responsive.includes('.ui-desktop-only') && responsive.includes('.ui-mobile-only')],
  ['mobile-first tablet enhancement', responsive.includes('@media (min-width: 768px)')],
  ['mobile-first desktop enhancement', responsive.includes('@media (min-width: 1024px)')],
  ['admin imports responsive source', adminLayout.includes('packages/design-tokens/responsive-layout.css')],
  ['member imports responsive source', memberLayout.includes('packages/design-tokens/responsive-layout.css')],
  ['table to card contract', dataDisplay.includes('.ui-table[data-mobile="cards"]') && dataDisplay.includes('content: attr(data-label)')],
  ['modal to bottom sheet contract', overlays.includes('@media (max-width: 767px)') && overlays.includes('bottom: 0') && overlays.includes('border-radius: var(--radius-modal) var(--radius-modal) 0 0')],
  [
    'member navigation contract',
    (legacyNavigationContract || runtimeNavigationContract)
      && memberChrome.includes('public-home-desktop-bar')
      && memberChrome.includes('member-desktop-nav'),
  ],
  ['responsive sidebar width contract', responsive.includes('.ui-responsive-sidebar') && responsive.includes('--layout-drawer-width')],
];

const failed = checks.filter(([, passed]) => !passed);
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
if (failed.length) process.exit(1);
console.log(`R-013 responsive contract passed (${checks.length} checks).`);
