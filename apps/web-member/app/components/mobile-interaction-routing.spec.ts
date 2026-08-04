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
  assert.match(authOverlay, /initialPathRef = useRef/);
  assert.match(authOverlay, /src=\{initialPathRef\.current\}/);
  assert.doesNotMatch(authOverlay, /const path = activeMode/);
  assert.doesNotMatch(authOverlay, /setFrameReady\(false\)[\s\S]*\[activeMode\]/);

  const embeddedClickHandler = authOverlay.slice(
    authOverlay.indexOf("embeddedDocument.addEventListener('click'"),
    authOverlay.indexOf('}, true);', authOverlay.indexOf("embeddedDocument.addEventListener('click'")),
  );
  assert.doesNotMatch(embeddedClickHandler, /preventDefault\(|stopPropagation\(|stopImmediatePropagation\(/);
  assert.match(authOverlay, /memberAuthStableShell = 'true'/);
  assert.match(authPolish, /data-member-auth-stable-shell='true'[\s\S]*animation:\s*none\s*!important/);
});
