import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const runtime = readFileSync(new URL('./public-dialog-runtime-controller.tsx', import.meta.url), 'utf8');
const contract = readFileSync(new URL('../member-public-modal-viewport-contract.css', import.meta.url), 'utf8');

test('public dialog runtime only supplies semantic hooks', () => {
  assert.match(runtime, /dataset\.publicDialogOverlay = kind/);
  assert.match(runtime, /classList\.add\('public-dialog-runtime-overlay'\)/);
  assert.match(runtime, /classList\.add\('public-dialog-runtime'/);
  assert.doesNotMatch(runtime, /style\.setProperty/);
  assert.doesNotMatch(runtime, /2147483647/);
});

test('public dialog viewport and layer styling remain in the CSS contract', () => {
  assert.match(contract, /\.public-dialog-runtime-overlay/);
  assert.match(contract, /\.public-dialog-runtime\s*\{/);
  assert.match(contract, /position:\s*fixed\s*!important/);
  assert.match(contract, /z-index:\s*2147483647\s*!important/);
  assert.match(contract, /max-height:\s*calc\(100dvh - 32px\)\s*!important/);
});
