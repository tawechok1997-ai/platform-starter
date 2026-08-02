import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const preview = readFileSync(new URL('./mobile-home-guide-preview.tsx', import.meta.url), 'utf8');
const previewCss = readFileSync(new URL('./mobile-home-guide-preview.module.css', import.meta.url), 'utf8');
const fullGuidePage = readFileSync(new URL('./mobile-member-guide-page.tsx', import.meta.url), 'utf8');
const guideData = readFileSync(new URL('./mobile-member-guide-source-data.ts', import.meta.url), 'utf8');
const sourceContent = readFileSync(new URL('./mobile-source-content.tsx', import.meta.url), 'utf8');
const home = readFileSync(new URL('../../member-home.tsx', import.meta.url), 'utf8');
const root = readFileSync(new URL('./mobile-home-root.tsx', import.meta.url), 'utf8');

test('mobile home mounts the compact Guide inside the right content column', () => {
  assert.match(home, /import MobileHomeGuidePreview/);
  assert.match(home, /<MobileHomeGuidePreview \/>/);
  assert.match(preview, /data-mobile-home-guide-preview="true"/);
  assert.match(preview, /\[data-mobile-content-slot="after-highlight"\]/);
  assert.match(preview, /contentSlot\.append\(host\)/);
  assert.match(preview, /host\.dataset\.mobileSectionOwner = 'guide-preview'/);
  assert.doesNotMatch(preview, /data-mobile-bottom-owner/);
  assert.doesNotMatch(preview, /bottomStructure/);
  assert.match(root, /className=\{styles\.categoryRail\}[\s\S]*data-mobile-content-slot="after-highlight"/);
});

test('Guide placement survives content rerenders and stays after the game sections', () => {
  assert.match(preview, /const syncPlacement = \(\) =>/);
  assert.match(preview, /host\.parentElement !== contentSlot \|\| host\.nextSibling/);
  assert.match(preview, /contentObserver\.observe\(contentSlot, \{ childList: true \}\)/);
  assert.match(preview, /if \(!root \|\| !contentSlot\) return;/);
  assert.doesNotMatch(preview, /styles\.owner/);
  assert.doesNotMatch(preview, /ownerClassName/);
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

test('home Guide preview stays compact with the five source items from the original layout', () => {
  assert.match(preview, /const HOME_GUIDE_PREVIEW_LIMIT = 5;/);
  assert.match(preview, /find\(\(section\) => section\.id === 'section-1'\)/);
  assert.match(preview, /items\.slice\(0, HOME_GUIDE_PREVIEW_LIMIT\)/);
  assert.match(preview, /GUIDE_PREVIEW_ITEMS\.map\(\(item\) =>/);
  assert.match(preview, /data-guide-preview-limit=\{HOME_GUIDE_PREVIEW_LIMIT\}/);
  assert.match(preview, /data-guide-item-count=\{GUIDE_PREVIEW_ITEMS\.length\}/);
  assert.doesNotMatch(preview, /MOBILE_GUIDE_SECTIONS\.flatMap/);
  assert.doesNotMatch(preview, /GUIDE_ITEMS\.map/);
});

test('home Guide spacing matches the compact source layout', () => {
  assert.match(previewCss, /\.preview\s*\{[^}]*padding:\s*0 8px 10px;/);
  assert.match(previewCss, /\.item\s*\{[^}]*margin-top:\s*8px;/);
  assert.match(previewCss, /\.trigger\s*\{[^}]*min-height:\s*34px;/);
  assert.match(previewCss, /\.moreRow a\s*\{[^}]*width:\s*78px;[^}]*height:\s*28px;/);
  assert.doesNotMatch(previewCss, /width:\s*112px;/);
  assert.doesNotMatch(previewCss, /margin-top:\s*12px;/);
});

test('the dedicated Guide page retains every source section and item', () => {
  assert.match(fullGuidePage, /activeTab === 'all'\s*\? MOBILE_GUIDE_SECTIONS/);
  assert.match(fullGuidePage, /visibleSections\.map\(\(section\) =>/);
  assert.match(fullGuidePage, /section\.items\.map\(\(item\) =>/);
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
