import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const runtime = readFileSync(new URL('./mobile-p10-p12-closure-runtime.tsx', import.meta.url), 'utf8');
const localeProvider = readFileSync(new URL('../../member-locale-provider.tsx', import.meta.url), 'utf8');
const mobileHome = readFileSync(new URL('./mobile-home-root.tsx', import.meta.url), 'utf8');
const mobileSmokeWorkflow = readFileSync(new URL('../../../../../.github/workflows/mobile-home-smoke.yml', import.meta.url), 'utf8');

test('P10 keeps one locale owner with only Thai and English enabled', () => {
  assert.match(localeProvider, /export type MemberLocale = 'th' \| 'en'/);
  assert.match(localeProvider, /const STORAGE_KEY = 'member_locale'/);
  assert.match(localeProvider, /document\.documentElement\.lang = locale/);
  assert.match(localeProvider, /<MobileP10P12ClosureRuntime locale=\{locale\} \/>/);
  assert.match(runtime, /const SUPPORTED_LOCALES = new Set<MemberLocale>\(\['th', 'en'\]\)/);
  assert.match(runtime, /patchUnsupportedLanguageOptions/);
  assert.match(runtime, /candidate\.dataset\.mobileUnsupportedLocale = 'true'/);
  assert.match(mobileHome, /const \{ locale, toggleLocale \} = useMemberLocale\(\)/);
  assert.match(mobileHome, /aria-label=\{copy\.changeLanguage\}/);
});

test('P11 restores accessible names, touch targets, focus visibility, and keyboard scrolling', () => {
  assert.match(runtime, /patchFormControlNames\(locale\)/);
  assert.match(runtime, /control\.setAttribute\('aria-label', deriveControlLabel\(control, locale\)\)/);
  assert.match(runtime, /min-inline-size: 44px !important/);
  assert.match(runtime, /min-block-size: 44px !important/);
  assert.match(runtime, /data-mobile-keyboard-scroll="true"/);
  assert.match(runtime, /event\.key === 'ArrowRight'/);
  assert.match(runtime, /event\.key === 'PageDown'/);
  assert.match(runtime, /outline: 3px solid #f0b7ff !important/);
  assert.match(runtime, /prefers-reduced-motion: reduce/);
});

test('P11 normalizes drawer and VIP ARIA without changing finance or provider mutations', () => {
  assert.match(runtime, /drawer\.setAttribute\('role', 'dialog'\)/);
  assert.match(runtime, /drawer\.setAttribute\('aria-modal', 'true'\)/);
  assert.match(runtime, /patchVipSectionLockAria/);
  assert.match(runtime, /PROHIBITED_SECTION_LOCK_ARIA\.forEach/);
  assert.doesNotMatch(runtime, /fetch\(|memberApiFetch\(|POST|PUT|PATCH|DELETE/);
});

test('P12 requires the dedicated browser smoke in the existing three-viewport gate', () => {
  assert.match(mobileSmokeWorkflow, /r013-mobile-p10-p12-smoke\.spec\.ts/);
  assert.match(mobileSmokeWorkflow, /--project=360x800/);
  assert.match(mobileSmokeWorkflow, /--project=390x844/);
  assert.match(mobileSmokeWorkflow, /--project=430x932/);
});
