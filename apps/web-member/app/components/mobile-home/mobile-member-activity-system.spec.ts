import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const listRoute = readFileSync(new URL('../../mobile/member/activity/page.tsx', import.meta.url), 'utf8');
const listPage = readFileSync(new URL('./mobile-member-activity-page.tsx', import.meta.url), 'utf8');
const detailRoute = readFileSync(new URL('../../mobile/member/activity/[activity]/page.tsx', import.meta.url), 'utf8');
const detailPage = readFileSync(new URL('./mobile-member-activity-detail-page.tsx', import.meta.url), 'utf8');
const styles = readFileSync(new URL('./mobile-member-activity-detail-page.module.css', import.meta.url), 'utf8');

test('activity list uses the dedicated public API and API-provided child routes', () => {
  assert.match(listRoute, /memberApiFetch\('\/public\/activities'/);
  assert.match(listRoute, /skipAuth:\s*true/);
  assert.doesNotMatch(listRoute, /\/public\/site-settings/);
  assert.match(listPage, /items:\s*MobileActivityContentItem\[\]/);
  assert.match(listPage, /activity\.href\.startsWith\('\/'\)/);
  assert.match(listPage, /router\.push\(activity\.href\)/);
  assert.match(listPage, /detail: \{ mode: 'login', next: activity\.href \}/);
  assert.doesNotMatch(listPage, /daily-mission|lottery-prediction|turnover-reward/);
  assert.match(detailRoute, /MobileMemberActivityDetailPage/);
});

test('daily mission page consumes claim and progress APIs', () => {
  assert.match(detailPage, /\/member\/activities\/daily-login/);
  assert.match(detailPage, /\/member\/activities\/daily-login\/claim/);
  assert.match(detailPage, /\/member\/activities\/missions/);
  assert.match(detailPage, /\/member\/activities\/missions\/\$\{encodeURIComponent\(missionCode\)\}\/claim/);
  assert.match(detailPage, /รับรางวัลของวันนี้/);
  assert.match(detailPage, /รายการภารกิจ/);
});

test('turnover and lottery pages use configurable member APIs', () => {
  assert.match(detailPage, /\/member\/activities\/turnover\?category=/);
  assert.match(detailPage, /\/member\/activities\/turnover\/\$\{category\}/);
  assert.match(detailPage, /\/member\/activities\/lottery/);
  assert.match(detailPage, /entries/);
  assert.match(detailPage, /กรุณาทายผลให้ครบทั้ง/);
  assert.match(styles, /max-width:\s*428px/);
  assert.match(styles, /height:\s*50px/);
  assert.match(styles, /grid-template-columns:\s*repeat\(2/);
});
