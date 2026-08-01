import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const mobileRoot = readFileSync(new URL('./mobile-home-root.tsx', import.meta.url), 'utf8');
const sectionPage = readFileSync(new URL('./mobile-member-section-page.tsx', import.meta.url), 'utf8');
const sectionStyles = readFileSync(new URL('./mobile-member-section-page.module.css', import.meta.url), 'utf8');
const sectionRoute = readFileSync(new URL('../../mobile/member/[section]/page.tsx', import.meta.url), 'utf8');

test('news menu reuses the existing mobile member section route without a duplicate page owner', () => {
  assert.match(mobileRoot, /\['ข่าวสาร', '\/mobile\/member\/news', 'news'\]/);
  assert.match(sectionRoute, /MobileMemberSectionPage/);
  assert.equal((sectionPage.match(/news:\s*\{\s*title:\s*'ข่าวสาร'/g) ?? []).length, 1);
  assert.match(sectionPage, /isNews \? <NewsEmptyState \/>/);
  assert.doesNotMatch(sectionPage, /MobileMemberNewsPage/);
});

test('news page keeps the source header and exact empty-message artwork', () => {
  assert.match(sectionPage, /function NewsEmptyState\(\)/);
  assert.match(sectionPage, /width="116" height="81" viewBox="0 0 116 81"/);
  assert.match(sectionPage, />ไม่มีข้อความใหม่<\/span>/);
  assert.match(sectionStyles, /\.page\[data-mobile-member-page='news'\][\s\S]*max-width:\s*428px[\s\S]*background:\s*#141019/);
  assert.match(sectionStyles, /\.page\[data-mobile-member-page='news'\] \.header[\s\S]*background:\s*#171422/);
  assert.match(sectionStyles, /\.newsEmpty\s*\{[\s\S]*padding-top:\s*64px[\s\S]*gap:\s*8px/);
  assert.match(sectionStyles, /\.newsEmpty svg\s*\{[\s\S]*width:\s*116px[\s\S]*height:\s*81px/);
  assert.match(sectionStyles, /\.newsEmpty span\s*\{[\s\S]*font-size:\s*12px[\s\S]*font-weight:\s*600/);
});

test('news loads existing public CMS announcements and falls back only when none exist', () => {
  assert.match(sectionPage, /memberApiFetch\(config\.endpoint, config\.publicEndpoint \? \{/);
  assert.match(sectionPage, /skipAuth:\s*true/);
  assert.match(sectionPage, /cmsArray\(root, 'announcements'\)/);
  assert.match(sectionPage, /kind !== 'event' && kind !== 'activity'/);
  assert.match(sectionPage, /unwrapPayloadRecord\(payload\)/);
});
