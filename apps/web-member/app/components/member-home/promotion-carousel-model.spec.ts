import assert from 'node:assert/strict';
import test from 'node:test';
import type { CmsContent } from '../../site-settings';
import { buildHomePromotionItems, dedupePromotionItems, normalizeCarouselIndex } from './promotion-carousel-model';

const emptyContent: CmsContent = {
  assets: [],
  banners: [],
  popup: { title: '', message: '', ctaLabel: '', href: '', enabled: false },
  announcements: [],
  faqs: [],
};

test('normalizes carousel indexes in both directions', () => {
  assert.equal(normalizeCarouselIndex(5, 4), 1);
  assert.equal(normalizeCarouselIndex(-1, 4), 3);
  assert.equal(normalizeCarouselIndex(Number.NaN, 4), 0);
  assert.equal(normalizeCarouselIndex(2, 0), 0);
});

test('carousel stays empty until Admin enables CMS banners', () => {
  assert.deepEqual(buildHomePromotionItems(emptyContent), []);
});

test('uses enabled CMS banners and accepts only safe internal links', () => {
  const content: CmsContent = {
    ...emptyContent,
    banners: [
      { title: 'Safe', subtitle: '', imageUrl: 'https://cdn.example.com/safe.jpg', href: '/promotions/safe', enabled: true },
      { title: 'Unsafe', subtitle: '', imageUrl: 'https://cdn.example.com/unsafe.jpg', href: 'https://evil.example', enabled: true },
      { title: 'Disabled', subtitle: '', imageUrl: 'https://cdn.example.com/off.jpg', href: '/off', enabled: false },
    ],
  };

  const items = buildHomePromotionItems(content);
  assert.equal(items.length, 2);
  assert.equal(items[0]?.href, '/promotions/safe');
  assert.equal(items[1]?.href, '/promotions');
});

test('removes duplicate images case-insensitively', () => {
  const result = dedupePromotionItems([
    { id: 'a', title: 'A', imageUrl: '/A.JPG' },
    { id: 'b', title: 'B', imageUrl: '/a.jpg' },
  ]);
  assert.equal(result.length, 1);
  assert.equal(result[0]?.id, 'a');
});
