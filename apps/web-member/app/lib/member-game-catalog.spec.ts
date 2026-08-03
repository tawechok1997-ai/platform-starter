import assert from 'node:assert/strict';
import test from 'node:test';
import {
  collectMemberGameTags,
  isPlaceholderMemberCatalogGame,
  mapMemberCatalogGame,
} from './member-game-catalog-model';

test('maps every catalog icon and preserves searchable tags', () => {
  const item = {
    id: 'catalog:mobile:pg:100',
    providerGameCode: '100',
    name: 'Buy Feature Table',
    category: 'slot',
    platform: 'mobile',
    imageUrl: 'https://cdn.example.test/provider-simulator/icons/game.svg',
    provider: {
      code: 'pg',
      name: 'PG Soft',
      logoUrl: 'https://cdn.example.test/providers/pg.png',
    },
    tags: ['Popular', 'ซื้อฟรีสปิน'],
    metadata: { tags: ['โต๊ะ', 'เกมใหม่'] },
    isPopular: true,
    isNew: true,
  };

  const game = mapMemberCatalogGame(item, 'mobile');

  assert.ok(game);
  assert.equal(game.platform, 'mobile');
  assert.equal(game.provider, 'pg');
  assert.equal(game.providerGameCode, '100');
  assert.ok(game.image);
  assert.ok(game.providerIcon);
  assert.deepEqual(
    new Set(game.tags),
    new Set(['slot', 'popular', 'ซื้อฟรีสปิน', 'buy', 'โต๊ะ', 'table', 'เกมใหม่', 'new', 'hot']),
  );
});

test('derives category and filter tags from Thai and English metadata', () => {
  const tags = collectMemberGameTags({
    id: 'fish-1',
    name: 'Fishing Arcade Free Spin',
    category: 'fish',
    tags: ['เกมส์อาเขต', 'HOT'],
    metadata: { tags: ['free spin', 'ใหม่'] },
  });

  assert.deepEqual(
    new Set(tags),
    new Set(['fishing', 'เกมส์อาเขต', 'arcade', 'hot', 'free spin', 'buy', 'ใหม่', 'new']),
  );
});

test('keeps PC and mobile icon inventories separated', () => {
  const source = {
    id: 'same-id',
    providerGameCode: 'same-id',
    name: 'Platform game',
    category: 'slot',
    imageUrl: 'https://cdn.example.test/game.png',
    provider: { code: 'jl', name: 'JL' },
  };

  const pc = mapMemberCatalogGame({ ...source, platform: 'desktop' }, 'pc');
  const mobile = mapMemberCatalogGame({ ...source, platform: 'mobile' }, 'mobile');

  assert.ok(pc);
  assert.ok(mobile);
  assert.equal(pc.platform, 'pc');
  assert.equal(mobile.platform, 'mobile');
});

test('rejects demo and simulator rows before they reach home game selection', () => {
  const rows = [
    {
      id: 'catalog:pc:demo:fortune-slot',
      providerGameCode: 'demo-fortune-slot',
      name: 'Demo Fortune Slot',
      category: 'slot',
      imageUrl: 'https://cdn.example.test/demo-fortune-slot.png',
      provider: { code: 'demo', name: 'DEMO' },
    },
    {
      id: 'catalog:pc:simulator:live-table',
      providerGameCode: 'live-table',
      name: 'Live Table',
      category: 'casino',
      imageUrl: 'https://cdn.example.test/live-table.png',
      provider: { code: 'simulator', name: 'SIMULATOR' },
    },
  ] as const;

  for (const row of rows) {
    assert.equal(isPlaceholderMemberCatalogGame(row), true);
    assert.equal(mapMemberCatalogGame(row, 'pc'), null);
  }
});

test('does not reject a real game merely because an artwork path mentions simulator', () => {
  const item = {
    id: 'catalog:pc:pg:demolition-squad',
    providerGameCode: 'demolition-squad',
    name: 'Demolition Squad',
    category: 'slot',
    imageUrl: 'https://cdn.example.test/provider-simulator/demolition-squad.png',
    provider: { code: 'pg', name: 'PG Soft' },
  };

  assert.equal(isPlaceholderMemberCatalogGame(item), false);
  assert.ok(mapMemberCatalogGame(item, 'pc'));
});
