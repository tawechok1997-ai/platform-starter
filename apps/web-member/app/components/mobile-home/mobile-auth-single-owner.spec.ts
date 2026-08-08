import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const mobileRoot = readFileSync(new URL('./mobile-home-root.tsx', import.meta.url), 'utf8');
const memberChrome = readFileSync(new URL('../../member-chrome.tsx', import.meta.url), 'utf8');
const authOverlay = readFileSync(new URL('../auth/member-auth-overlay.tsx', import.meta.url), 'utf8');
const authPolish = readFileSync(new URL('../auth/auth-popup-polish.css', import.meta.url), 'utf8');
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

test('member chrome owns exactly one query and event driven authentication popup', () => {
  assert.equal((memberChrome.match(/<MemberAuthOverlay\b/g) ?? []).length, 1);
  assert.match(memberChrome, /const \[authRequest, setAuthRequest\] = useState<MemberOpenAuthDetail \| null>\(null\)/);
  assert.match(memberChrome, /requestedMode !== 'login' && requestedMode !== 'register'/);
  assert.match(memberChrome, /window\.addEventListener\(MEMBER_OPEN_AUTH_EVENT, handleAuthOpen\)/);
  assert.match(memberChrome, /authRequest\s*\?\s*\([\s\S]*?<MemberAuthOverlay[\s\S]*?mode=\{authRequest\.mode\}/);
  assert.match(memberChrome, /requestId=\{authRequest\.requestId\}/);
});

test('the shared popup owns one stable iframe and switches its inner document explicitly', () => {
  assert.equal((authOverlay.match(/<iframe\b/g) ?? []).length, 1);
  assert.match(authOverlay, /const initialPath = embeddedPath\(mode, requestId\)/);
  assert.match(authOverlay, /requestedPathRef = useRef\(initialPath\)/);
  assert.match(authOverlay, /frameRef = useRef<HTMLIFrameElement \| null>\(null\)/);
  assert.match(authOverlay, /ref=\{frameRef\}/);
  assert.match(authOverlay, /src=\{initialPath\}/);
  assert.match(authOverlay, /contentWindow\.location\.replace\(nextPath\)/);
  assert.match(authOverlay, /navigateEmbeddedMode\(payload\.mode\)/);
  assert.doesNotMatch(authOverlay, /const path = activeMode/);
  assert.match(authOverlay, /member-auth-close/);
  assert.match(authOverlay, /member-auth-success/);

  const clickStart = authOverlay.indexOf("embeddedDocument.addEventListener('click'");
  const clickEnd = authOverlay.indexOf('}, { capture: true, signal: navigationAbort.signal });', clickStart);
  const embeddedClickHandler = authOverlay.slice(clickStart, clickEnd);
  assert.ok(clickStart >= 0 && clickEnd > clickStart);
  assert.match(embeddedClickHandler, /preventDefault\(\)/);
  assert.match(embeddedClickHandler, /stopPropagation\(\)/);
  assert.match(embeddedClickHandler, /navigateEmbeddedMode\(nextMode\)/);
});

test('register and login tabs navigate between real embedded auth pages', () => {
  assert.match(loginPage, /registerHref = embedded \? '\/register\?embed=1' : '\/register'/);
  assert.match(loginPage, /loginHref = embedded \? '\/login\?embed=1' : '\/login'/);
  assert.match(loginPage, /<nav className="public-auth-tabs source-login-tabs"/);
  assert.match(registerView, /registerHref = embedded \? '\/register\?embed=1' : '\/register'/);
  assert.match(registerView, /loginHref = embedded \? '\/login\?embed=1' : '\/login'/);
  assert.match(registerView, /<nav className="public-auth-tabs source-login-tabs source-register-tabs"/);
});

test('popup auth tabs expose a comfortable touch target above surrounding layers', () => {
  assert.match(authPolish, /\.public-auth-tabs\s*\{[\s\S]*z-index:\s*12\s*!important/);
  assert.match(authPolish, /\.public-auth-tabs > a\s*\{[\s\S]*min-height:\s*44px\s*!important/);
  assert.match(authPolish, /\.public-auth-tabs > a\s*\{[\s\S]*touch-action:\s*manipulation\s*!important/);
  assert.match(authPolish, /@media \(max-width: 900px\)[\s\S]*\.public-auth-tabs > a\s*\{[\s\S]*min-height:\s*48px\s*!important/);
});
