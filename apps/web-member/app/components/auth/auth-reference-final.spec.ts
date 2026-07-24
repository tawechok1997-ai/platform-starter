import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const authRoot = path.resolve(process.cwd(), 'app/components/auth');
const authLayout = readFileSync(path.resolve(process.cwd(), 'app/(auth)/layout.tsx'), 'utf8');
const finalCss = readFileSync(path.join(authRoot, 'auth-reference-final.css'), 'utf8');

test('loads the NOAH345 Auth fidelity layer after the shared Auth contract', () => {
  const sharedIndex = authLayout.indexOf("import '../components/auth/auth.css';");
  const finalIndex = authLayout.indexOf("import '../components/auth/auth-reference-final.css';");

  assert.notEqual(sharedIndex, -1);
  assert.notEqual(finalIndex, -1);
  assert.equal(finalIndex > sharedIndex, true);
});

test('uses the palette and control geometry from the supplied source', () => {
  assert.equal(finalCss.includes('--auth-reference-bg: #0b0712'), true);
  assert.equal(finalCss.includes('--auth-reference-panel: #1d1729'), true);
  assert.equal(finalCss.includes('--auth-reference-pink: #d81bbf'), true);
  assert.equal(finalCss.includes('--auth-reference-violet: #8b36ff'), true);
  assert.equal(finalCss.includes('min-height: 52px'), true);
  assert.equal(finalCss.includes('border-radius: 15px'), true);
});

test('keeps the source hero and form composition on mobile', () => {
  assert.equal(finalCss.includes('@media (max-width: 860px)'), true);
  assert.equal(finalCss.includes('.public-auth-brand-panel {\n    display: flex'), true);
  assert.equal(finalCss.includes('grid-template-columns: minmax(0, 1fr)'), true);
  assert.equal(finalCss.includes('place-items: end center'), false);
  assert.equal(finalCss.includes('.public-auth-card::before'), false);
});

test('does not alter Auth runtime and preserves accessibility focus', () => {
  assert.equal(finalCss.includes('memberApiFetch'), false);
  assert.equal(finalCss.includes('focus-visible'), true);
  assert.equal(finalCss.includes('prefers-reduced-motion'), true);
});
