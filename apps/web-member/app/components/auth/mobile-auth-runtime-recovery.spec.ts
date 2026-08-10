import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const runtime = readFileSync(new URL('./auth-field-runtime.tsx', import.meta.url), 'utf8');
const overlay = readFileSync(new URL('./member-auth-overlay.tsx', import.meta.url), 'utf8');
const layout = readFileSync(new URL('../../(auth)/layout.tsx', import.meta.url), 'utf8');
const sourceSetOne = readFileSync(new URL('./auth-popup-source-set1-final.css', import.meta.url), 'utf8');
const home = readFileSync(new URL('../../member-home.tsx', import.meta.url), 'utf8');
const drawer = readFileSync(new URL('../mobile-home/mobile-drawer-reference-parity.css', import.meta.url), 'utf8');
const drawerModule = readFileSync(new URL('../mobile-home/mobile-home-root.module.css', import.meta.url), 'utf8');
const hero = readFileSync(new URL('../mobile-home/mobile-hero-carousel.css', import.meta.url), 'utf8');

test('password field enhancement reuses its own runtime toggle instead of creating an observer loop', () => {
  assert.match(
    runtime,
    /querySelector<HTMLButtonElement>\('\.public-auth-eye, \.source-login-eye, \.auth-runtime-password-eye'\)/,
  );
  assert.match(runtime, /if \(existingToggle\) \{[\s\S]*return;/);
});

test('Login and Register keep one mounted popup shell while switching modes', () => {
  const modeSwitch = overlay.match(/const navigateEmbeddedMode = useCallback\([\s\S]*?\n  \}, \[requestId, switchMode\]\);/)?.[0] ?? '';
  assert.match(modeSwitch, /requestedPathRef\.current = nextPath;\s*switchMode\(nextMode\);/);
  assert.doesNotMatch(modeSwitch, /setFrameReady\(false\)/);
  assert.match(overlay, /<iframe[\s\S]*src=\{initialPath\}/);
});

test('accepted Mobile Source Set 1 is again the final auth stylesheet owner', () => {
  const imports = [...layout.matchAll(/import ['"]([^'"]+\.css)['"]/g)].map((match) => match[1]);
  assert.equal(imports.at(-1), '../components/auth/auth-popup-source-set1-final.css');
  assert.match(sourceSetOne, /grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)\s*!important/);
  assert.match(sourceSetOne, /clip-path:\s*none\s*!important/);
  assert.match(sourceSetOne, /a\[aria-current='page'\][\s\S]*background:\s*#3e3a49\s*!important/);
  assert.match(sourceSetOne, /height:\s*56px\s*!important/);
  assert.match(sourceSetOne, /source-login-close[\s\S]*background:\s*#fff\s*!important/);
});

test('Mobile Home restores the source drawer chain and removes screenshot-guessed visual owners', () => {
  assert.match(
    home,
    /mobile-hero-carousel\.css';\s*import '\.\/components\/mobile-home\/mobile-drawer-reference-parity\.css';\s*import '\.\/components\/mobile-home\/mobile-leaderboard-fit\.css';/,
  );
  assert.doesNotMatch(home, /mobile-reference-fidelity-final\.css/);
  assert.doesNotMatch(home, /mobile-auth-drawer-runtime-correction\.css/);
});

test('Mobile drawer keeps source geometry and exactly one 445px glow owner', () => {
  assert.match(drawer, /width:\s*min\(340px, 100vw\)\s*!important/);
  assert.match(drawer, /padding:\s*20px 23px\s*!important/);
  assert.match(drawer, /background:\s*rgb\(17 14 22\)\s*!important/);
  assert.doesNotMatch(drawer, /radial-gradient\(circle 222\.5px at 50% 0%/);
  assert.match(drawerModule, /\.drawerGlow\s*\{[\s\S]*width:\s*445px;[\s\S]*height:\s*445px;[\s\S]*opacity:\s*0\.4;/);
  assert.match(drawer, /background:\s*rgb\(187 91 234 \/ 10%\)\s*!important/);
  assert.match(drawer, /linear-gradient\(rgb\(129 104 157\), rgb\(206 156 186\)\)\s*!important/);
  assert.match(drawer, /linear-gradient\(rgb\(114 4 85\), rgb\(145 10 103\)\)\s*!important/);
});

test('Mobile Hero indicators stay over the lower edge of the banner', () => {
  assert.match(hero, /\[data-mobile-section-owner='hero'\]\s*\{[\s\S]*position:\s*relative\s*!important/);
  assert.match(hero, /> div\[aria-label\][\s\S]*position:\s*absolute\s*!important/);
  assert.match(hero, /bottom:\s*7px\s*!important/);
  assert.match(hero, /> div\[aria-label\][\s\S]*pointer-events:\s*none\s*!important/);
  assert.match(hero, /> button[\s\S]*pointer-events:\s*auto\s*!important/);
});
