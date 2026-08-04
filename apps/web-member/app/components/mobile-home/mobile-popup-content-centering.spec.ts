import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const css = readFileSync(
  new URL('../../member-viewport-ui-isolation.css', import.meta.url),
  'utf8',
);

test('all current mobile popup content owners center short content vertically', () => {
  assert.equal(css.includes("section[data-mobile-popup-owner] > div:last-child"), true);
  assert.equal(css.includes('.member-existing-popup-content'), true);
  assert.equal(css.includes('.member-source-popup-body'), true);
  assert.equal(css.includes('.member-header-deposit-content'), true);
  assert.equal(css.includes('.member-header-withdraw-content'), true);
  assert.equal(css.includes('.member-bank-account-content'), true);
  assert.equal(css.includes('.member-modal-system__content'), true);
  assert.match(css, /margin-top:\s*auto\s*!important/);
  assert.match(css, /margin-bottom:\s*auto\s*!important/);
});

test('the centering contract does not resize popup geometry', () => {
  const marker = '/* Keep every current Mobile popup';
  const start = css.indexOf(marker);
  assert.ok(start >= 0);
  const contract = css.slice(start).replace(/\/\*[\s\S]*?\*\//g, '');
  assert.doesNotMatch(contract, /(?:^|[;{\s])(?:width|height|max-height|max-width|padding)\s*:/m);
});
