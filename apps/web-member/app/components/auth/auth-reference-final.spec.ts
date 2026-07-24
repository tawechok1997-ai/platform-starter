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

test('uses the reference purple and pink Auth palette', () => {
  assert.equal(finalCss.includes('--auth-reference-pink: #ed20d5'), true);
  assert.equal(finalCss.includes('--auth-reference-violet: #8137ff'), true);
  assert.equal(finalCss.includes('linear-gradient(135deg, var(--auth-reference-pink), var(--auth-reference-violet))'), true);
});

test('keeps public Auth in a mobile bottom-sheet presentation', () => {
  assert.equal(finalCss.includes('@media (max-width: 860px)'), true);
  assert.equal(finalCss.includes('place-items: end center'), true);
  assert.equal(finalCss.includes('border-radius: 24px 24px 0 0'), true);
  assert.equal(finalCss.includes('.public-auth-card::before'), true);
});

test('does not alter Auth runtime or hide accessibility focus', () => {
  assert.equal(finalCss.includes('memberApiFetch'), false);
  assert.equal(finalCss.includes('display: none'), false);
  assert.equal(finalCss.includes('focus-visible'), true);
  assert.equal(finalCss.includes('prefers-reduced-motion'), true);
});
