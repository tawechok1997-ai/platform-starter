import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const vipPage = readFileSync(new URL('./mobile-member-vip-page.tsx', import.meta.url), 'utf8');
const vipCss = readFileSync(new URL('./mobile-member-vip-page.module.css', import.meta.url), 'utf8');
const sectionPage = readFileSync(new URL('./mobile-member-section-page.tsx', import.meta.url), 'utf8');

test('VIP member route uses its dedicated source page', () => {
  assert.match(sectionPage, /if \(section === 'vip'\)/);
  assert.match(sectionPage, /<MobileMemberVipPage/);
  assert.doesNotMatch(sectionPage, /section === 'vip' \|\| section === 'profile'/);
});

test('guest VIP renders the public programme without requesting member data', () => {
  assert.match(sectionPage, /useMemberSession\(\)/);
  assert.match(sectionPage, /if \(section === 'vip' && !isLoggedIn\)/);
  assert.match(sectionPage, /setPayload\(null\)/);
  assert.match(sectionPage, /payload=\{isLoggedIn \? payload : null\}/);
  assert.match(sectionPage, /error=\{isLoggedIn \? error : ''\}/);

  const guestGuardIndex = sectionPage.indexOf("if (section === 'vip' && !isLoggedIn)");
  const memberRequestIndex = sectionPage.indexOf('const request =');
  assert.ok(guestGuardIndex >= 0 && memberRequestIndex > guestGuardIndex);
});

test('VIP tier CDN names resolve against unified PC assets first', () => {
  assert.match(vipPage, /c005cd08-59f6-485f-8ee2-db342d509aa5\.png/);
  assert.match(vipPage, /78fd025e-0742-410c-ad98-c38f5acdeff1\.png/);
  assert.match(vipPage, /resolveLocalAssetOrSource\(tier\.source, 'pc'\)/);
  assert.match(vipPage, /\/assets\/asset-pc\/images\//);
});

test('VIP mobile geometry follows the 428px source page', () => {
  assert.match(vipCss, /width:\s*min\(100%, 428px\)/);
  assert.match(vipCss, /height:\s*50px/);
  assert.match(vipCss, /height:\s*100px/);
  assert.match(vipCss, /height:\s*220px/);
  assert.match(vipCss, /grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(vipCss, /grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/);
});