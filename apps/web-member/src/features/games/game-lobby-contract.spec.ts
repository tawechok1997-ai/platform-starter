import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const pageSource = readFileSync(new URL('../../../app/games/page.tsx', import.meta.url), 'utf8');
const styleSource = readFileSync(new URL('../../../app/games/games.css', import.meta.url), 'utf8');

test('game lobby exposes platform, provider, category and search controls', () => {
  assert.match(pageSource, /ทุกแพลตฟอร์ม/);
  assert.match(pageSource, /ทุกค่าย/);
  assert.match(pageSource, /ค้นหาเกมหรือค่าย/);
  assert.match(pageSource, /game-lobby-tabs/);
  assert.doesNotMatch(styleSource, /game-lobby-tabs[^}]*display:\s*none/i);
  assert.doesNotMatch(styleSource, /game-lobby-toolbar[^}]*display:\s*none/i);
});

test('game lobby keeps explicit desktop, tablet and mobile grid contracts', () => {
  assert.match(styleSource, /grid-template-columns:\s*repeat\(4,minmax\(0,1fr\)\)/);
  assert.match(styleSource, /@media\s*\(max-width:\s*900px\)[\s\S]*repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(styleSource, /@media\s*\(max-width:\s*640px\)[\s\S]*repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(styleSource, /@media\s*\(max-width:\s*360px\)[\s\S]*grid-template-columns:\s*1fr/);
});

test('game lobby includes retry, incremental loading and broken-image fallback', () => {
  assert.match(pageSource, /ลองใหม่/);
  assert.match(pageSource, /โหลดเพิ่มอีก/);
  assert.match(pageSource, /onError=/);
  assert.match(pageSource, /game-lobby-fallback/);
});
