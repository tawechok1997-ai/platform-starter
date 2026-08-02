import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const controller = readFileSync(new URL('./public-live-navigation-controller.tsx', import.meta.url), 'utf8');
const shell = readFileSync(new URL('./persistent-member-shell.tsx', import.meta.url), 'utf8');
const desktopHome = readFileSync(new URL('./member-home/desktop-home-scaffold.tsx', import.meta.url), 'utf8');

test('desktop live actions always navigate to the live page', () => {
  assert.match(controller, /const LIVE_ROUTE = '\/live'/);
  assert.match(controller, /\.source-live-card__watch/);
  assert.match(controller, /\.source-live-card__bet/);
  assert.match(controller, /a\[href="\/#live"\]/);
  assert.match(controller, /router\.push\(LIVE_ROUTE\)/);
  assert.doesNotMatch(controller, /category=sport/);
  assert.doesNotMatch(controller, /SPORT_ROUTE/);
});

test('legacy desktop live anchors remain recoverable', () => {
  assert.match(shell, /key: 'live', href: '\/#live'/);
  assert.match(controller, /event\.stopImmediatePropagation\(\)/);
});

test('desktop home live cards still expose controller-owned actions', () => {
  assert.match(desktopHome, /<SourceLiveSection onAction=\{openLiveAction\} \/>/);
});
