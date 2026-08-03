import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const runtime = readFileSync(
  new URL('./mobile-related-popup-stack-runtime.tsx', import.meta.url),
  'utf8',
);
const controller = readFileSync(
  new URL('./public-dialog-runtime-controller.tsx', import.meta.url),
  'utf8',
);

test('only related popup children may stack above their current parent', () => {
  assert.match(runtime, /menu:\s*\['coupon'\]/);
  assert.match(runtime, /password:\s*\['contact'\]/);
  assert.match(runtime, /'network-income':\s*\['contact'\]/);
  assert.match(runtime, /'commission-income':\s*\['contact'\]/);
  assert.doesNotMatch(runtime, /deposit:\s*\[/);
  assert.doesNotMatch(runtime, /withdraw:\s*\[/);
  assert.match(runtime, /RELATED_POPUP_CHILDREN\[parent\]\.includes\(requested\)/);
});

test('closing a related child reveals the still-mounted parent popup', () => {
  assert.match(runtime, /parentDialog\.inert = true/);
  assert.match(runtime, /parentDialog\.inert = previousInert/);
  assert.match(runtime, /setRelatedPopup\(null\)/);
  assert.match(runtime, /data-mobile-popup-layer="child"/);
});

test('the global dialog owner mounts before the mobile home popup handlers', () => {
  assert.match(controller, /import MobileRelatedPopupStackRuntime/);
  assert.match(controller, /<MobileRelatedPopupStackRuntime \/>/);
});
