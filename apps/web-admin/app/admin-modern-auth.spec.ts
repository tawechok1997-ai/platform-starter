import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const appRoot = path.resolve(process.cwd(), 'app');
const layout = readFileSync(path.join(appRoot, 'layout.tsx'), 'utf8');
const css = readFileSync(path.join(appRoot, 'admin-modern-auth.css'), 'utf8');

test('loads authentication polish after all authenticated workflow layers', () => {
  const workflowIndex = layout.indexOf("import './admin-modern-workflows.css';");
  const authIndex = layout.indexOf("import './admin-modern-auth.css';");
  assert.notEqual(workflowIndex, -1);
  assert.notEqual(authIndex, -1);
  assert.equal(authIndex > workflowIndex, true);
});

test('keeps a focused split-screen desktop authentication layout', () => {
  assert.equal(css.includes('.admin-auth-shell'), true);
  assert.equal(css.includes('grid-template-columns: minmax(0, .92fr) minmax(420px, .72fr)'), true);
  assert.equal(css.includes('.admin-auth-brand'), true);
  assert.equal(css.includes('.admin-auth-card'), true);
});

test('keeps credentials, 2FA and error states readable', () => {
  assert.equal(css.includes('.admin-auth-field'), true);
  assert.equal(css.includes('.admin-auth-input-wrap'), true);
  assert.equal(css.includes("[aria-invalid='true']"), true);
  assert.equal(css.includes('.admin-auth-field-error'), true);
  assert.equal(css.includes("[data-status='error']"), true);
  assert.equal(css.includes("[data-status='success']"), true);
});

test('turns authentication into a full-height safe mobile form', () => {
  assert.equal(css.includes('@media (max-width: 920px)'), true);
  assert.equal(css.includes('@media (max-width: 520px)'), true);
  assert.equal(css.includes('min-height: 100dvh'), true);
  assert.equal(css.includes('env(safe-area-inset-top)'), true);
  assert.equal(css.includes('env(safe-area-inset-bottom)'), true);
});

test('respects reduced motion during authentication', () => {
  assert.equal(css.includes('@media (prefers-reduced-motion: reduce)'), true);
  assert.equal(css.includes('animation-duration: .01ms !important'), true);
  assert.equal(css.includes('transition-duration: .01ms !important'), true);
});
