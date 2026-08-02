import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const contract = readFileSync(
  new URL('../../member-mobile-deposit-source-contract.css', import.meta.url),
  'utf8',
);
const globalOwner = readFileSync(new URL('../member-floating-contact.tsx', import.meta.url), 'utf8');

test('all member popups except the source menu use true content-fit sizing', () => {
  assert.ok(contract.includes("[data-mobile-popup-owner]:not([data-mobile-popup-owner='menu'])"));
  assert.ok(contract.includes('height: max-content !important;'));
  assert.ok(contract.includes('padding: 38px 12px 12px !important;'));
  assert.ok(contract.includes('gap: 0 !important;'));
  assert.ok(contract.includes('height: auto !important;'));
  assert.ok(contract.includes('flex: 0 1 auto !important;'));
  assert.ok(contract.includes('max-height: calc(100dvh - 58px) !important;'));
  assert.ok(!contract.includes('padding: 56px 16px 16px !important;'));
});

test('the content-fit contract is mounted globally and excludes the bottom-navigation menu popup', () => {
  assert.match(globalOwner, /member-mobile-deposit-source-contract\.css/);
  assert.ok(contract.includes(":not([data-mobile-popup-owner='menu'])"));
  assert.ok(!contract.includes("[data-mobile-popup-owner='menu'][role='dialog']"));
  assert.ok(!contract.includes("[data-mobile-popup-owner='menu'] > div:last-child"));
});

test('deposit method rows stay compact while labels wrap instead of overlapping', () => {
  assert.ok(contract.includes("[data-deposit-step='method'] > section > div > button"));
  assert.ok(contract.includes('height: auto !important;'));
  assert.ok(contract.includes('min-height: 40px !important;'));
  assert.ok(contract.includes('white-space: normal !important;'));
  assert.ok(contract.includes('overflow-wrap: anywhere !important;'));
});

test('member popup controls keep usable touch targets without stretching the dialog', () => {
  assert.ok(contract.includes('[data-deposit-step]'));
  assert.ok(contract.includes('gap: 8px !important;'));
  assert.ok(contract.includes('min-height: 42px !important;'));
  assert.ok(contract.includes('height: 44px !important;'));
  assert.ok(contract.includes("[data-mobile-popup-owner='language']"));
});
