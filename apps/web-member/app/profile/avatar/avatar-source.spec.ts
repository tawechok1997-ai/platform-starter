import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const memberHome = readFileSync(new URL('../../member-home.tsx', import.meta.url), 'utf8');
const page = readFileSync(new URL('./page.tsx', import.meta.url), 'utf8');
const runtime = readFileSync(new URL('../../components/mobile-home/mobile-authenticated-avatar-runtime.tsx', import.meta.url), 'utf8');
const preference = readFileSync(new URL('../../lib/mobile-avatar-preference.ts', import.meta.url), 'utf8');
const styles = readFileSync(new URL('./avatar-page.module.css', import.meta.url), 'utf8');

test('avatar settings owns one page and reuses popup-based account actions', () => {
  assert.equal((page.match(/data-mobile-avatar-owner="true"/g) ?? []).length, 1);
  assert.match(page, /setPopup\('contact'\)/);
  assert.match(page, /setPopup\('password'\)/);
  assert.match(page, /<ProfileActionPopupLayer kind=\{popup\} onChange=\{setPopup\} \/>/);
  assert.doesNotMatch(page, /memberApiFetch\('\/member\/auth\/(profile|password)'/);
  assert.match(page, /MOBILE_AVATAR_OPTIONS\.map/);
});

test('selected avatar is synchronized into the existing authenticated drawer', () => {
  assert.equal((memberHome.match(/<MobileAuthenticatedAvatarRuntime\s*\/>/g) ?? []).length, 1);
  assert.match(runtime, /img\[alt="รูปโปรไฟล์สมาชิก"\]/);
  assert.match(runtime, /a\[aria-label="แก้ไขโปรไฟล์"\]/);
  assert.match(runtime, /editLink\.setAttribute\('href', '\/profile\/avatar'\)/);
  assert.match(runtime, /requestAnimationFrame\(syncUntilReady\)/);
  assert.doesNotMatch(runtime, /MutationObserver|<img|<aside|<header/);
});

test('avatar preference is bounded to the supplied local avatar assets', () => {
  assert.match(preference, /Array\.from\([\s\S]*length:\s*15/);
  assert.match(preference, /`\/images\/avatar\/\$\{index \+ 1\}\.webp`/);
  assert.match(preference, /MOBILE_AVATAR_OPTIONS\.includes\(value\)/);
  assert.match(page, /resolveLocalAssetByBasename\(VIP_BADGE_SOURCE, 'mobile'\)/);
  assert.match(page, /resolveLocalAssetByBasename\(VIP_BADGE_SOURCE, 'pc'\)/);
  assert.match(styles, /max-width:\s*428px/);
  assert.match(styles, /grid-template-columns:\s*repeat\(4/);
});
