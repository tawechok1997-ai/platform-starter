import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const root = process.cwd();
const layout = readFileSync(join(root, 'app/layout.tsx'), 'utf8');
const runtime = readFileSync(join(root, 'app/admin-appearance-runtime.tsx'), 'utf8');
const styles = readFileSync(join(root, 'app/admin-appearance-foundation.css'), 'utf8');
const completeness = readFileSync(join(root, 'app/admin-theme-completeness.css'), 'utf8');
const legacyNormalizer = readFileSync(join(root, 'app/admin-legacy-theme-normalizer.tsx'), 'utf8');

test('admin root boots one shared appearance owner before hydration', () => {
  assert.match(layout, /admin_appearance_preferences_v1/);
  assert.match(layout, /admin-appearance-bootstrap/);
  assert.match(layout, /<AdminAppearanceRuntime\s*\/>/);
  assert.match(layout, /<AdminLegacyThemeNormalizer\s*\/>/);
  assert.match(layout, /admin-appearance-foundation\.css/);
  assert.match(layout, /colorScheme:\s*'dark light'/);
});

test('appearance runtime owns theme density contrast and motion preferences', () => {
  assert.match(runtime, /type AdminThemePreference = 'light' \| 'dark' \| 'system'/);
  assert.match(runtime, /type AdminDensityPreference = 'comfortable' \| 'compact'/);
  assert.match(runtime, /type AdminContrastPreference = 'normal' \| 'high'/);
  assert.match(runtime, /type AdminMotionPreference = 'system' \| 'reduced'/);
  assert.match(runtime, /root\.dataset\.adminTheme/);
  assert.match(runtime, /root\.dataset\.adminDensity/);
  assert.match(runtime, /root\.dataset\.adminContrast/);
  assert.match(runtime, /root\.dataset\.adminMotion/);
  assert.match(runtime, /admin:appearance-change/);
});

test('appearance dialog is portaled outside the sticky topbar on every viewport', () => {
  assert.match(runtime, /const panelRef = useRef<HTMLElement>\(null\)/);
  assert.match(runtime, /rootRef\.current\?\.contains\(target\) \|\| panelRef\.current\?\.contains\(target\)/);
  assert.match(runtime, /createPortal\(<div className="admin-appearance-floating">\{panel\}<\/div>, document\.body\)/);
});

test('appearance foundation covers light dark compact high contrast and reduced motion', () => {
  assert.match(styles, /:root\[data-admin-theme='dark'\]/);
  assert.match(styles, /:root\[data-admin-theme='light'\]/);
  assert.match(styles, /:root\[data-admin-density='compact'\]/);
  assert.match(styles, /:root\[data-admin-contrast='high'\]/);
  assert.match(styles, /:root\[data-admin-motion='reduced'\]/);
  assert.match(styles, /@media \(max-width: 560px\)/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
});

test('theme completeness is the final Admin stylesheet authority', () => {
  const integrityImport = layout.indexOf("import './admin-layout-integrity.css';");
  const themeImport = layout.indexOf("import './admin-theme-completeness.css';");
  const runtimeImport = layout.indexOf("import { AdminMobileDrawerController }");

  assert.ok(integrityImport >= 0, 'layout integrity authority must remain imported');
  assert.ok(themeImport > integrityImport, 'theme completeness must load after every legacy/layout stylesheet');
  assert.ok(runtimeImport > themeImport, 'no later stylesheet may override the final theme authority');
});

test('theme completeness remaps legacy palettes and shared surfaces to appearance tokens', () => {
  assert.match(completeness, /:root\[data-admin-theme='dark'\]/);
  assert.match(completeness, /:root\[data-admin-theme='light'\]/);
  assert.match(completeness, /--admin-modern-bg:\s*var\(--color-canvas\)/);
  assert.match(completeness, /--admin-modern-surface:\s*var\(--color-surface\)/);
  assert.match(completeness, /--admin-bg:\s*var\(--color-canvas\)/);
  assert.match(completeness, /--admin-surface:\s*var\(--color-surface\)/);
  assert.match(completeness, /\.admin-topbar/);
  assert.match(completeness, /\.admin-drawer/);
  assert.match(completeness, /\.admin-ui-card/);
  assert.match(completeness, /\.admin-data-table__scroll/);
  assert.match(completeness, /input:not\(\[type='checkbox'\]\)/);
  assert.match(completeness, /\.admin-ui-payload/);
});

test('legacy stylesheet and inline neutral palettes are normalized to live appearance tokens', () => {
  assert.match(legacyNormalizer, /BACKGROUND_TOKENS/);
  assert.match(legacyNormalizer, /TEXT_TOKENS/);
  assert.match(legacyNormalizer, /BORDER_TOKENS/);
  assert.match(legacyNormalizer, /window\.getComputedStyle\(element\)/);
  assert.match(legacyNormalizer, /MutationObserver/);
  assert.match(legacyNormalizer, /attributeFilter:\s*\['class'\]/);
  assert.match(legacyNormalizer, /admin:appearance-change/);
  assert.match(legacyNormalizer, /\[data-preview-viewport\]/);
  assert.match(legacyNormalizer, /var\(--color-surface-raised\)/);
  assert.match(legacyNormalizer, /var\(--color-text-secondary\)/);
  assert.match(legacyNormalizer, /var\(--color-border-subtle\)/);
});
