import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const authRoot = path.resolve(process.cwd(), 'app/components/auth');
const authLayout = readFileSync(path.resolve(process.cwd(), 'app/(auth)/layout.tsx'), 'utf8');
const loginPage = readFileSync(path.resolve(process.cwd(), 'app/(auth)/login/page.tsx'), 'utf8');
const registerView = readFileSync(path.resolve(process.cwd(), 'src/features/auth/register-view.tsx'), 'utf8');
const finalCss = readFileSync(path.join(authRoot, 'auth-reference-final.css'), 'utf8');

test('loads the NOAH345 Auth popup layer after the shared Auth contract', () => {
  const sharedIndex = authLayout.indexOf("import '../components/auth/auth.css';");
  const finalIndex = authLayout.indexOf("import '../components/auth/auth-reference-final.css';");

  assert.notEqual(sharedIndex, -1);
  assert.notEqual(finalIndex, -1);
  assert.equal(finalIndex > sharedIndex, true);
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

test('uses the supplied popup palette and geometry on desktop and mobile', () => {
  assert.equal(finalCss.includes('--auth-popup-bg: #1d1729'), true);
  assert.equal(finalCss.includes('--auth-popup-pink: #d81bbf'), true);
  assert.equal(finalCss.includes('--auth-popup-violet: #8b36ff'), true);
  assert.equal(finalCss.includes('position: fixed'), true);
  assert.equal(finalCss.includes('place-items: center'), true);
  assert.equal(finalCss.includes('grid-template-columns: repeat(2, minmax(0, 1fr))'), true);
  assert.equal(finalCss.includes('@media (max-width: 720px)'), true);
});

test('keeps the Auth runtime intact and preserves accessibility focus', () => {
  assert.equal(finalCss.includes('memberApiFetch'), false);
  assert.equal(finalCss.includes('focus-visible'), true);
  assert.equal(finalCss.includes('prefers-reduced-motion'), true);
});
