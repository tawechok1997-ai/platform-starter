import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const home = readFileSync(new URL('../../member-home.tsx', import.meta.url), 'utf8');
const route = readFileSync(new URL('../../mobile/member/news/page.tsx', import.meta.url), 'utf8');
const navigation = readFileSync(new URL('./mobile-news-standalone-navigation.tsx', import.meta.url), 'utf8');
const newsPage = readFileSync(new URL('./mobile-member-news-page.tsx', import.meta.url), 'utf8');
const newsCss = readFileSync(new URL('./mobile-member-news-page.module.css', import.meta.url), 'utf8');
const highlight = readFileSync(new URL('./mobile-highlight-tab-content.tsx', import.meta.url), 'utf8');

test('Home News summary and the full News route stay separate', () => {
  assert.match(highlight, /activeTab === 'news'/);
  assert.match(route, /MobileMemberNewsPage/);
  assert.match(newsPage, /data-news-owner="standalone"/);
});

test('the member News button opens the dedicated route', () => {
  assert.match(home, /import MobileNewsStandaloneNavigation/);
  assert.match(home, /<MobileNewsStandaloneNavigation \/>/);
  assert.match(navigation, /data-source-member-menu-item=\\"news\\"/);
  assert.match(navigation, /window\.location\.assign\(NEWS_ROUTE\)/);
  assert.match(navigation, /useLayoutEffect/);
});

test('the standalone News page uses live CMS announcements and source empty state geometry', () => {
  assert.match(newsPage, /item\.kind === 'news'/);
  assert.match(newsPage, /cmsContentSetting\(settings\)/);
  assert.match(newsPage, /width="116" height="81"/);
  assert.match(newsPage, /ไม่มีข้อความใหม่/);
  assert.match(newsCss, /height:\s*50px/);
  assert.match(newsCss, /padding-top:\s*64px/);
  assert.match(newsCss, /color:\s*#a6a6a6/);
});
