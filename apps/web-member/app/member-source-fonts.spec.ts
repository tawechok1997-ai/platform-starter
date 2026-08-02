import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const layout = readFileSync(new URL('./layout.tsx', import.meta.url), 'utf8');
const sourceFonts = readFileSync(new URL('./member-source-fonts.css', import.meta.url), 'utf8');
const originalBundle = readFileSync(
  new URL('../public/assets/asset-pc/assets/index-IACIxQni.css', import.meta.url),
  'utf8',
);

test('member font owner matches the original bundled CSS', () => {
  assert.match(
    originalBundle,
    /html\{[^}]*font-family:Noto Sans Thai,Noto Sans,sans-serif/,
  );
  assert.match(
    originalBundle,
    /--toastify-font-family:\s*"Noto Sans Thai",\s*"Noto Sans",\s*sans-serif/,
  );
  assert.match(
    sourceFonts,
    /--member-font-sans:\s*'Noto Sans Thai',\s*'Noto Sans',\s*sans-serif/,
  );
  assert.match(sourceFonts, /--font-family-sans:\s*var\(--member-font-sans\)/);
  assert.match(sourceFonts, /--toastify-font-family:\s*var\(--member-font-sans\)/);
});

test('root layout loads the exact source font families before rendering', () => {
  assert.match(layout, /import '\.\/member-source-fonts\.css';/);
  assert.match(layout, /family=Noto\+Sans\+Thai:wght@100;200;300;400;500;600;700;800;900/);
  assert.match(layout, /family=Noto\+Sans:ital,wght@0,100;/);
  assert.match(layout, /fonts\.gstatic\.com/);
  assert.ok(
    layout.indexOf("import './member-source-fonts.css';")
      > layout.indexOf("import './member-mobile-category-follow.css';"),
    'source font authority must load after the legacy member styles',
  );
});

test('form controls and toast notifications inherit the source family', () => {
  assert.match(sourceFonts, /button,[\s\S]*textarea\s*\{[\s\S]*font-family:\s*inherit/);
  assert.match(sourceFonts, /\.Toastify__toast,[\s\S]*\.Toastify__toast-body/);
  assert.match(sourceFonts, /font-family:\s*var\(--member-font-sans\)/);
});
