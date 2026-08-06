import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const sessionProvider = readFileSync(new URL('../member-session-provider.tsx', import.meta.url), 'utf8');
const loadingScreen = readFileSync(new URL('./member-loading-screen.tsx', import.meta.url), 'utf8');

test('the initial session boot shows the shared loading screen', () => {
  assert.match(sessionProvider, /import MemberLoadingScreen from '\.\/components\/member-loading-screen'/);
  assert.match(sessionProvider, /\{!ready \? <MemberLoadingScreen \/> : null\}/);
});

test('the shared loading screen keeps desktop and mobile owners', () => {
  assert.match(loadingScreen, /<MemberDesktopLoadingScreen \/>/);
  assert.match(loadingScreen, /<MemberMobileLoadingScreen \/>/);
});
