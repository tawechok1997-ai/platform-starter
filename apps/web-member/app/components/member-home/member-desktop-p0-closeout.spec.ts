import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const appDirectory = path.resolve(testDirectory, '..', '..');
const repositoryRoot = path.resolve(appDirectory, '..', '..', '..');

async function readApp(relativePath: string) {
  return readFile(path.join(appDirectory, relativePath), 'utf8');
}

async function readRepository(relativePath: string) {
  return readFile(path.join(repositoryRoot, relativePath), 'utf8');
}

test('Desktop P0 runtimes have one explicit owner', async () => {
  const layout = await readApp('layout.tsx');
  const home = await readApp('member-home.tsx');

  assert.doesNotMatch(layout, /HomeSidebarScrollController/);
  assert.match(home, /import HomeSidebarScrollController from ['"]\.\/components\/member-home\/home-sidebar-scroll-controller['"]/);
  assert.equal((home.match(/<HomeSidebarScrollController\s*\/>/g) ?? []).length, 1);
  assert.match(layout, /import MemberActivityPredictionRuntime from ['"]\.\/components\/member-activity-prediction-runtime['"]/);
  assert.match(layout, /<MemberActivityPredictionRuntime\s*\/>/);
});

test('Jackpot rail has one bounded runtime owner and observes nested scrolling', async () => {
  const source = await readApp('components/member-home/home-sidebar-scroll-controller.tsx');

  assert.match(source, /sidebar\.dataset\.homeSidebarOwner = ['"]runtime['"]/);
  assert.match(source, /document\.addEventListener\(['"]scroll['"], scheduleGeometry, true\)/);
  assert.match(source, /const maxTop = Math\.max\(0, body\.scrollHeight - sidebar\.offsetHeight\)/);
  assert.match(source, /const top = Math\.min\(followTop, maxTop\)/);
  assert.match(source, /let pinTop = DEFAULT_PIN_TOP/);
  assert.doesNotMatch(source, /position['"], ['"]sticky/);
});

test('Game launch fallback uses the active platform and rejects duplicate launches', async () => {
  const source = await readApp('components/member-home/public-home-game-navigation-controller.tsx');

  assert.match(source, /launchAbortRef\.current \|\| action\.dataset\.memberGameLaunching === ['"]true['"]/);
  assert.match(source, /params\.set\(['"]platform['"], currentPlatform\(\)\)/);
  assert.match(source, /if \(mode === ['"]desktop['"]\) return ['"]pc['"]/);
  assert.doesNotMatch(source, /params\.set\(['"]platform['"], ['"]mobile['"]\)/);
});

test('Broken images close on the branded placeholder before guaranteed local 404 requests', async () => {
  const fallback = await readApp('components/image-fallback.ts');
  const controller = await readApp('components/member-image-fallback-controller.tsx');
  const resolver = await readApp('lib/local-asset-by-basename.ts');

  assert.doesNotMatch(fallback, /LOCAL_GAME_ROOT/);
  assert.doesNotMatch(fallback, /localGameRetry/);
  assert.match(fallback, /applyFallbackToImage/);
  assert.match(controller, /isUsableImageSource/);
  assert.match(controller, /dataset\.invalidOriginalSource/);
  assert.match(controller, /MutationObserver/);
  assert.match(resolver, /function unresolvedSourceOrFallback/);
  assert.ok(resolver.includes("if (/^\\/assets\\//i.test(sourcePath)) return MEMBER_IMAGE_FALLBACK;"));
  assert.match(resolver, /return MEMBER_IMAGE_FALLBACK/);
});

test('Desktop Activity submission is connected to the existing protected lottery API', async () => {
  const runtime = await readApp('components/member-activity-prediction-runtime.tsx');
  const controller = await readRepository('apps/api/src/modules/activity/member-activities.controller.ts');

  assert.match(runtime, /ROUND_CODE = ['"]lottery-2026-q4['"]/);
  assert.match(runtime, /\/member\/activities\/lottery\/\$\{encodeURIComponent\(ROUND_CODE\)\}\/entries/);
  assert.match(runtime, /method: ['"]POST['"]/);
  assert.match(runtime, /topNumber, bottomNumber/);
  assert.match(controller, /@Post\(['"]member\/activities\/lottery\/:roundCode\/entries['"]\)/);
  assert.match(controller, /submitLotteryEntry/);
});

test('Production migrations populate Activity, News, and an open lottery round', async () => {
  const contentMigration = await readRepository(
    'prisma/migrations/20260805052000_seed_desktop_activity_news_content/migration.sql',
  );
  const lotteryMigration = await readRepository(
    'prisma/migrations/20260805052500_seed_active_lottery_round/migration.sql',
  );

  assert.match(contentMigration, /'kind', 'event'/);
  assert.match(contentMigration, /'kind', 'news'/);
  assert.match(contentMigration, /source-news-member-system-ready/);
  assert.match(lotteryMigration, /features\.lottery_prediction_rounds_json/);
  assert.match(lotteryMigration, /lottery-2026-q4/);
  assert.match(lotteryMigration, /2026-12-31T15:00:00\+07:00/);
});

test('Public status route exists and auth dismissal removes auth request query state', async () => {
  const statusPage = await readApp('status/page.tsx');
  const chrome = await readApp('member-chrome.tsx');

  assert.match(statusPage, /PublicStatusPage/);
  assert.match(statusPage, /ระบบพร้อมให้บริการ/);
  assert.match(chrome, /replaceAuthHistory\(null\)/);
  assert.match(chrome, /url\.searchParams\.delete\(['"]auth['"]\)/);
  assert.match(chrome, /url\.searchParams\.delete\(['"]authRequest['"]\)/);
  assert.match(chrome, /url\.searchParams\.delete\(['"]next['"]\)/);
  assert.match(chrome, /window\.history\.replaceState\(/);
});
