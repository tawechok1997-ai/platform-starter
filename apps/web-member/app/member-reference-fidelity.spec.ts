import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const appRoot = path.resolve(process.cwd(), 'app');
const layoutSource = readFileSync(path.join(appRoot, 'layout.tsx'), 'utf8');
const fidelityCss = readFileSync(path.join(appRoot, 'member-reference-fidelity.css'), 'utf8');

 test('loads the final Member reference-fidelity layer after the current reference contract', () => {
  const currentIndex = layoutSource.indexOf("import './member-reference-current.css';");
  const fidelityIndex = layoutSource.indexOf("import './member-reference-fidelity.css';");

  assert.notEqual(currentIndex, -1);
  assert.notEqual(fidelityIndex, -1);
  assert.equal(fidelityIndex > currentIndex, true);
});

test('styles the search control semantically instead of relying on DOM order', () => {
  assert.equal(fidelityCss.includes(".member-header-tool[aria-label='ค้นหาเกม']"), true);
  assert.equal(fidelityCss.includes('nth-child'), false);
});

test('keeps mobile promotion cards in a swipeable snap rail', () => {
  assert.equal(fidelityCss.includes('grid-auto-flow: column'), true);
  assert.equal(fidelityCss.includes('grid-auto-columns: minmax(248px, 82vw)'), true);
  assert.equal(fidelityCss.includes('overflow-x: auto'), true);
  assert.equal(fidelityCss.includes('scroll-snap-type: inline mandatory'), true);
  assert.equal(fidelityCss.includes('scroll-snap-align: start'), true);
});
