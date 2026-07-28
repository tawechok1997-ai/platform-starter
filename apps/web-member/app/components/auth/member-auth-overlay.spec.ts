import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const overlay = readFileSync(new URL('./member-auth-overlay.tsx', import.meta.url), 'utf8');
const interceptor = readFileSync(new URL('./member-auth-link-interceptor.tsx', import.meta.url), 'utf8');

test('auth overlay and link interceptor share the mode-switch contract', () => {
  assert.match(overlay, /export type MemberAuthOverlayProps/);
  assert.match(overlay, /onModeChange\?: \(mode: MemberAuthMode\) => void/);
  assert.match(overlay, /data\.type === 'member-auth-mode'/);
  assert.match(overlay, /onModeChange\?\.\(data\.mode\)/);
  assert.match(interceptor, /onModeChange=\{setMode\}/);
});
