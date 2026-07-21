import assert from 'node:assert/strict';
import test from 'node:test';
import type { CmsContent } from '../../site-settings';
import { buildHomePromotionItems, dedupePromotionItems, normalizeCarouselIndex } from './promotion-carousel-model';

test('normalizes carousel indexes in both directions', () => {
  assert.equal(normalizeCarouselIndex(5, 4), 1);
  assert.equal(normalizeCarouselIndex(-1, 4), 3);
  assert.equal(normalizeCarouselIndex(Number.NaN, 4), 0);
  assert.equal(normalizeCarouselIndex(2, 0), 0);
});

test('keeps reference banners and accepts only safe internal cms links', () => {
  const content: CmsContent = {
    assets: [],
    banners: [
      { title: 'Safe', subtitle: '', imageUrl: 'https://cdn.example.com/safe.jpg', href: '/promotions/safe', enabled: true },
      { title: 'Unsafe', subtitle: '', imageUrl: 'https://cdn.example.com/unsafe.jpg', href: 'https://evil.example', enabled: true },
      { title: 'Disabled', subtitle: '', imageUrl: 'https://cdn.example.com/off.jpg', href: '/off', enabled: false },
    ],
    popup: { title: '', message: '', ctaLabel: '', href: '', enabled: false },
    announcements: [],
    faqs: [],
  };

  const items = buildHomePromotionItems(content);
  assert.equal(items.length, 6);
  assert.equal(items[4]?.href, '/promotions/safe');
  assert.equal(items[5]?.href, '/promotions');
});

test('removes duplicate images case-insensitively', () => {
  const result = dedupePromotionItems([
    { id: 'a', title: 'A', imageUrl: '/A.JPG' },
    { id: 'b', title: 'B', imageUrl: '/a.jpg' },
  ]);
  assert.equal(result.length, 1);
  assert.equal(result[0]?.id, 'a');
});
