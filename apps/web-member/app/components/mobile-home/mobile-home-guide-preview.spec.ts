import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const preview = readFileSync(new URL('./mobile-home-guide-preview.tsx', import.meta.url), 'utf8');
const guideData = readFileSync(new URL('./mobile-member-guide-source-data.ts', import.meta.url), 'utf8');
const sourceContent = readFileSync(new URL('./mobile-source-content.tsx', import.meta.url), 'utf8');
const home = readFileSync(new URL('../../member-home.tsx', import.meta.url), 'utf8');
const root = readFileSync(new URL('./mobile-home-root.tsx', import.meta.url), 'utf8');

test('mobile home mounts the compact guide preview before the persistent bottom content', () => {
  assert.match(home, /import MobileHomeGuidePreview/);
  assert.match(home, /<MobileHomeGuidePreview \/>/);
  assert.match(preview, /data-mobile-home-guide-preview="true"/);
  assert.match(preview, /bottomStructure\.insertBefore\(host, shortcut \?\? bottomStructure\.firstChild\)/);
});

test('mobile home has one Guide owner and no legacy source-content guide', () => {
  assert.match(preview, /<header className=\{styles\.titleBar\}>/);
  assert.match(preview, /<h2 id="mobile-home-guide-title">Guide<\/h2>/);
  assert.doesNotMatch(sourceContent, /runtime\.features\.usageGuide/);
  assert.doesNotMatch(sourceContent, /mobile-guide-heading/);
  assert.doesNotMatch(sourceContent, /styles\.guideSection/);
  assert.doesNotMatch(sourceContent, /runtime\.guides/);
  assert.doesNotMatch(sourceContent, /navigate\('\/guide'\)/);
});

test('latest Guide accordion keeps every source section and item', () => {
  assert.match(preview, /MOBILE_GUIDE_SECTIONS\.flatMap\(\(section\) => section\.items\)/);
  assert.match(preview, /data-guide-section-count=\{MOBILE_GUIDE_SECTIONS\.length\}/);
  assert.match(preview, /data-guide-item-count=\{GUIDE_ITEMS\.length\}/);
  assert.match(preview, /GUIDE_ITEMS\.map\(\(item\) =>/);
  assert.doesNotMatch(preview, /find\(\(section\) => section\.id === 'section-1'\)/);
  assert.doesNotMatch(preview, /slice\(0, 5\)/);
  assert.match(guideData, /"id": "section-1"/);
  assert.match(guideData, /"id": "section-9"/);
});

test('guide preview starts collapsed and toggles one item at a time', () => {
  assert.match(preview, /useState<string \| null>\(null\)/);
  assert.match(preview, /const expanded = openItemId === item\.id/);
  assert.match(preview, /setOpenItemId\(\(current\) => current === item\.id \? null : item\.id\)/);
  assert.match(preview, /aria-expanded=\{expanded\}/);
  assert.match(preview, /expanded \? <GuidePanel/);
});

test('view all uses the same usage-guide route as the member menu', () => {
  assert.match(preview, /<Link href="\/mobile\/member\/guide">ดูทั้งหมด<\/Link>/);
  assert.match(root, /\['แนะนำการใช้งาน', '\/mobile\/member\/guide', 'guide'\]/);
  assert.doesNotMatch(preview, /href="\/(?:userGuide|guide)"/);
});

test('guide preview only appears on the mobile home category', () => {
  assert.match(preview, /root\.dataset\.mobileActiveCategory \?\? 'home'/);
  assert.match(preview, /=== 'home'/);
  assert.match(preview, /if \(!target \|\| !visible\) return null/);
});
