import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (file: string) => readFileSync(new URL(file, import.meta.url), 'utf8');

test('desktop and mobile loading screens use the shared branded motion language', () => {
  const desktop = read('./member-desktop-loading-screen.tsx');
  const mobile = read('./member-mobile-loading-screen.tsx');

  for (const source of [desktop, mobile]) {
    assert.match(source, /logoShell/);
    assert.match(source, /loadingDots/);
    assert.match(source, /progressTrack/);
    assert.match(source, /skeleton/);
    assert.match(source, /9ee1acbf-c1e2-44e9-bffd-3254ff56b5f7\.png/);
  }
});

test('loading motion respects reduced-motion preferences', () => {
  const desktopCss = read('./member-desktop-loading-screen.module.css');
  const mobileCss = read('./member-mobile-loading-screen.module.css');
  const routeCss = read('./member-route-progress.module.css');

  for (const source of [desktopCss, mobileCss, routeCss]) {
    assert.match(source, /prefers-reduced-motion:\s*reduce/);
    assert.match(source, /animation:\s*none\s*!important/);
  }
});

test('internal route changes expose a professional progress indicator on every member page', () => {
  const controller = read('./member-client-navigation-controller.tsx');
  const routeCss = read('./member-route-progress.module.css');

  assert.match(controller, /data-member-route-progress="true"/);
  assert.match(controller, /member-route-progress\.module\.css/);
  assert.match(routeCss, /data-member-route-motion='leaving'/);
  assert.match(routeCss, /data-member-route-motion='entering'/);
  assert.match(routeCss, /memberRouteProgressTravel/);
  assert.match(routeCss, /memberRouteProgressFinish/);
});
