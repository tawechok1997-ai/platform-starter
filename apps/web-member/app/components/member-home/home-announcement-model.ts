import type { CmsContent } from '../../site-settings';

export type HomeAnnouncementItem = {
  id: string;
  title: string;
  message: string;
};

const FALLBACK_ANNOUNCEMENT: HomeAnnouncementItem = {
  id: 'system-ready',
  title: 'ระบบพร้อมให้บริการ',
  message: 'ฝาก ถอน และเกมเปิดให้บริการตามปกติ',
};

export function buildHomeAnnouncements(content: CmsContent): HomeAnnouncementItem[] {
  const source = Array.isArray(content?.announcements) ? content.announcements : [];
  const seen = new Set<string>();
  const items = source.flatMap((item, index) => {
    if (!item?.enabled) return [];
    const title = cleanAnnouncementText(item.title, 80);
    const message = cleanAnnouncementText(item.message, 180);
    if (!title && !message) return [];
    const key = `${title}\u0000${message}`.toLocaleLowerCase('th-TH');
    if (seen.has(key)) return [];
    seen.add(key);
    return [{ id: `announcement-${index + 1}`, title: title || 'ประกาศ', message }];
  });

  return items.length ? items.slice(0, 6) : [FALLBACK_ANNOUNCEMENT];
}

export function cleanAnnouncementText(value: unknown, maxLength: number) {
  if (typeof value !== 'string') return '';
  const withoutControls = Array.from(value, (character) => {
    const code = character.charCodeAt(0);
    return code <= 31 || code === 127 ? ' ' : character;
  }).join('');

  return withoutControls
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, Math.max(0, maxLength));
}
