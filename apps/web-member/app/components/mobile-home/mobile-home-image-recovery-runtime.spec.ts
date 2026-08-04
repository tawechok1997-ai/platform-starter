import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const runtime = readFileSync(new URL('./mobile-home-image-recovery-runtime.tsx', import.meta.url), 'utf8');
const home = readFileSync(new URL('../../member-home.tsx', import.meta.url), 'utf8');

test('Mobile Home retries failed hero and promotion images with local and CDN candidates', () => {
  assert.match(runtime, /data-mobile-section-owner=\\?"hero\\?"/);
  assert.match(runtime, /data-mobile-highlight-panel=\\?"promotions\\?"/);
  assert.match(runtime, /asset-pc\/images\/FEZX\/imageslides/);
  assert.match(runtime, /asset-pc\/images\/FEZX\/promotions/);
  assert.match(runtime, /cdn\.zabbet\.com\/FEZX\/imageslides/);
  assert.match(runtime, /cdn\.zabbet\.com\/FEZX\/promotions/);
  assert.match(runtime, /API_ROOT/);
});

test('Mobile Home mounts image recovery beside its content runtimes', () => {
  assert.match(home, /MobileHomeImageRecoveryRuntime/);
  assert.match(home, /<MobileHomeImageRecoveryRuntime \/>/);
});
