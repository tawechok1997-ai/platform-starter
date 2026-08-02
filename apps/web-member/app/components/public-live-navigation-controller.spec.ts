import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const controller = readFileSync(new URL('./public-live-navigation-controller.tsx', import.meta.url), 'utf8');
const shell = readFileSync(new URL('./persistent-member-shell.tsx', import.meta.url), 'utf8');
const desktopHome = readFileSync(new URL('./member-home/desktop-home-scaffold.tsx', import.meta.url), 'utf8');

test('desktop live actions always navigate to the live page', () => {
  assert.match(controller, /const LIVE_ROUTE = '\/live'/);
  assert.equal(controller.includes('.source-live-card__watch'), true);
  assert.equal(controller.includes('.source-live-card__bet'), true);
  assert.equal(controller.includes('.member-desktop-nav a[href="/#live"]'), true);
  assert.match(controller, /router\.push\(LIVE_ROUTE\)/);
  assert.doesNotMatch(controller, /category=sport/);
  assert.doesNotMatch(controller, /SPORT_ROUTE/);
});

test('legacy desktop live anchors remain recoverable', () => {
  assert.equal(shell.includes("key: 'live', href: '/#live'"), true);
  assert.match(controller, /event\.stopImmediatePropagation\(\)/);
});

test('desktop home live cards still expose controller-owned actions', () => {
  assert.match(desktopHome, /<SourceLiveSection onAction=\{openLiveAction\} \/>/);
});
