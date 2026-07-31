import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const root = readFileSync(new URL('./mobile-home-root.tsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('./mobile-home-root.module.css', import.meta.url), 'utf8');

test('mobile category rail has one owner and reads central navigation', () => {
  assert.equal((root.match(/data-mobile-section-owner="category-menu"/g) ?? []).length, 1);
  assert.match(root, /useMemberRuntime\(\)/);
  assert.match(root, /navigation\.find\(\(candidate\) => candidate\.id === id && candidate\.mobile\)/);
  assert.doesNotMatch(root, /<canvas\b/);
});

test('mobile category rail keeps the supplied order and labels', () => {
  assert.match(root, /'home',[\s\S]*'casino',[\s\S]*'slot',[\s\S]*'fishing',[\s\S]*'sport',[\s\S]*'card',[\s\S]*'lottery'/);
  for (const label of ['หน้าแรก', 'คาสิโน', 'สล็อต', 'ยิงปลา', 'กีฬา', 'ไพ่', 'หวย']) {
    assert.match(root, new RegExp(label));
  }
});

test('mobile category rail matches sticky geometry and responsive sizes', () => {
  assert.match(css, /\.categoryRail\s*\{[\s\S]*position:\s*sticky/);
  assert.match(css, /\.categoryRail\s*\{[\s\S]*top:\s*60px/);
  assert.match(css, /\.categoryRail\s*\{[\s\S]*z-index:\s*98/);
  assert.match(css, /\.categoryItem\s*\{[\s\S]*width:\s*45px[\s\S]*height:\s*45px/);
  assert.match(css, /@media \(min-width: 360px\)[\s\S]*width:\s*55px[\s\S]*height:\s*55px/);
  assert.match(css, /@media \(min-width: 430px\)[\s\S]*width:\s*60px[\s\S]*height:\s*60px/);
});

test('active and inactive category cards keep the supplied surfaces', () => {
  assert.match(css, /\.categoryItem\s*\{[\s\S]*background:\s*#373147/);
  assert.match(css, /\.categoryItemActive\s*\{[\s\S]*background:\s*#fff/);
  assert.match(css, /linear-gradient\(#710090 0%, #38324e 100%\)/);
});
