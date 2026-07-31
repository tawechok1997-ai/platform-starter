import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const responsiveCss = readFileSync(
  new URL('../../member-responsive-contract.css', import.meta.url),
  'utf8',
);
const navigationController = readFileSync(
  new URL('../member-navigation-auth-controller.tsx', import.meta.url),
  'utf8',
);
const mobileMenuRoute = readFileSync(
  new URL('../../mobile-menu/[section]/page.tsx', import.meta.url),
  'utf8',
);

test('mobile drawer uses the same real destinations and auth guard as desktop navigation', () => {
  assert.match(navigationController, /#mobile-home-drawer a\[href\]/);
  assert.doesNotMatch(navigationController, /MOBILE_REFERENCE_TARGETS/);
  assert.doesNotMatch(navigationController, /MOBILE_LOGIN_TARGETS/);
  assert.doesNotMatch(navigationController, /\/mobile-menu\//);
  assert.match(navigationController, /navigation\s*\.filter\(\(item\) => item\.requiresAuth\)/);
});

test('mobile home owns the complete phone and tablet range without a narrow fixed shell', () => {
  assert.match(responsiveCss, /\[data-mobile-home-root='true'\]/);
  assert.match(responsiveCss, /max-width:\s*900px\s*!important/);
  assert.match(responsiveCss, /@media \(min-width: 600px\) and \(max-width: 900px\)/);
  assert.doesNotMatch(responsiveCss, /max-width:\s*428px\s*!important/);
  assert.doesNotMatch(responsiveCss, /max-width:\s*640px\s*!important/);
});

test('source-matched menu pages remain fluid on phone tablet and desktop browsers', () => {
  assert.match(responsiveCss, /\[data-mobile-reference-section\] > div/);
  assert.match(responsiveCss, /width:\s*min\(100%, 1180px\)\s*!important/);
  assert.match(responsiveCss, /@media \(min-width: 901px\)/);
  assert.match(responsiveCss, /@media \(min-width: 1100px\)/);
});

test('dynamic mobile compatibility route follows the Next 15 async params contract', () => {
  assert.match(mobileMenuRoute, /params:\s*Promise<\{ section: string \}>/);
  assert.match(mobileMenuRoute, /export default async function MobileMenuSectionPage/);
  assert.match(mobileMenuRoute, /const \{ section \} = await params/);
});
