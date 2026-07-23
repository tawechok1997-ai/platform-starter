import assert from 'node:assert/strict';
import test from 'node:test';
import {
  cmsLifecyclePatch,
  isCmsPublished,
  normalizeContent,
  parseCmsContentJson,
  stringifyCmsContent,
} from './content-center-contract';

test('legacy enabled CMS records normalize to published and survive round trip', () => {
  const content = normalizeContent({
    banners: [{ title: 'Legacy', subtitle: '', imageUrl: '', href: '/games', enabled: true }],
    popup: { title: 'Popup', message: 'Hello', ctaLabel: 'Open', href: '/games', enabled: false },
    announcements: [{ title: 'News', message: 'Ready', enabled: true }],
    faqs: [{ question: 'Q', answer: 'A', enabled: true }],
  });

  assert.equal(content.banners[0]?.lifecycle, 'published');
  assert.equal(content.banners[0]?.enabled, true);
  assert.equal(content.popup.lifecycle, 'draft');
  assert.equal(content.popup.enabled, false);
  assert.equal(content.announcements[0]?.lifecycle, 'published');
  assert.equal(content.faqs[0]?.lifecycle, 'published');

  const roundTrip = normalizeContent(JSON.parse(stringifyCmsContent(content)));
  assert.equal(roundTrip.banners[0]?.lifecycle, 'published');
  assert.equal(roundTrip.banners[0]?.enabled, true);
});

test('archived CMS records are never member-visible', () => {
  const content = normalizeContent({
    banners: [{ title: 'Old', lifecycle: 'archived', enabled: true }],
    announcements: [{ title: 'Old news', message: 'Hidden', lifecycle: 'archived', enabled: true }],
    faqs: [],
  });

  assert.equal(content.banners[0]?.lifecycle, 'archived');
  assert.equal(content.banners[0]?.enabled, false);
  assert.equal(isCmsPublished(content.banners[0]!), false);
  assert.equal(content.announcements[0]?.enabled, false);
});

test('lifecycle patch publishes visibly and hides draft or archived records', () => {
  assert.deepEqual(cmsLifecyclePatch('published'), { lifecycle: 'published', enabled: true });
  assert.deepEqual(cmsLifecyclePatch('draft'), { lifecycle: 'draft', enabled: false });
  assert.deepEqual(cmsLifecyclePatch('archived'), { lifecycle: 'archived', enabled: false });
});

test('raw JSON parser rejects malformed input and normalizes valid input', () => {
  const invalid = parseCmsContentJson('{ broken');
  assert.equal(invalid.ok, false);

  const valid = parseCmsContentJson(JSON.stringify({
    banners: [{ title: 'Draft', lifecycle: 'draft', enabled: true }],
    popup: { title: 'Popup', message: '', lifecycle: 'archived', enabled: true },
    announcements: [],
    faqs: [],
  }));
  assert.equal(valid.ok, true);
  if (!valid.ok) return;
  assert.equal(valid.content.banners[0]?.enabled, false);
  assert.equal(valid.content.popup.enabled, false);
});
