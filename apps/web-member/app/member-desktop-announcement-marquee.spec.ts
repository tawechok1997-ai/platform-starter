import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const layout = readFileSync(new URL('./layout.tsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('./member-desktop-announcement-marquee.css', import.meta.url), 'utf8');

test('shared final motion owner loads after the other motion layers', () => {
  assert.match(
    layout,
    /import '\.\/member-desktop-motion-final\.css';\s*import '\.\/member-desktop-announcement-marquee\.css';/,
  );
});

test('Desktop announcement continuously scrolls inside its clipped viewport', () => {
  assert.match(css, /@media \(min-width:\s*901px\)/);
  assert.match(css, /\.reference-announcement-viewport[\s\S]*overflow:\s*hidden\s*!important/);
  assert.match(css, /\.reference-announcement-track\s*>\s*span[\s\S]*padding-left:\s*100%\s*!important/);
  assert.match(css, /animation:\s*desktop-reference-announcement-marquee\s+18s\s+linear\s+infinite\s*!important/);
  assert.match(css, /@keyframes desktop-reference-announcement-marquee/);
  assert.match(css, /translate3d\(-100%,\s*0,\s*0\)/);
});

test('Mobile announcement uses the duplicated source sets as one seamless ticker', () => {
  assert.match(css, /data-mobile-announcement-track='true'/);
  assert.match(css, /animation:\s*member-mobile-announcement-marquee\s+18s\s+linear\s+infinite\s*!important/);
  assert.match(css, /data-mobile-announcement-set='true'[\s\S]*width:\s*max-content\s*!important/);
  assert.match(css, /@keyframes member-mobile-announcement-marquee/);
  assert.match(css, /translate3d\(-50%,\s*0,\s*0\)/);
});

test('Hero gestures remain mouse and touch draggable on both viewport owners', () => {
  assert.match(css, /\.reference-hero-carousel,[\s\S]*data-mobile-section-owner='hero'/);
  assert.match(css, /touch-action:\s*pan-y\s*!important/);
  assert.match(css, /cursor:\s*grab\s*!important/);
  assert.match(css, /cursor:\s*grabbing\s*!important/);
  assert.match(css, /-webkit-user-drag:\s*none\s*!important/);
});

test('Auth keeps one stable shell size and slides the same iframe between modes', () => {
  assert.match(css, /member-auth-overlay\[data-frame-ready='false'\][\s\S]*title='สมัครสมาชิก'/);
  assert.match(css, /translate3d\(-28px,\s*0,\s*0\)/);
  assert.match(css, /title='เข้าสู่ระบบ'[\s\S]*translate3d\(28px,\s*0,\s*0\)/);
  assert.match(css, /width:\s*min\(980px,\s*calc\(100vw - 40px\)\)\s*!important/);
  assert.match(css, /grid-template-columns:\s*minmax\(0,\s*543px\)\s+minmax\(0,\s*380px\)\s*!important/);
  assert.match(css, /source-login-tabs,\s*\.source-register-tabs/);
  assert.match(css, /source-register-progress[\s\S]*display:\s*none\s*!important/);
  assert.match(css, /width:\s*min\(360px,\s*calc\(100vw - 24px\)\)\s*!important/);
});

test('Jackpot presentation uses tabular digits while the shared runtime interpolates values', () => {
  assert.match(css, /home-jackpot__value/);
  assert.match(css, /font-variant-numeric:\s*tabular-nums\s*!important/);
  assert.match(css, /font-feature-settings:\s*'tnum' 1\s*!important/);
});
