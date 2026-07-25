import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const appRoot = path.resolve(process.cwd(), 'app');
const layout = readFileSync(path.join(appRoot, 'layout.tsx'), 'utf8');
const css = readFileSync(path.join(appRoot, 'admin-modern-normalization.css'), 'utf8');

test('loads normalization as the last Admin presentation layer', () => {
  const normalizationIndex = layout.indexOf("import './admin-modern-normalization.css';");
  const authIndex = layout.indexOf("import './admin-modern-auth.css';");
  assert.notEqual(normalizationIndex, -1);
  assert.notEqual(authIndex, -1);
  assert.equal(normalizationIndex > authIndex, true);
});

test('removes legacy grid and double page padding', () => {
  assert.equal(css.includes('display: block !important'), true);
  assert.equal(css.includes('grid-template-columns: none !important'), true);
  assert.equal(css.includes('padding: 0 !important'), true);
  assert.equal(css.includes('max-width: none !important'), true);
});

test('normalizes list rows without removing hierarchy', () => {
  assert.equal(css.includes('.admin-ui-row'), true);
  assert.equal(css.includes('.admin-ui-section-row'), true);
  assert.equal(css.includes('border-bottom: 1px solid'), true);
  assert.equal(css.includes('background: transparent !important'), true);
});

test('keeps desktop sidebar offsets and mobile content full width', () => {
  assert.equal(css.includes('@media (min-width: 1100px)'), true);
  assert.equal(css.includes('padding-left: var(--admin-modern-sidebar) !important'), true);
  assert.equal(css.includes('@media (max-width: 1099px)'), true);
  assert.equal(css.includes('padding-left: 0 !important'), true);
  assert.equal(css.includes('@media (max-width: 720px)'), true);
});
