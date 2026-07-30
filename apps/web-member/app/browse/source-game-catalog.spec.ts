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
  assert.equal(game.isHot, true);
  assert.equal(game.isNew, true);
  assert.deepEqual(new Set(game.tags), new Set(['slot', 'buy', 'hot', 'new', 'table']));
});

test('falls back to the configured provider card when catalog media is absent', () => {
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

  assert.ok(game);
  assert.equal(game.image, '/fishco-card.png');
  assert.equal(game.providerBadge, '/fishco-badge.png');
});
