import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const appRoot = path.resolve(process.cwd(), 'app');
const layoutSource = readFileSync(path.join(appRoot, 'layout.tsx'), 'utf8');
const fidelityCss = readFileSync(path.join(appRoot, 'member-reference-fidelity.css'), 'utf8');
const homeTabsSource = readFileSync(
  path.join(appRoot, 'components/member-home/source-home-tabs.tsx'),
  'utf8',
);

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

test('keeps the mobile announcement strip compact and horizontally readable', () => {
  assert.equal(fidelityCss.includes('.member-source-home .home-announcement-strip'), true);
  assert.equal(fidelityCss.includes('grid-template-columns: auto minmax(0, 1fr)'), true);
  assert.equal(fidelityCss.includes('.home-announcement-strip__track'), true);
  assert.equal(fidelityCss.includes('overscroll-behavior-inline: contain'), true);
  assert.equal(fidelityCss.includes('mask-image: linear-gradient'), true);
  assert.equal(fidelityCss.includes('white-space: nowrap'), true);
});

test('uses semantic home tabs with compact mobile labels', () => {
  assert.equal(homeTabsSource.includes('role="tablist"'), true);
  assert.equal(homeTabsSource.includes('role="tab"'), true);
  assert.equal(homeTabsSource.includes('aria-selected={selected}'), true);
  assert.equal(homeTabsSource.includes("compactLabel: 'โปรโมชั่น'"), true);
  assert.equal(fidelityCss.includes('.member-source-tab__label--compact'), true);
  assert.equal(fidelityCss.includes('grid-template-columns: repeat(3, minmax(0, 1fr))'), true);
});
