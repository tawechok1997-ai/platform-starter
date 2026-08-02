import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const root = process.cwd();
const layout = readFileSync(join(root, 'app/layout.tsx'), 'utf8');
const runtime = readFileSync(join(root, 'app/admin-appearance-runtime.tsx'), 'utf8');
const styles = readFileSync(join(root, 'app/admin-appearance-foundation.css'), 'utf8');

test('admin root boots one shared appearance owner before hydration', () => {
  assert.match(layout, /admin_appearance_preferences_v1/);
  assert.match(layout, /admin-appearance-bootstrap/);
  assert.match(layout, /<AdminAppearanceRuntime\s*\/>/);
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

test('appearance foundation covers light dark compact high contrast and reduced motion', () => {
  assert.match(styles, /:root\[data-admin-theme='dark'\]/);
  assert.match(styles, /:root\[data-admin-theme='light'\]/);
  assert.match(styles, /:root\[data-admin-density='compact'\]/);
  assert.match(styles, /:root\[data-admin-contrast='high'\]/);
  assert.match(styles, /:root\[data-admin-motion='reduced'\]/);
  assert.match(styles, /@media \(max-width: 560px\)/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
});
