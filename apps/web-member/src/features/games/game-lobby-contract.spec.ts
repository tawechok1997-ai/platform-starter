import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const pageSource = readFileSync(new URL('../../../app/games/page.tsx', import.meta.url), 'utf8');
const styleSource = readFileSync(new URL('../../../app/games/games.css', import.meta.url), 'utf8');
const enhancementStyleSource = readFileSync(new URL('../../../app/games/lobby-enhancements.css', import.meta.url), 'utf8');

test('game lobby exposes platform, provider, category and search controls', () => {
  assert.match(pageSource, /aria-label="เลือกแพลตฟอร์มเกม"/);
  assert.match(pageSource, /\(\['all', 'mobile', 'pc'\] as PlatformFilter\[\]\)/);
  assert.match(pageSource, /ทุกค่าย/);
  assert.match(pageSource, /ค้นหาเกมหรือค่าย/);
  assert.match(pageSource, /aria-label="หมวดเกม"/);
  assert.match(pageSource, /game-lobby-tabs/);
  assert.match(styleSource, /\.game-lobby-tabs\s*\{[\s\S]*?display:\s*flex/);
  assert.match(styleSource, /\.game-lobby-toolbar\s*\{[\s\S]*?display:\s*grid/);
});

test('game lobby keeps explicit desktop and responsive grid contracts', () => {
  assert.match(styleSource, /grid-template-columns:\s*repeat\(4,minmax\(0,1fr\)\)/);
  assert.match(styleSource, /@media\s*\(max-width:\s*900px\)[\s\S]*?repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(styleSource, /@media\s*\(max-width:\s*640px\)[\s\S]*?repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(styleSource, /@media\s*\(max-width:\s*360px\)[\s\S]*?grid-template-columns:\s*1fr/);
});

test('game lobby includes error feedback, incremental loading and broken-image fallback', () => {
  assert.match(pageSource, /role="alert"/);
  assert.match(pageSource, /โหลดเพิ่ม/);
  assert.match(pageSource, /loadingMore/);
  assert.match(pageSource, /onError=/);
  assert.match(pageSource, /game-lobby-fallback/);
  assert.match(pageSource, /resetFilters/);
});

test('provider selector preserves accessible filtering and normalized provider metadata', () => {
  assert.match(pageSource, /className="game-lobby-provider"/);
  assert.match(pageSource, /<select value=\{provider\}/);
  assert.match(pageSource, /payload\.providers\.map/);
  assert.match(pageSource, /setProvider\(event\.target\.value\)/);
  assert.match(pageSource, /logoUrl:\s*typeof item\.logoUrl === 'string'/);
  assert.match(pageSource, /if \(provider !== 'all'\) params\.set\('provider', provider\)/);
});

test('lobby loading state uses a stable skeleton contract', () => {
  assert.match(pageSource, /function LobbySkeleton/);
  assert.match(pageSource, /Array\.from\(\{ length: 12 \}/);
  assert.match(pageSource, /game-lobby-card-skeleton/);
  assert.match(pageSource, /aria-busy="true"/);
  assert.match(styleSource, /@keyframes\s+gameLobbyShimmer/);
  assert.match(styleSource, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
});

test('hero and game rails remain wired to lobby behavior', () => {
  assert.match(pageSource, /function LobbyHero/);
  assert.match(pageSource, /<HotGamesRail/);
  assert.match(pageSource, /payload\.popular\.length \? payload\.popular : payload\.items/);
  assert.match(pageSource, /id="game-catalog"/);
  assert.match(pageSource, /onLaunch=\{launchGame\}/);
  assert.match(enhancementStyleSource, /\.game-lobby-hero\s*\{/);
});

test('changing filters resets pagination before requesting the new lobby slice', () => {
  assert.match(
    pageSource,
    /useEffect\(\(\) => \{ setPage\(1\); \}, \[category, provider, platform, debouncedQuery\]\)/,
  );
});
