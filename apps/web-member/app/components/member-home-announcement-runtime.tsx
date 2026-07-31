'use client';

import { useLayoutEffect, useMemo } from 'react';
import { memberAnnouncementsRuntime } from '../member-settings-runtime';
import { cmsContentSetting, type CmsAnnouncement } from '../site-settings';
import { useSiteSettings } from '../site-settings-provider';

const DEFAULT_ANNOUNCEMENT = 'ยินดีต้อนรับสู่ NOAH345 โปรโมชั่น กิจกรรม และเกมใหม่อัปเดตตลอด 24 ชั่วโมง';

type AnnouncementTarget = {
  selector: string;
  text: string;
  id: string;
  href: string;
};

export default function MemberHomeAnnouncementRuntime() {
  const { settings } = useSiteSettings();
  const targets = useMemo<AnnouncementTarget[]>(() => {
    const content = cmsContentSetting(settings);
    const desktop = pickGlobalAnnouncement(memberAnnouncementsRuntime(content, 'desktop'));
    const mobile = pickGlobalAnnouncement(memberAnnouncementsRuntime(content, 'mobile')) ?? desktop;

    return [
      announcementTarget('.reference-announcement-track span', desktop),
      announcementTarget('.v47-mobile-announcement > span', mobile),
    ];
  }, [settings]);

  useLayoutEffect(() => {
    let frame = 0;

    const sync = () => {
      for (const target of targets) {
        document.querySelectorAll<HTMLElement>(target.selector).forEach((element) => {
          if (element.textContent !== target.text) element.textContent = target.text;
          element.dataset.announcementId = target.id;
          if (target.href) element.dataset.announcementHref = target.href;
          else delete element.dataset.announcementHref;
        });
      }
    };

    const scheduleSync = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        sync();
      });
    };

    sync();
    const observer = new MutationObserver(scheduleSync);
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('resize', scheduleSync);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', scheduleSync);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [targets]);

  return null;
}

function pickGlobalAnnouncement(items: CmsAnnouncement[]) {
  return items.find((item) => item.kind === 'system') ?? items[0];
}

function announcementTarget(selector: string, announcement: CmsAnnouncement | undefined): AnnouncementTarget {
  return {
    selector,
    text: firstText(announcement?.message, announcement?.title, DEFAULT_ANNOUNCEMENT),
    id: announcement?.id || 'global-home-announcement-fallback',
    href: safeHref(announcement?.href),
  };
}

function safeHref(value: unknown) {
  if (typeof value !== 'string') return '';
  const href = value.trim();
  if (href.startsWith('/') || /^https?:\/\//i.test(href)) return href;
  return '';
}

function firstText(...values: unknown[]) {
  return values.find((value): value is string => typeof value === 'string' && Boolean(value.trim()))?.trim() ?? '';
}
