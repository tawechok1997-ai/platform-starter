import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const runtime = readFileSync(new URL('./mobile-category-chrome-guard.tsx', import.meta.url), 'utf8');
const memberHome = readFileSync(new URL('../../member-home.tsx', import.meta.url), 'utf8');

test('game category selection keeps the shared Home chrome and dispatches one category event', () => {
  assert.match(runtime, /data-mobile-section-owner="header"/);
  assert.match(runtime, /data-mobile-section-owner="hero"/);
  assert.match(runtime, /data-mobile-section-owner="auth-actions"/);
  assert.match(runtime, /data-mobile-section-owner="announcement"/);
  assert.match(runtime, /data-mobile-section-owner="highlight-tabs"/);
  assert.match(runtime, /member:mobile-category-select/);
  assert.match(memberHome, /<MobileCategoryChromeGuard \/>/);
});
