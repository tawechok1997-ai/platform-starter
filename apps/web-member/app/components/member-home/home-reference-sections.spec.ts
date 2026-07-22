import assert from 'node:assert/strict';
import test from 'node:test';
import type { CmsContent } from '../../site-settings';
import { buildCompetitionShowcase, normalizeLeaderboard } from './home-competition-model';
import { buildHomePromotionCards, dedupeCards } from './home-promotion-model';

const emptyContent: CmsContent = {
  assets: [],
  banners: [],
  popup: { title: '', message: '', ctaLabel: '', href: '', enabled: false },
  announcements: [],
  faqs: [],
};

test('promotion cards stay empty until Admin enables CMS banners', () => {
  const cards = buildHomePromotionCards(emptyContent);
  assert.deepEqual(cards, []);
});

test('promotion cards reject unsafe hrefs and duplicate images', () => {
  const content: CmsContent = {
    ...emptyContent,
    banners: [
      { title: 'A', subtitle: '', imageUrl: 'https://cdn.example/a.jpg', href: 'https://evil.example', enabled: true },
      { title: 'B', subtitle: '', imageUrl: 'https://cdn.example/a.jpg', href: '/promotions', enabled: true },
      { title: 'C', subtitle: '', imageUrl: '', href: '/promotions', enabled: true },
    ],
  };
  const cards = buildHomePromotionCards(content);
  assert.equal(cards.filter((card) => card.imageUrl === 'https://cdn.example/a.jpg').length, 1);
  assert.equal(cards[0]?.href, '/promotions');
});

test('dedupeCards removes duplicate and invalid entries', () => {
  const cards = dedupeCards([
    { id: '1', title: 'A', subtitle: '', imageUrl: '/a.jpg', href: '/promotions', badge: '' },
    { id: '2', title: 'B', subtitle: '', imageUrl: '/A.JPG', href: '/promotions', badge: '' },
    { id: '', title: 'C', subtitle: '', imageUrl: '/c.jpg', href: '/promotions', badge: '' },
  ]);
  assert.equal(cards.length, 1);
});

test('competition showcase falls back for invalid values', () => {
  const showcase = buildCompetitionShowcase({
    jackpotLabel: '<script>alert(1)</script>',
    heroImageUrl: 'javascript:alert(1)',
    leaderboard: [{ rank: 1, user: 'member@example.com', score: 10 }],
  });
  assert.equal(showcase.jackpotLabel, '฿ 1,000,000.00');
  assert.ok(showcase.heroImageUrl.startsWith('/images/'));
  assert.equal(showcase.leaderboard[0]?.user, 'meXXXmber');
});

test('leaderboard sorts unique valid ranks and falls back when empty', () => {
  const rows = normalizeLeaderboard([
    { rank: 3, user: 'PLAYER0003', score: 3 },
    { rank: 1, user: 'PLAYER0001', score: 10 },
    { rank: 1, user: 'DUPLICATE', score: 99 },
    { rank: 0, user: 'INVALID', score: 0 },
  ]);
  assert.deepEqual(rows.map((row) => row.rank), [1, 3]);
  assert.equal(normalizeLeaderboard(null).length, 3);
});
