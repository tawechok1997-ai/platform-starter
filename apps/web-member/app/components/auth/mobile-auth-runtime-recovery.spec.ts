import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const runtime = readFileSync(new URL('./auth-field-runtime.tsx', import.meta.url), 'utf8');
const home = readFileSync(new URL('../../member-home.tsx', import.meta.url), 'utf8');
const correction = readFileSync(new URL('../mobile-home/mobile-auth-drawer-runtime-correction.css', import.meta.url), 'utf8');

test('password field enhancement reuses its own runtime toggle instead of creating an observer loop', () => {
  assert.match(
    runtime,
    /querySelector<HTMLButtonElement>\('\.public-auth-eye, \.source-login-eye, \.auth-runtime-password-eye'\)/,
  );
  assert.match(runtime, /if \(existingToggle\) \{[\s\S]*return;/);
});

test('Mobile Home loads runtime correction after the previous fidelity owner', () => {
  assert.match(
    home,
    /mobile-reference-fidelity-final\.css';\s*import '\.\/components\/mobile-home\/mobile-auth-drawer-runtime-correction\.css';/,
  );
});

test('mobile auth keeps the underlying page visible and drawer colors match the supplied source screenshot', () => {
  assert.match(correction, /background-color:\s*rgb\(0 0 0 \/ 48%\)\s*!important/);
  assert.match(correction, /#110e16\s*!important/);
  assert.match(correction, /background:\s*#22152b\s*!important/);
  assert.match(correction, /rgb\(187 91 234 \/ 40%\)/);
  assert.match(correction, /span:first-child[\s\S]*background:\s*transparent\s*!important/);
  assert.match(correction, /span:last-child[\s\S]*background:\s*transparent\s*!important/);
  assert.match(correction, /linear-gradient\(rgb\(129 104 157\), rgb\(206 156 186\)\)/);
  assert.match(correction, /linear-gradient\(rgb\(114 4 85\), rgb\(145 10 103\)\)/);
});
