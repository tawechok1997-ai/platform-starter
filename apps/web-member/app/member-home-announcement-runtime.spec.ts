import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const homeSource = readFileSync(new URL('./member-home.tsx', import.meta.url), 'utf8');
const runtimeSource = readFileSync(new URL('./components/member-home-announcement-runtime.tsx', import.meta.url), 'utf8');

test('mounts one shared announcement runtime for desktop and mobile home', () => {
  assert.match(homeSource, /MemberHomeAnnouncementRuntime/);
  assert.match(runtimeSource, /memberAnnouncementsRuntime\(content, 'desktop'\)/);
  assert.match(runtimeSource, /memberAnnouncementsRuntime\(content, 'mobile'\)/);
  assert.match(runtimeSource, /\.reference-announcement-track span/);
  assert.match(runtimeSource, /\.v47-mobile-announcement > span/);
});

test('keeps the announcement sourced from public site settings', () => {
  assert.match(runtimeSource, /useSiteSettings\(\)/);
  assert.match(runtimeSource, /cmsContentSetting\(settings\)/);
  assert.doesNotMatch(runtimeSource, /fetch\(/);
});
