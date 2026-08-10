import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const layout = readFileSync(new URL('../layout.tsx', import.meta.url), 'utf8');
const routeLoading = readFileSync(new URL('../loading.tsx', import.meta.url), 'utf8');
const responsiveLoading = readFileSync(new URL('./member-loading-screen.tsx', import.meta.url), 'utf8');
const desktopLoading = readFileSync(new URL('./member-desktop-loading-screen.tsx', import.meta.url), 'utf8');
const mobileLoading = readFileSync(new URL('./member-mobile-loading-screen.tsx', import.meta.url), 'utf8');

test('root suspense and route loading use the responsive loading selector', () => {
  assert.match(layout, /import MemberLoadingScreen from '\.\/components\/member-loading-screen'/);
  assert.match(layout, /<Suspense fallback=\{<MemberLoadingScreen \/>\}>/);
  assert.match(routeLoading, /import MemberLoadingScreen from '\.\/components\/member-loading-screen'/);
  assert.match(routeLoading, /return <MemberLoadingScreen \/>/);
});

test('desktop and mobile loading surfaces are separate components', () => {
  assert.match(responsiveLoading, /import MemberDesktopLoadingScreen from '\.\/member-desktop-loading-screen'/);
  assert.match(responsiveLoading, /import MemberMobileLoadingScreen from '\.\/member-mobile-loading-screen'/);
  assert.match(responsiveLoading, /<MemberDesktopLoadingScreen \/>/);
  assert.match(responsiveLoading, /<MemberMobileLoadingScreen \/>/);

  assert.equal((desktopLoading.match(/data-member-loading-owner="desktop"/g) ?? []).length, 1);
  assert.equal((mobileLoading.match(/data-member-loading-owner="mobile"/g) ?? []).length, 1);
  assert.match(desktopLoading, /member-desktop-loading-screen\.module\.css/);
  assert.match(mobileLoading, /member-mobile-loading-screen\.module\.css/);
});

test('both loaders keep one branded loading-stage contract without sharing markup', () => {
  for (const source of [desktopLoading, mobileLoading]) {
    assert.match(source, /className=\{styles\.stage\}/);
    assert.match(source, /className=\{styles\.logoShell\}/);
    assert.match(source, /className=\{styles\.loadingDots\}/);
    assert.match(source, /className=\{styles\.progressTrack\}/);
    assert.match(source, /className=\{styles\.skeleton\}/);
    assert.match(source, /9ee1acbf-c1e2-44e9-bffd-3254ff56b5f7\.png/);
  }

  assert.doesNotMatch(desktopLoading, /className=\{styles\.spinner\}/);
  assert.doesNotMatch(mobileLoading, /className=\{styles\.spinner\}/);
  assert.doesNotMatch(responsiveLoading, /className=\{styles\./);
});
