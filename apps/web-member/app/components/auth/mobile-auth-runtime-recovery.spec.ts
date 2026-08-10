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
  assert.match(correction, /background-color:\s*rgb\(0 0 0 \/ 38%\)\s*!important/);
  assert.match(correction, /#0a0a0a\s*!important/);
  assert.match(correction, /#2a2518/);
  assert.match(correction, /#272215/);
  assert.match(correction, /rgb\(107 23 126 \/ 18%\)/);
  assert.match(correction, /span:first-child[\s\S]*background:\s*transparent\s*!important/);
  assert.match(correction, /span:last-child[\s\S]*background:\s*transparent\s*!important/);
  assert.match(correction, /linear-gradient\(180deg, #9f87b1 0%, #d0a1c1 100%\)/);
  assert.match(correction, /linear-gradient\(180deg, #8e2371 0%, #850d65 44%, #a80d7e 100%\)/);
});
