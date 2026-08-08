import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const mobileInteractions = readFileSync(
  new URL('./member-floating-contact.tsx', import.meta.url),
  'utf8',
);
const authOverlay = readFileSync(
  new URL('./auth/member-auth-overlay.tsx', import.meta.url),
  'utf8',
);
const authPolish = readFileSync(
  new URL('./auth/auth-popup-polish.css', import.meta.url),
  'utf8',
);
const categoryCss = readFileSync(
  new URL('../member-mobile-category-follow.css', import.meta.url),
  'utf8',
);

test('every Mobile category click reaches the rendered content owner', () => {
  assert.match(mobileInteractions, /button\[data-mobile-category-id\]/);
  assert.match(mobileInteractions, /MOBILE_CATEGORY_IDS\.has\(category\)/);
  assert.match(mobileInteractions, /new CustomEvent\('member:mobile-category-select'/);
  assert.match(mobileInteractions, /detail:\s*\{ category \}/);

  const categoryHandler = mobileInteractions.slice(
    mobileInteractions.indexOf('const routeCategorySelectionToContentOwner'),
    mobileInteractions.indexOf("document.addEventListener('click', routeCategorySelectionToContentOwner)"),
  );
  assert.doesNotMatch(categoryHandler, /preventDefault\(|stopPropagation\(|stopImmediatePropagation\(/);
});

test('Mobile category controls remain above the content hit layer', () => {
  assert.match(categoryCss, /data-mobile-section-owner='category-menu'[\s\S]*pointer-events:\s*auto\s*!important/);
  assert.match(categoryCss, /button\[data-mobile-category-id\][\s\S]*touch-action:\s*manipulation\s*!important/);
});

test('embedded auth controls use the iframe Element realm and support buttons and tabs', () => {
  assert.match(authOverlay, /embeddedDocument\?\.defaultView\?\.Element/);
  assert.match(authOverlay, /target instanceof embeddedElement/);
  assert.doesNotMatch(authOverlay, /clickEvent\.target instanceof Element/);
  assert.match(authOverlay, /'button'/);
  assert.match(authOverlay, /'\[role="tab"\]'/);
  assert.match(authOverlay, /embeddedAuthMode\(control, activeModeRef\.current\)/);
  assert.match(authOverlay, /REGISTER_LABELS/);
  assert.match(authOverlay, /LOGIN_LABELS/);
});

test('Login and Register switch inside one mounted iframe without replaying the popup', () => {
  assert.match(authOverlay, /const initialPath = embeddedPath\(mode, requestId\)/);
  assert.match(authOverlay, /requestedPathRef = useRef\(initialPath\)/);
  assert.match(authOverlay, /frameRef = useRef<HTMLIFrameElement \| null>\(null\)/);
  assert.match(authOverlay, /ref=\{frameRef\}/);
  assert.match(authOverlay, /src=\{initialPath\}/);
  assert.match(authOverlay, /contentWindow\.location\.replace\(nextPath\)/);
  assert.doesNotMatch(authOverlay, /const path = activeMode/);
  assert.doesNotMatch(authOverlay, /setFrameReady\(false\)[\s\S]*\[activeMode\]/);

  const clickStart = authOverlay.indexOf("embeddedDocument.addEventListener('click'");
  const clickEnd = authOverlay.indexOf('}, { capture: true, signal: navigationAbort.signal });', clickStart);
  const embeddedClickHandler = authOverlay.slice(clickStart, clickEnd);
  assert.ok(clickStart >= 0 && clickEnd > clickStart);
  assert.match(embeddedClickHandler, /preventDefault\(\)/);
  assert.match(embeddedClickHandler, /stopPropagation\(\)/);
  assert.match(embeddedClickHandler, /navigateEmbeddedMode\(nextMode\)/);
  assert.match(authOverlay, /memberAuthStableShell = 'true'/);
  assert.match(authPolish, /data-member-auth-stable-shell='true'[\s\S]*animation:\s*none\s*!important/);
});

test('auth tab hit areas are large and receive touch events directly', () => {
  assert.match(authPolish, /\.public-auth-tabs\s*\{[\s\S]*pointer-events:\s*auto\s*!important/);
  assert.match(authPolish, /\.public-auth-tabs > a\s*\{[\s\S]*min-height:\s*44px\s*!important/);
  assert.match(authPolish, /\.public-auth-tabs > a\s*\{[\s\S]*touch-action:\s*manipulation\s*!important/);
  assert.match(authPolish, /@media \(max-width: 900px\)[\s\S]*\.public-auth-tabs > a\s*\{[\s\S]*min-height:\s*48px\s*!important/);
});
