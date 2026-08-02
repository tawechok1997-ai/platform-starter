import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const contract = readFileSync(
  new URL('../../member-mobile-deposit-source-contract.css', import.meta.url),
  'utf8',
);

test('all member popups except the source menu use compact content-fit sizing', () => {
  assert.ok(contract.includes("[data-mobile-popup-owner]:not([data-mobile-popup-owner='menu'])"));
  assert.ok(contract.includes('padding: 44px 14px 14px !important;'));
  assert.ok(contract.includes('gap: 0 !important;'));
  assert.ok(contract.includes('max-height: calc(100dvh - 76px) !important;'));
  assert.ok(contract.includes('padding: 4px 0 0 !important;'));
  assert.ok(!contract.includes('padding: 56px 16px 16px !important;'));
});

test('the bottom-navigation menu popup remains excluded from compact overrides', () => {
  assert.ok(contract.includes(":not([data-mobile-popup-owner='menu'])"));
  assert.ok(!contract.includes("[data-mobile-popup-owner='menu'][role='dialog']"));
  assert.ok(!contract.includes("[data-mobile-popup-owner='menu'] > div:last-child"));
});

test('deposit method rows expand for labels instead of clipping or overlapping', () => {
  assert.ok(contract.includes("[data-deposit-step='method'] > section > div > button"));
  assert.ok(contract.includes('height: auto !important;'));
  assert.ok(contract.includes('min-height: 46px !important;'));
  assert.ok(contract.includes('white-space: normal !important;'));
  assert.ok(contract.includes('overflow-wrap: anywhere !important;'));
});

test('deposit content uses compact spacing without shrinking tap targets', () => {
  assert.ok(contract.includes('[data-deposit-step]'));
  assert.ok(contract.includes('gap: 12px !important;'));
  assert.ok(contract.includes('min-height: 32px !important;'));
  assert.ok(contract.includes('min-height: 44px !important;'));
});
