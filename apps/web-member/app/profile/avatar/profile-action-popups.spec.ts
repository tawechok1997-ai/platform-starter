import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const avatarPage = readFileSync(new URL('./page.tsx', import.meta.url), 'utf8');
const popupLayer = readFileSync(new URL('./profile-action-popups.tsx', import.meta.url), 'utf8');
const popupCss = readFileSync(new URL('./profile-action-popups.module.css', import.meta.url), 'utf8');

test('profile actions stay on the profile page and share one popup owner', () => {
  assert.match(avatarPage, /useState<ProfileActionPopupKind>\(null\)/);
  assert.match(avatarPage, /setPopup\('contact'\)/);
  assert.match(avatarPage, /setPopup\('password'\)/);
  assert.equal((avatarPage.match(/<ProfileActionPopupLayer/g) ?? []).length, 1);
  assert.doesNotMatch(avatarPage, /href="\/profile\/(edit|password)"/);
  assert.doesNotMatch(avatarPage, /MobileMemberPopupRuntime/);
});

test('contact popup uses shared contact settings instead of hard-coded account data', () => {
  assert.match(popupLayer, /useMemberContactRuntime\(\)/);
  assert.match(popupLayer, /channel\.key === 'line'/);
  assert.match(popupLayer, /line\.iconUrl/);
  assert.match(popupLayer, /line\.value/);
  assert.match(popupLayer, /line\.href/);
  assert.doesNotMatch(popupLayer, /@774uinsb|lin\.ee\/UYkP0OC/);
});

test('password popup validates source rules and uses the real member endpoint', () => {
  assert.match(popupLayer, /newPassword\.length >= 8/);
  assert.match(popupLayer, /\[A-Za-z\]/);
  assert.match(popupLayer, /\\d/);
  assert.match(popupLayer, /confirmPassword === newPassword/);
  assert.match(popupLayer, /memberApiFetch\('\/member\/auth\/password'/);
  assert.match(popupLayer, /JSON\.stringify\(\{ currentPassword, newPassword \}\)/);
  assert.match(popupLayer, /window\.setTimeout\(logout, 1200\)/);
});

test('profile popup owns one overlay and source-sized dialog geometry', () => {
  assert.match(popupLayer, /data-profile-action-popup-owner=\{kind\}/);
  assert.match(popupLayer, /createPortal\(/);
  assert.match(popupLayer, /document\.documentElement/);
  assert.match(popupLayer, /body\.style\.overflow = 'hidden'/);
  assert.match(popupLayer, /event\.key === 'Escape'/);
  assert.match(popupCss, /z-index:\s*201/);
  assert.match(popupCss, /width:\s*min\(480px, calc\(100vw - 32px\)\)/);
  assert.match(popupCss, /background:\s*rgb\(0 0 0 \/ 80%\)/);
});
