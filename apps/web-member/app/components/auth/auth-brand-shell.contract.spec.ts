import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const shellSource = readFileSync(new URL('./auth-brand-shell.tsx', import.meta.url), 'utf8');
const styleSource = readFileSync(new URL('./auth-brand-shell.module.css', import.meta.url), 'utf8');

test('auth shell remains presentation-only and preserves runtime branding attributes', () => {
  assert.match(shellSource, /useBrandRuntime/);
  assert.match(shellSource, /data-auth-mode/);
  assert.match(shellSource, /data-brand-code/);
  assert.match(shellSource, /data-brand-ready/);
  assert.doesNotMatch(shellSource, /adminApiFetch|memberApiFetch|fetch\(/);
  assert.doesNotMatch(shellSource, /onSubmit|captcha|redirect|setSession|clearSession/i);
});

test('auth shell keeps responsive and accessibility styling contracts', () => {
  assert.match(styleSource, /min-height:\s*100svh/);
  assert.match(styleSource, /@media \(max-width:\s*560px\)/);
  assert.match(styleSource, /@media \(prefers-reduced-motion:\s*reduce\)/);
  assert.match(shellSource, /aria-label=\{brand\.name\}/);
  assert.match(shellSource, /alt=\{brand\.name\}/);
});
