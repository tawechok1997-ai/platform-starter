'use client';

import { useEffect } from 'react';
import { useMemberRuntime } from '../member-runtime-provider';

const NAVIGATION_SELECTOR = [
  '.member-desktop-nav a[href]',
  '.member-mobile-runtime-navigation a[href]',
  '.member-bottom-nav a[href]',
].join(',');

const MOBILE_DRAWER_SELECTOR = '#mobile-home-drawer a[href], #mobile-home-drawer button';

const MOBILE_REFERENCE_TARGETS: Readonly<Record<string, string>> = {
  'ระดับสมาชิก VIP': '/mobile-menu/vip',
  'ถ่ายทอดสด': '/mobile-menu/live',
  'โปรโมชั่น': '/mobile-menu/promotions',
  'ข่าวสาร': '/mobile-menu/news',
  'กิจกรรม': '/mobile-menu/activities',
  'วีดีโอแนะนำ': '/mobile-menu/video',
  'แนะนำการใช้งาน': '/mobile-menu/guide',
  'เปลี่ยนภาษา': '/mobile-menu/language',
};

const MOBILE_LOGIN_TARGETS: Readonly<Record<string, string>> = {
  'รายได้คอมมิชชั่น': '/affiliate',
  'แนะนำเพื่อน': '/affiliate',
  'คูปอง': '/bonus',
  'โบนัสพิเศษ': '/bonus',
  'ประวัติ': '/transactions',
  'แจ้งเตือน': '/notifications',
};

export default function MemberNavigationAuthController() {
  const { navigation, summary } = useMemberRuntime();

  useEffect(() => {
    const protectedTargets = new Map(
      navigation
        .filter((item) => item.requiresAuth)
        .map((item) => [normalize(item.href), item.href]),
    );

    const guard = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (!(event.target instanceof Element)) return;

      const drawerTarget = event.target.closest<HTMLElement>(MOBILE_DRAWER_SELECTOR);
      if (drawerTarget) {
        const label = drawerTarget.textContent?.replace(/\s+/g, ' ').trim() ?? '';
        const referenceTarget = MOBILE_REFERENCE_TARGETS[label];
        if (referenceTarget) {
          event.preventDefault();
          event.stopPropagation();
          window.location.assign(referenceTarget);
          return;
        }

        const loginTarget = MOBILE_LOGIN_TARGETS[label];
        if (loginTarget && !summary.isLoggedIn) {
          event.preventDefault();
          event.stopPropagation();
          window.location.assign(`/?auth=login&next=${encodeURIComponent(loginTarget)}`);
          return;
        }
      }

      if (summary.isLoggedIn || !protectedTargets.size) return;
      const link = event.target.closest<HTMLAnchorElement>(NAVIGATION_SELECTOR);
      if (!link) return;
      const intended = protectedTargets.get(normalize(link.getAttribute('href') ?? ''));
      if (!intended) return;
      event.preventDefault();
      event.stopPropagation();
      const next = encodeURIComponent(intended);
      window.location.assign(`/?auth=login&next=${next}`);
    };

    document.addEventListener('click', guard, true);
    return () => document.removeEventListener('click', guard, true);
  }, [navigation, summary.isLoggedIn]);

  return null;
}

function normalize(value: string) {
  try {
    const url = new URL(value, 'https://member.local');
    return `${url.pathname}${url.search}`;
  } catch {
    return value;
  }
}
