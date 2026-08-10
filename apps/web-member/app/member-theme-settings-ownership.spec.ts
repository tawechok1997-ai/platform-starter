import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const memberRoot = process.cwd();
const adminThemePage = path.join(memberRoot, '..', 'web-admin', 'app', '(admin)', 'settings', 'theme', 'page.tsx');
const runtimePath = path.join(memberRoot, 'app', 'member-theme-settings-runtime.tsx');
const normalizerPath = path.join(memberRoot, 'app', 'member-legacy-theme-normalizer.tsx');
const navigationControllerPath = path.join(memberRoot, 'app', 'components', 'member-navigation-state-controller.tsx');

test('all 24 Admin Theme & layout fields have one explicit Member runtime owner', () => {
  const adminSource = readFileSync(adminThemePage, 'utf8');
  const runtimeSource = readFileSync(runtimePath, 'utf8');
  const keys = [...adminSource.matchAll(/\{\s*key:\s*'([^']+)'/g)]
    .map((match) => match[1])
    .filter((key): key is string => typeof key === 'string' && key.length > 0);

  assert.equal(keys.length, 24, `Expected exactly 24 Theme & layout fields, found ${keys.length}`);

  const missing = keys.filter((key) => !runtimeSource.includes(`theme.${key}`));
  assert.deepEqual(
    missing,
    [],
    `Theme settings missing from member-theme-settings-runtime.tsx: ${missing.join(', ')}`,
  );

  assert.match(runtimeSource, /data-member-bottom-navigation='false'/);
  assert.match(runtimeSource, /data-member-desktop-sidebar='false'/);
  assert.match(runtimeSource, /--member-runtime-game-grid-columns/);
  assert.match(runtimeSource, /--mobile-source-bg:\s*var\(--member-runtime-background\)/);
  assert.match(runtimeSource, /--member-canvas:\s*var\(--member-runtime-background\)/);
});

test('legacy desktop and mobile palettes are normalized through live Theme tokens', () => {
  const normalizer = readFileSync(normalizerPath, 'utf8');
  const controller = readFileSync(navigationControllerPath, 'utf8');

  assert.match(controller, /<MemberLegacyThemeNormalizer \/>/);
  assert.match(normalizer, /getComputedStyle\(element\)/);
  assert.match(normalizer, /resolveGradient\(computed\.backgroundImage\)/);
  assert.match(normalizer, /BRAND_COLORS/);
  assert.match(normalizer, /mixWithTransparent\('--member-runtime-primary'/);
  assert.match(normalizer, /data-member-motion='subtle'/);
  assert.match(normalizer, /data-member-motion='lively'/);
  assert.match(normalizer, /--member-runtime-section-gap-desktop/);
  assert.match(normalizer, /--member-runtime-card-gap-mobile/);
  assert.match(normalizer, /\.game-lobby-grid/);
});
