import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const layout = readFileSync(new URL('../layout.tsx', import.meta.url), 'utf8');
const routeLoading = readFileSync(new URL('../loading.tsx', import.meta.url), 'utf8');
const loadingScreen = readFileSync(new URL('./member-loading-screen.tsx', import.meta.url), 'utf8');

test('root suspense and route loading share one loading screen owner', () => {
  assert.match(layout, /import MemberLoadingScreen from '\.\/components\/member-loading-screen'/);
  assert.match(layout, /<Suspense fallback=\{<MemberLoadingScreen \/>\}>/);
  assert.match(routeLoading, /import MemberLoadingScreen from '\.\/components\/member-loading-screen'/);
  assert.match(routeLoading, /return <MemberLoadingScreen \/>/);
  assert.doesNotMatch(routeLoading, /MemberBodySkeleton|member-loading-screen/);
});

test('shared loading screen owns the loading surface once', () => {
  assert.equal((loadingScreen.match(/data-member-loading-owner="true"/g) ?? []).length, 1);
  assert.match(loadingScreen, /<span className=\{styles\.spinner\} \/>/);
  assert.match(loadingScreen, /<span>L<\/span>/);
  assert.match(loadingScreen, /<span>ading<\/span>/);
});
