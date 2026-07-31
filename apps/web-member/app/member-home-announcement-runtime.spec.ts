import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const homeSource = readFileSync(new URL('./member-home.tsx', import.meta.url), 'utf8');
const runtimeSource = readFileSync(new URL('./components/member-home-runtime-controller.tsx', import.meta.url), 'utf8');
const providerSource = readFileSync(new URL('./member-runtime-provider.tsx', import.meta.url), 'utf8');

test('mounts one shared home runtime for desktop and mobile', () => {
  assert.match(homeSource, /MemberHomeRuntimeController/);
  assert.match(runtimeSource, /\.reference-announcement-track span/);
  assert.match(runtimeSource, /\.v47-mobile-announcement > span/);
  assert.match(runtimeSource, /syncQuickActions/);
  assert.match(runtimeSource, /syncTournament/);
  assert.match(runtimeSource, /syncJackpot/);
  assert.match(runtimeSource, /syncLeaderboard/);
  assert.match(runtimeSource, /syncMiniGames/);
  assert.match(runtimeSource, /syncSections/);
});

test('keeps the home runtime sourced from central settings and session providers', () => {
  assert.match(runtimeSource, /useMemberRuntime\(\)/);
  assert.match(providerSource, /useSiteSettings\(\)/);
  assert.match(providerSource, /useMemberSession\(\)/);
  assert.doesNotMatch(runtimeSource, /fetch\(/);
});
