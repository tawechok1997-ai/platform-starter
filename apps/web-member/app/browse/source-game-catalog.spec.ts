import assert from 'node:assert/strict';
import test from 'node:test';
import { catalogGroupsForSlug, mapCatalogGame } from './source-game-catalog';

test('maps category aliases to the central catalog groups', () => {
  assert.deepEqual(catalogGroupsForSlug('slot'), ['slot', 'arcade']);
  assert.deepEqual(catalogGroupsForSlug('fishing'), ['fishing', 'fish']);
  assert.deepEqual(catalogGroupsForSlug('card'), ['card', 'table']);
  assert.deepEqual(catalogGroupsForSlug('lotto'), ['lottery', 'lotto']);
});

test('maps recovered catalog metadata into source filters', () => {
  const game = mapCatalogGame({
    id: 'catalog:pc:jl:100',
    providerGameCode: '100',
    name: 'Buy Feature Table',
    category: 'slot',
    platform: 'desktop',
    imageUrl: 'https://cdn.example.test/game.png',
    provider: {
      code: 'jl.webp',
      name: 'JILI',
      logoUrl: 'https://cdn.example.test/jl.png',
    },
    metadata: {
      tags: ['เกมส์ฮิต', 'เกมส์ใหม่', 'เกมส์โต๊ะ', 'ซื้อฟรีสปิน'],
    },
  });

  assert.ok(game);
  assert.equal(game.provider, 'jl');
  assert.equal(game.id, '100');
  assert.equal(game.origin, 'catalog');
  assert.equal(game.platform, 'pc');
  assert.equal(game.isHot, true);
  assert.equal(game.isNew, true);
  assert.deepEqual(new Set(game.tags), new Set(['slot', 'buy', 'hot', 'new', 'table']));
});

test('does not manufacture game artwork from the provider card', () => {
  const game = mapCatalogGame(
    {
      providerGameCode: 'provider-only',
      name: 'Provider fallback',
      category: 'fishing',
      provider: { code: 'fishco', name: 'Fish Co' },
    },
    [{
      code: 'fishco',
      name: 'Fish Co',
      badge: '/fishco-badge.png',
      card: '/fishco-card.png',
      background: '/fishco-bg.png',
      title: '/fishco-title.png',
      avatar: '/fishco-avatar.png',
    }],
  );

  assert.equal(game, null);
});

test('skips provider artwork and uses the next distinct game image', () => {
  const game = mapCatalogGame(
    {
      providerGameCode: 'real-game',
      name: 'Real Game',
      category: 'slot',
      imageUrl: '/slotco-card.png',
      iconUrl: '/real-game.png',
      provider: { code: 'slotco', name: 'Slot Co' },
    },
    [{
      code: 'slotco',
      name: 'Slot Co',
      badge: '/slotco-badge.png',
      card: '/slotco-card.png',
      background: '/slotco-bg.png',
      title: '/slotco-title.png',
      avatar: '/slotco-avatar.png',
    }],
  );

  assert.ok(game);
  assert.equal(game.image, '/real-game.png');
  assert.equal(game.providerBadge, '/slotco-badge.png');
});

test('keeps the mobile catalog separate from the PC catalog', () => {
  const game = mapCatalogGame(
    {
      id: 'catalog:mobile:pg:mobile-100',
      providerGameCode: 'mobile-100',
      name: 'Mobile inventory game',
      category: 'slot',
      platform: 'mobile',
      imageUrl: 'https://cdn.example.test/mobile-game.png',
      provider: { code: 'pg', name: 'PG' },
    },
    [],
    'mobile',
  );

  assert.ok(game);
  assert.equal(game.platform, 'mobile');
  assert.equal(game.id, 'mobile-100');
});
