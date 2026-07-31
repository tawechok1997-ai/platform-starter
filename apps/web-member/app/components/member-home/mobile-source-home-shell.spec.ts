import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const shellSource = readFileSync(new URL('./mobile-source-home-shell.tsx', import.meta.url), 'utf8');
const shellCss = readFileSync(new URL('./mobile-source-home-shell.module.css', import.meta.url), 'utf8');
const homeSource = readFileSync(new URL('../../member-home.tsx', import.meta.url), 'utf8');

test('mobile source home loads promotions from the canonical Member promotion runtime', () => {
  assert.match(shellSource, /loadMemberPromotionCampaigns/);
  assert.match(shellSource, /MEMBER_PROMOTION_FALLBACKS/);
  assert.doesNotMatch(shellSource, /memberApiFetch\('\/public\/promotions'/);
});

test('mobile source home uses shared Member runtime data for announcements and navigation', () => {
  assert.match(shellSource, /useMemberRuntime/);
  assert.match(shellSource, /home\.announcement/);
  assert.match(shellSource, /navigation\.filter/);
  assert.match(shellSource, /features\.registration/);
  assert.match(shellSource, /features\.login/);
});

test('mobile source home provides a real shortcut flow without a dead download route', () => {
  assert.match(shellSource, /beforeinstallprompt/);
  assert.match(shellSource, /member-home-shortcut-request/);
  assert.doesNotMatch(shellSource, /href="\/download/);
});

test('mobile source home mounts only in the mobile branch and protects Desktop', () => {
  assert.match(homeSource, /<MobileSourceHomeShell>/);
  assert.match(homeSource, /<DesktopHomeScaffold/);
  assert.ok(homeSource.indexOf('<MobileSourceHomeShell>') < homeSource.indexOf('<DesktopHomeScaffold'));
  assert.match(shellCss, /:global\(\.v47-mobile-hero\)/);
  assert.match(shellCss, /\.categoryRail/);
});
