import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const layout = readFileSync(new URL('../layout.tsx', import.meta.url), 'utf8');
const runtime = readFileSync(new URL('./mobile-local-asset-runtime.tsx', import.meta.url), 'utf8');
const fallbackController = readFileSync(new URL('./member-image-fallback-controller.tsx', import.meta.url), 'utf8');
const theme = readFileSync(new URL('../member-mobile-source-theme.css', import.meta.url), 'utf8');
const popupStyles = readFileSync(new URL('./mobile-home/mobile-member-popup-runtime.module.css', import.meta.url), 'utf8');

test('mobile local asset runtime is mounted exactly once', () => {
  assert.equal((layout.match(/<MobileLocalAssetRuntime\s*\/>/g) ?? []).length, 1);
  assert.equal((layout.match(/import MobileLocalAssetRuntime/g) ?? []).length, 1);
});

test('rendered mobile CDN media resolves to local assets without affecting desktop', () => {
  assert.match(runtime, /matchMedia\('\(max-width: 900px\)'\)/);
  assert.match(runtime, /closest\(MOBILE_MEDIA_SCOPE\)/);
  assert.match(runtime, /querySelectorAll<HTMLImageElement>\('img\[src\]'\)/);
  assert.match(runtime, /resolveLocalAssetByBasename\(currentSource, 'mobile'\)/);
  assert.match(runtime, /resolveLocalAssetByBasename\(currentSource, 'pc'\)/);
  assert.doesNotMatch(runtime, /min-width:\s*901px|data-desktop|desktop-reference-home/);
});

test('local media failure returns to the original CDN only once before generic fallback', () => {
  assert.match(runtime, /mobileOriginalSource/);
  assert.match(runtime, /mobileLocalSource/);
  assert.match(runtime, /mobileLocalFailedSource/);
  assert.match(fallbackController, /image\.dataset\.mobileLocalFailedSource = originalMobileSource/);
  assert.match(fallbackController, /image\.src = originalMobileSource/);
  assert.match(fallbackController, /image\.src = MEMBER_IMAGE_FALLBACK/);
});

test('mobile source theme is scoped to mobile owners and popup height accounts for safe areas', () => {
  assert.match(theme, /@media \(max-width: 900px\)/);
  assert.match(theme, /data-mobile-home-root/);
  assert.match(theme, /data-mobile-member-page/);
  assert.match(theme, /data-mobile-search-owner/);
  assert.match(theme, /data-mobile-avatar-owner/);
  assert.match(theme, /data-mobile-popup-owner/);
  assert.match(popupStyles, /safe-area-inset-top/);
  assert.match(popupStyles, /safe-area-inset-bottom/);
  assert.match(popupStyles, /max-height:\s*calc\(100dvh - max\(32px, env\(safe-area-inset-top\) \+ env\(safe-area-inset-bottom\)\)\)/);
});
