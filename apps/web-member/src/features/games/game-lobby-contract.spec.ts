import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const pageSource = readFileSync(new URL('../../../app/games/page.tsx', import.meta.url), 'utf8');
const styleSource = readFileSync(new URL('../../../app/games/games.css', import.meta.url), 'utf8');
const enhancementStyleSource = readFileSync(new URL('../../../app/games/lobby-enhancements.css', import.meta.url), 'utf8');

test('game lobby exposes platform, provider, category and search controls', () => {
  assert.match(pageSource, /aria-label="เลือกแพลตฟอร์มเกม"/);
  assert.match(pageSource, />ทั้งหมด <span>/);
  assert.match(pageSource, /ทุกค่าย/);
  assert.match(pageSource, /ค้นหาเกมหรือค่าย/);
  assert.match(pageSource, /game-lobby-tabs/);
  assert.doesNotMatch(styleSource, /game-lobby-tabs[^}]*display:\s*none/i);
  assert.doesNotMatch(styleSource, /game-lobby-toolbar[^}]*display:\s*none/i);
});

test('game lobby keeps explicit desktop and responsive grid contracts', () => {
  assert.match(styleSource, /grid-template-columns:\s*repeat\(4,minmax\(0,1fr\)\)/);
  assert.match(styleSource, /@media\s*\(max-width:\s*900px\)[\s\S]*?repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(styleSource, /@media\s*\(max-width:\s*640px\)[\s\S]*?repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(styleSource, /@media\s*\(max-width:\s*360px\)[\s\S]*?grid-template-columns:\s*1fr/);
});

test('game lobby includes retry, incremental loading and broken-image fallback', () => {
  assert.match(pageSource, /ลองใหม่/);
  assert.match(pageSource, /โหลดเพิ่มอีก/);
  assert.match(pageSource, /onError=/);
  assert.match(pageSource, /game-lobby-fallback/);
});

test('provider selector preserves logo, fallback and accessible selection contracts', () => {
  assert.match(pageSource, /function ProviderStrip/);
  assert.match(pageSource, /function ProviderButton/);
  assert.match(pageSource, /className="game-provider-strip"/);
  assert.match(pageSource, /className="game-provider-strip-list"/);
  assert.match(pageSource, /aria-label="เลือกค่ายเกม"/);
  assert.match(pageSource, /aria-pressed=\{active\}/);
  assert.match(pageSource, /item\.logoUrl && !failed/);
  assert.match(pageSource, /onError=\{\(\) => setFailed\(true\)\}/);
  assert.match(pageSource, /initials\(item\.name\)/);
  assert.match(pageSource, /logoUrl:\s*typeof item\.logoUrl === 'string'/);
  assert.match(styleSource, /\.game-provider-strip-list\s*\{[\s\S]*?overflow-x:\s*auto/);
});

test('provider and lobby loading states use stable skeleton contracts', () => {
  assert.match(pageSource, /loading \? Array\.from\(\{ length: 7 \}/);
  assert.match(pageSource, /function LobbySkeleton/);
  assert.match(pageSource, /function GameCardSkeleton/);
  assert.match(pageSource, /aria-busy="true"/);
  assert.match(styleSource, /@keyframes\s+gameLobbyShimmer/);
  assert.match(styleSource, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
});

test('hero, stats and promotion shortcuts remain wired to lobby behavior', () => {
  assert.match(pageSource, /function LobbyHero/);
  assert.match(pageSource, /function LobbyStats/);
  assert.match(pageSource, /function PromotionStrip/);
  assert.match(pageSource, /id="game-catalog"/);
  assert.match(pageSource, /scrollIntoView\(\{ behavior: 'smooth' \}\)/);
  assert.match(enhancementStyleSource, /\.game-lobby-hero\s*\{/);
  assert.match(enhancementStyleSource, /\.game-lobby-stats\s*\{/);
  assert.match(enhancementStyleSource, /\.game-promotion-strip\s*\{/);
});

test('changing provider resets category before requesting the new lobby slice', () => {
  assert.match(
    pageSource,
    /<ProviderStrip[\s\S]*setProvider\(code\);\s*setCategory\('all'\);/,
  );
});
