import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const memberHome = readFileSync(new URL('../../member-home.tsx', import.meta.url), 'utf8');
const mobileRoot = readFileSync(new URL('./mobile-home-root.tsx', import.meta.url), 'utf8');
const memberFooter = readFileSync(new URL('../../member-footer.tsx', import.meta.url), 'utf8');
const floatingContact = readFileSync(new URL('../member-floating-contact.tsx', import.meta.url), 'utf8');

test('mobile home has exactly one render owner', () => {
  assert.equal((memberHome.match(/<MobileHomeRoot\s*\/>/g) ?? []).length, 1);
  assert.match(memberHome, /viewportMode === 'mobile'/);
  assert.match(mobileRoot, /data-ui-owner="mobile-home"/);
});

test('mobile home owner does not import desktop or legacy UI', () => {
  assert.doesNotMatch(mobileRoot, /DesktopHomeScaffold/);
  assert.doesNotMatch(mobileRoot, /MemberFooter/);
  assert.doesNotMatch(mobileRoot, /DesktopAllianceBand/);
  assert.doesNotMatch(mobileRoot, /MutationObserver/);
});

test('legacy shared UI stays out of the mobile home route', () => {
  assert.match(memberFooter, /viewport === 'mobile'[\s\S]*window\.location\.pathname === '\/'[\s\S]*return null/);
  assert.match(floatingContact, /pathname === '\/' && isMobile !== false[\s\S]*return null/);
});
