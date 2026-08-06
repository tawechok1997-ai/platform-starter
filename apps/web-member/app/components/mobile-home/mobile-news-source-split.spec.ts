import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const home = readFileSync(new URL('../../member-home.tsx', import.meta.url), 'utf8');
const route = readFileSync(new URL('../../mobile/member/news/page.tsx', import.meta.url), 'utf8');
const navigation = readFileSync(new URL('./mobile-member-standalone-navigation.tsx', import.meta.url), 'utf8');
const newsPage = readFileSync(new URL('./mobile-member-news-live-page.tsx', import.meta.url), 'utf8');
const newsCss = readFileSync(new URL('./mobile-member-news-page.module.css', import.meta.url), 'utf8');
const highlight = readFileSync(new URL('./mobile-highlight-tab-content.tsx', import.meta.url), 'utf8');
const source = readFileSync(new URL('./use-mobile-member-content-sources.ts', import.meta.url), 'utf8');

test('Home News summary and the full News route stay separate', () => {
  assert.match(highlight, /activeTab === 'news'/);
  assert.match(route, /MobileMemberNewsLivePage/);
  assert.match(newsPage, /data-news-owner="standalone"/);
});

test('Home and standalone News consume the same source hook', () => {
  assert.match(highlight, /useMobileNewsSource\(\)/);
  assert.match(route, /useMobileNewsSource\(\)/);
  assert.equal((source.match(/export function useMobileNewsSource/g) ?? []).length, 1);
});

test('one member navigation owner opens the dedicated News route', () => {
  assert.match(home, /import MobileMemberStandaloneNavigation/);
  assert.match(home, /<MobileMemberStandaloneNavigation \/>/);
  assert.doesNotMatch(home, /MobileNewsStandaloneNavigation/);
  assert.match(navigation, /news: '\/mobile\/member\/news'/);
  assert.match(navigation, /data-source-member-menu-item/);
  assert.match(navigation, /router\.push\(route\)/);
});

test('the shared News source uses live CMS announcements and source empty state geometry', () => {
  assert.match(source, /item\.kind === 'news'/);
  assert.match(source, /cmsContentSetting\(settings\)/);
  assert.match(newsPage, /width="116" height="81"/);
  assert.match(newsPage, /ไม่มีข้อความใหม่/);
  assert.match(newsCss, /height:\s*50px/);
  assert.match(newsCss, /padding-top:\s*64px/);
  assert.match(newsCss, /color:\s*#a6a6a6/);
});
