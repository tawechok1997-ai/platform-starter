import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const authRoot = path.resolve(process.cwd(), 'app/components/auth');
const authLayout = readFileSync(path.resolve(process.cwd(), 'app/(auth)/layout.tsx'), 'utf8');
const loginPage = readFileSync(path.resolve(process.cwd(), 'app/(auth)/login/page.tsx'), 'utf8');
const registerView = readFileSync(path.resolve(process.cwd(), 'src/features/auth/register-view.tsx'), 'utf8');
const baseCss = readFileSync(path.join(authRoot, 'auth.css'), 'utf8');
const singleOwnerCss = readFileSync(path.join(authRoot, 'auth-popup-single-owner.css'), 'utf8');

test('loads the shared Auth contract before source and single-owner layers', () => {
  const imports = [
    "import '../components/auth/auth.css';",
    "import '../components/auth/auth-source-login.css';",
    "import '../components/auth/auth-source-register.css';",
    "import '../components/auth/auth-embedded-overlay.css';",
    "import '../components/auth/auth-popup-single-owner.css';",
  ];
  const indexes = imports.map((value) => authLayout.indexOf(value));

  for (const index of indexes) assert.notEqual(index, -1);
  for (let index = 1; index < indexes.length; index += 1) {
    const previous = indexes[index - 1] ?? -1;
    const current = indexes[index] ?? -1;
    assert.equal(current > previous, true);
  }
});

test('renders Login and Register as accessible modal dialogs with shared tabs', () => {
  for (const source of [loginPage, registerView]) {
    assert.equal(source.includes('public-auth-modal'), true);
    assert.equal(source.includes('role="dialog"'), true);
    assert.equal(source.includes('aria-modal="true"'), true);
    assert.equal(source.includes('public-auth-tabs'), true);
    assert.equal(source.includes('public-auth-close'), true);
  }
});

test('keeps one responsive visual owner for embedded Login and Register', () => {
  assert.equal(singleOwnerCss.includes(".public-auth-page[data-embedded='true']"), true);
  assert.equal(singleOwnerCss.includes('.source-login-modal[data-auth-mode]'), true);
  assert.equal(singleOwnerCss.includes('width: min(1080px, calc(100vw - 32px))'), true);
  assert.equal(singleOwnerCss.includes('flex: 0 0 470px'), true);
  assert.equal(singleOwnerCss.includes("content: url('/assets/asset-pc/images/wallpaper_login.webp')"), true);
  assert.equal(singleOwnerCss.includes('@media (max-width: 900px)'), true);
});

test('keeps Auth runtime separate from styling and preserves keyboard focus', () => {
  assert.equal(baseCss.includes('memberApiFetch'), false);
  assert.equal(singleOwnerCss.includes('memberApiFetch'), false);
  assert.equal(baseCss.includes('focus-visible'), true);
  assert.equal(baseCss.includes('--auth-focus'), true);
});
