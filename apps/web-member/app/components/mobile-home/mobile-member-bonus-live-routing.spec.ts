import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const route = readFileSync(new URL('../../mobile/member/[section]/page.tsx', import.meta.url), 'utf8');
const bonusPage = readFileSync(new URL('./mobile-member-bonus-page.tsx', import.meta.url), 'utf8');
const bonusStyles = readFileSync(new URL('./mobile-member-bonus-page.module.css', import.meta.url), 'utf8');
const sectionPage = readFileSync(new URL('./mobile-member-section-page.tsx', import.meta.url), 'utf8');
const mobileHome = readFileSync(new URL('./mobile-home-root.tsx', import.meta.url), 'utf8');

test('special bonus menu opens the source-shaped dedicated page', () => {
  assert.match(route, /section === 'bonus'/);
  assert.match(route, /<MobileMemberBonusPage \/>/);
  assert.match(bonusPage, /data-mobile-member-page="bonus"/);
  assert.match(bonusPage, />โบนัสพิเศษ</);
  assert.match(bonusPage, />ไม่มีข้อความใหม่</);
  assert.match(bonusPage, /router\.push\('\/'\)/);
  assert.match(bonusStyles, /max-width:\s*428px/);
  assert.match(bonusStyles, /height:\s*50px/);
  assert.match(bonusStyles, /width:\s*116px/);
  assert.match(bonusStyles, /height:\s*81px/);
});

test('live keeps one route and one page owner before and after login', () => {
  const liveRouteMatches = mobileHome.match(/\/mobile\/member\/live/g) ?? [];
  assert.equal(liveRouteMatches.length, 1);
  assert.match(sectionPage, /section === 'live'/);
  assert.match(sectionPage, /<MobileLiveSchedulePage/);
  assert.doesNotMatch(route, /section === 'live'/);
});
