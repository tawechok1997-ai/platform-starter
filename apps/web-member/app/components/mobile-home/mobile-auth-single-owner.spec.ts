import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const mobileRoot = readFileSync(new URL('./mobile-home-root.tsx', import.meta.url), 'utf8');
const memberChrome = readFileSync(new URL('../../member-chrome.tsx', import.meta.url), 'utf8');
const authOverlay = readFileSync(new URL('../auth/member-auth-overlay.tsx', import.meta.url), 'utf8');
const loginPage = readFileSync(new URL('../../(auth)/login/page.tsx', import.meta.url), 'utf8');
const registerView = readFileSync(new URL('../../../src/features/auth/register-view.tsx', import.meta.url), 'utf8');

test('home row and hamburger drawer reuse the same mobile auth actions component', () => {
  assert.equal((mobileRoot.match(/<MobileAuthActions\s+layout="page"\s*\/>/g) ?? []).length, 1);
  assert.equal((mobileRoot.match(/<MobileAuthActions\s+layout="drawer"/g) ?? []).length, 1);
  assert.equal((mobileRoot.match(/function MobileAuthActions\(/g) ?? []).length, 1);
  assert.match(mobileRoot, /href="\/\?auth=register"/);
  assert.match(mobileRoot, /href="\/\?auth=login"/);
  assert.doesNotMatch(mobileRoot, /MemberAuthOverlay/);
});

test('member chrome owns exactly one authentication popup', () => {
  assert.equal((memberChrome.match(/<MemberAuthOverlay\b/g) ?? []).length, 1);
  assert.match(memberChrome, /requestedAuthMode === 'login' \|\| requestedAuthMode === 'register'/);
  assert.match(memberChrome, /authModeOverride \?\? queryAuthMode/);
  assert.match(memberChrome, /authMode\s*\?\s*\([\s\S]*?<MemberAuthOverlay[\s\S]*?mode=\{authMode\}/);
  assert.match(memberChrome, /onModeChange=\{\(mode\) => openAuth\(mode, authNextOverride\)\}/);
});

test('the shared popup keeps one iframe mounted while switching real embedded auth pages', () => {
  assert.equal((authOverlay.match(/<iframe\b/g) ?? []).length, 1);
  assert.match(authOverlay, /mode === 'register' \? '\/register\?embed=1' : '\/login\?embed=1'/);
  assert.doesNotMatch(authOverlay, /key=\{path\}/);
  assert.match(authOverlay, /member-auth-switch/);
  assert.match(authOverlay, /member-auth-close/);
  assert.match(authOverlay, /member-auth-success/);
});

test('register and login tabs stay inside the mounted popup', () => {
  assert.match(loginPage, /registerHref = embedded \? '\/register\?embed=1' : '\/register'/);
  assert.match(loginPage, /loginHref = embedded \? '\/login\?embed=1' : '\/login'/);
  assert.match(loginPage, /<nav className="public-auth-tabs source-login-tabs"/);
  assert.match(registerView, /registerHref = embedded \? '\/register\?embed=1' : '\/register'/);
  assert.match(registerView, /loginHref = embedded \? '\/login\?embed=1' : '\/login'/);
  assert.match(registerView, /<nav className="public-auth-tabs source-login-tabs source-register-tabs"/);
});
