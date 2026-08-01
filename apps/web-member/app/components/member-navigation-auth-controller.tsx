'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMemberRuntime } from '../member-runtime-provider';

const MEMBER_AUTH_OPEN_EVENT = 'member:auth-open';
const NAVIGATION_SELECTOR = [
  '.member-desktop-nav a[href]',
  '.member-mobile-runtime-navigation a[href]',
  '.member-bottom-nav a[href]',
  '#mobile-home-drawer a[href]',
].join(',');

const CANONICAL_LABEL_TARGETS: Readonly<Record<string, string>> = {
  'ระดับสมาชิก vip': '/mobile-menu/vip',
  'vip': '/mobile-menu/vip',
  'รายได้คอมมิชชั่น': '/affiliate',
  'แนะนำเพื่อน': '/affiliate',
  'affiliate': '/affiliate',
  'คูปอง': '/bonus',
  'โบนัส': '/bonus',
  'โบนัสพิเศษ': '/bonus',
  'bonus': '/bonus',
  'โปรโมชั่น': '/browse/promotions?view=promotion',
  'โปรโมชั่นแนะนำ': '/browse/promotions?view=promotion',
  'promotion': '/browse/promotions?view=promotion',
  'promotions': '/browse/promotions?view=promotion',
  'กิจกรรม': '/browse/promotions?view=activity',
  'activity': '/browse/promotions?view=activity',
  'activities': '/browse/promotions?view=activity',
  'ข่าวสาร': '/browse/promotions?view=news',
  'news': '/browse/promotions?view=news',
  'ถ่ายทอดสด': '/live',
  'live': '/live',
  'ประวัติ': '/transactions',
  'ประวัติรายการ': '/transactions',
  'history': '/transactions',
  'transactions': '/transactions',
  'แจ้งเตือน': '/notifications',
  'notification': '/notifications',
  'notifications': '/notifications',
  'วีดีโอแนะนำ': '/mobile-menu/video',
  'วิดีโอแนะนำ': '/mobile-menu/video',
  'แนะนำการใช้งาน': '/guide',
  'คู่มือการใช้งาน': '/guide',
  'guide': '/guide',
  'สมัครสมาชิก': '/?auth=register',
  'register': '/?auth=register',
  'เข้าสู่ระบบ': '/?auth=login',
  'login': '/?auth=login',
  'ฝากเงิน': '/deposit',
  'deposit': '/deposit',
  'ถอนเงิน': '/withdraw',
  'withdraw': '/withdraw',
};

const CANONICAL_HREF_TARGETS: Readonly<Record<string, string>> = {
  '/login': '/?auth=login',
  '/login?embed=1': '/?auth=login',
  '/register': '/?auth=register',
  '/register?embed=1': '/?auth=register',
  '/?auth=login': '/?auth=login',
  '/?auth=register': '/?auth=register',
  '/promotions': '/browse/promotions?view=promotion',
  '/mobile-menu/promotions': '/browse/promotions?view=promotion',
  '/mobile-menu/activities': '/browse/promotions?view=activity',
  '/mobile-menu/news': '/browse/promotions?view=news',
  '/mobile-menu/live': '/live',
  '/?category=live': '/live',
  '/mobile-menu/guide': '/guide',
};

export default function MemberNavigationAuthController() {
  const router = useRouter();
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

      const anchor = event.target.closest<HTMLAnchorElement>('a[href]');
      if (anchor) {
        const canonicalTarget = canonicalTargetFor(anchor);
        const authMode = authModeForTarget(canonicalTarget);
        if (authMode) {
          event.preventDefault();
          event.stopPropagation();
          openAuthOverlay(authMode);
          return;
        }
      }

      const navigationLink = event.target.closest<HTMLAnchorElement>(NAVIGATION_SELECTOR);
      if (!navigationLink) return;

      const canonicalTarget = canonicalTargetFor(navigationLink);
      if (canonicalTarget && normalizeCurrentLocation() !== normalize(canonicalTarget)) {
        event.preventDefault();
        event.stopPropagation();
        router.replace(canonicalTarget, { scroll: false });
        return;
      }

      if (summary.isLoggedIn || !protectedTargets.size) return;
      const intended = protectedTargets.get(normalize(navigationLink.getAttribute('href') ?? ''));
      if (!intended) return;

      event.preventDefault();
      event.stopPropagation();
      openAuthOverlay('login', intended);
    };

    document.addEventListener('click', guard, true);
    return () => document.removeEventListener('click', guard, true);
  }, [navigation, router, summary.isLoggedIn]);

  return null;
}

function openAuthOverlay(mode: 'login' | 'register', next?: string) {
  window.dispatchEvent(new CustomEvent(MEMBER_AUTH_OPEN_EVENT, {
    detail: { mode, ...(next ? { next } : {}) },
  }));
}

function authModeForTarget(target: string) {
  const normalized = normalize(target);
  if (normalized === '/?auth=login') return 'login' as const;
  if (normalized === '/?auth=register') return 'register' as const;
  return null;
}

function canonicalTargetFor(action: HTMLAnchorElement) {
  const href = normalize(action.getAttribute('href') ?? '');
  const hrefTarget = CANONICAL_HREF_TARGETS[href];
  if (hrefTarget) return hrefTarget;

  const label = action.textContent?.replace(/\s+/g, ' ').trim().toLowerCase() ?? '';
  return CANONICAL_LABEL_TARGETS[label] ?? '';
}

function normalizeCurrentLocation() {
  return `${window.location.pathname}${window.location.search}`;
}

function normalize(value: string) {
  try {
    const url = new URL(value, 'https://member.local');
    return `${url.pathname}${url.search}`;
  } catch {
    return value;
  }
}
