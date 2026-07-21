import assert from 'node:assert/strict';
import test from 'node:test';
import type { CmsContent } from '../../site-settings';
import { buildHomeAnnouncements, cleanAnnouncementText } from './home-announcement-model';

function content(announcements: CmsContent['announcements']): CmsContent {
  return { assets: [], banners: [], popup: { title: '', message: '', ctaLabel: '', href: '/', enabled: false }, announcements, faqs: [] };
}

test('filters disabled, empty, and duplicate announcements', () => {
  const items = buildHomeAnnouncements(content([
    { title: ' แจ้งเตือน ', message: ' ระบบพร้อม ', enabled: true },
    { title: 'แจ้งเตือน', message: 'ระบบพร้อม', enabled: true },
    { title: '', message: '', enabled: true },
    { title: 'ไม่แสดง', message: 'ปิดอยู่', enabled: false },
  ]));
  assert.equal(items.length, 1);
  assert.equal(items[0]?.title, 'แจ้งเตือน');
  assert.equal(items[0]?.message, 'ระบบพร้อม');
});

test('uses a stable fallback when CMS has no usable announcement', () => {
  const items = buildHomeAnnouncements(content([]));
  assert.equal(items.length, 1);
  assert.equal(items[0]?.id, 'system-ready');
});

test('sanitizes control characters and angle brackets and caps length', () => {
  assert.equal(cleanAnnouncementText('<script>\u0000 test', 10), 'script tes');
});
