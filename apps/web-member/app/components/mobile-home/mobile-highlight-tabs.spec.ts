import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const root = readFileSync(new URL('./mobile-home-root.tsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('./mobile-home-root.module.css', import.meta.url), 'utf8');
const navigationController = readFileSync(new URL('../member-navigation-auth-controller.tsx', import.meta.url), 'utf8');

test('mobile highlight rail owns four in-place tabs', () => {
  assert.match(root, /const HIGHLIGHT_TABS = \['highlights', 'promotions', 'activities', 'news'\]/);
  assert.match(root, /data-mobile-section-owner="highlight-tabs"/);
  assert.match(root, /HIGHLIGHT_TABS\.map\(\(tab, index\) => \{[\s\S]*?return \(\s*<button[\s\S]*?role="tab"[\s\S]*?onClick=\{\(\) => selectHighlightTab\(tab\)\}/);
  assert.match(root, /<MobileHighlightTabContent activeTab=\{activeTab\} \/>/);
});

test('mobile highlight rail remains horizontally scrollable', () => {
  assert.match(css, /\.highlightTabs\s*\{[\s\S]*overflow-x:\s*auto/);
  assert.match(css, /grid-template-columns:\s*repeat\(4,/);
  assert.match(css, /\.highlightTabs button\s*\{[\s\S]*white-space:\s*nowrap/);
});

test('global navigation never reinterprets highlight tab labels as routes', () => {
  assert.match(navigationController, /closest\('\[data-mobile-section-owner="highlight-tabs"\]'\)\) return/);
  assert.doesNotMatch(navigationController, /'โปรโมชั่นแนะนำ':\s*'\/mobile\/member\/promotions'/);
});
