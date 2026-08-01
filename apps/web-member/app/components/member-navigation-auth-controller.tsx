'use client';

import { useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMemberRuntime } from '../member-runtime-provider';
import type { MemberAuthMode } from './auth/member-auth-overlay';

const MEMBER_AUTH_OPEN_EVENT = 'member:auth-open';
const NAVIGATION_SELECTOR = [
  '.member-desktop-nav a[href]',
  '.member-mobile-runtime-navigation a[href]',
  '.member-bottom-nav a[href]',
  '#mobile-home-drawer a[href]',
].join(',');

const GUEST_LOGIN_REQUIRED_LABELS = new Set([
  'รายได้คอมมิชชั่น',
  'แนะนำเพื่อน',
  'คูปอง',
  'โบนัสพิเศษ',
  'ประวัติ',
  'ประวัติรายการ',
  'แจ้งเตือน',
  'commission',
  'refer a friend',
  'coupons',
  'special bonuses',
  'history',
  'transactions',
  'notification',
  'notifications',
]);

const GUEST_PUBLIC_MOBILE_TARGETS: Readonly<Record<string, string>> = {
  '/mobile/member/vip': '/mobile/member/vip',
  '/mobile/member/live': '/mobile/member/live',
  '/mobile/member/promotions': '/mobile/member/promotions',
  '/mobile/member/news': '/mobile/member/news',
  '/mobile/member/activity': '/mobile/member/activity',
  '/mobile/member/guide': '/mobile/member/guide',
};

const GUEST_PUBLIC_MOBILE_LABEL_TARGETS: Readonly<Record<string, string>> = {
  'ระดับสมาชิก vip': '/mobile/member/vip',
  'vip level': '/mobile/member/vip',
  vip: '/mobile/member/vip',
  'ถ่ายทอดสด': '/mobile/member/live',
  live: '/mobile/member/live',
  'โปรโมชั่น': '/mobile/member/promotions',
  promotions: '/mobile/member/promotions',
  promotion: '/mobile/member/promotions',
  'ข่าวสาร': '/mobile/member/news',
  news: '/mobile/member/news',
  'กิจกรรม': '/mobile/member/activity',
  activities: '/mobile/member/activity',
  activity: '/mobile/member/activity',
  'แนะนำการใช้งาน': '/mobile/member/guide',
  'คู่มือการใช้งาน': '/mobile/member/guide',
  'usage guide': '/mobile/member/guide',
  guide: '/mobile/member/guide',
};

const CANONICAL_LABEL_TARGETS: Readonly<Record<string, string>> = {
  'ระดับสมาชิก vip': '/mobile/member/vip',
  vip: '/mobile/member/vip',
  'รายได้คอมมิชชั่น': '/affiliate',
  'แนะนำเพื่อน': '/affiliate',
  affiliate: '/affiliate',
  'คูปอง': '/bonus',
  'โบนัส': '/bonus',
  'โบนัสพิเศษ': '/bonus',
  bonus: '/bonus',
  'โปรโมชั่น': '/mobile/member/promotions',
  'โปรโมชั่นแนะนำ': '/mobile/member/promotions',
  promotion: '/mobile/member/promotions',
  promotions: '/mobile/member/promotions',
  'กิจกรรม': '/mobile/member/activity',
  activity: '/mobile/member/activity',
  activities: '/mobile/member/activity',
  'ข่าวสาร': '/mobile/member/news',
  news: '/mobile/member/news',
  'ถ่ายทอดสด': '/mobile/member/live',
  live: '/mobile/member/live',
  'ประวัติ': '/transactions',
  'ประวัติรายการ': '/transactions',
  history: '/transactions',
  transactions: '/transactions',
  'แจ้งเตือน': '/notifications',
  notification: '/notifications',
  notifications: '/notifications',
  'วีดีโอแนะนำ': '/mobile-menu/video',
  'วิดีโอแนะนำ': '/mobile-menu/video',
  'แนะนำการใช้งาน': '/mobile/member/guide',
  'คู่มือการใช้งาน': '/mobile/member/guide',
  guide: '/mobile/member/guide',
  'สมัครสมาชิก': '/?auth=register',
  register: '/?auth=register',
  'เข้าสู่ระบบ': '/?auth=login',
  login: '/?auth=login',
  'ฝากเงิน': '/deposit',
  deposit: '/deposit',
  'ถอนเงิน': '/withdraw',
  withdraw: '/withdraw',
};

const CANONICAL_HREF_TARGETS: Readonly<Record<string, string>> = {
  '/login': '/?auth=login',
  '/login?embed=1': '/?auth=login',
  '/register': '/?auth=register',
  '/register?embed=1': '/?auth=register',
  '/?auth=login': '/?auth=login',
  '/?auth=register': '/?auth=register',
  '/promotions': '/mobile/member/promotions',
  '/mobile-menu/promotions': '/mobile/member/promotions',
  '/mobile-menu/activities': '/mobile/member/activity',
  '/mobile/member/activity': '/mobile/member/activity',
  '/mobile-menu/news': '/mobile/member/news',
  '/mobile-menu/live': '/mobile/member/live',
  '/?category=live': '/mobile/member/live',
  '/mobile-menu/guide': '/mobile/member/guide',
  '/mobile/member/vip': '/mobile/member/vip',
  '/mobile/member/live': '/mobile/member/live',
  '/mobile/member/promotions': '/mobile/member/promotions',
  '/mobile/member/news': '/mobile/member/news',
  '/mobile/member/guide': '/mobile/member/guide',
};

type AuthOpenDetail = {
  mode?: unknown;
  next?: unknown;
};

export default function MemberNavigationAuthController() {
  const router = useRouter();
  const { navigation, summary } = useMemberRuntime();

  const openAuth = useCallback((mode: MemberAuthMode, next?: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('auth', mode);

    const safeNext = safeNextTarget(next);
    if (safeNext) url.searchParams.set('next', safeNext);
    else url.searchParams.delete('next');

    // MemberChrome is the sole pre-login overlay owner. This controller only
    // updates the canonical request state and never mounts a second dialog.
    router.replace(`${url.pathname}${url.search}${url.hash}`, { scroll: false });
  }, [router]);

  useEffect(() => {
    const handleAuthOpen = (event: Event) => {
      const detail = (event as CustomEvent<AuthOpenDetail>).detail;
      if (!detail || (detail.mode !== 'login' && detail.mode !== 'register')) return;
      openAuth(detail.mode, typeof detail.next === 'string' ? detail.next : undefined);
    };

    window.addEventListener(MEMBER_AUTH_OPEN_EVENT, handleAuthOpen);
    return () => window.removeEventListener(MEMBER_AUTH_OPEN_EVENT, handleAuthOpen);
  }, [openAuth]);

  useEffect(() => {
    const protectedTargets = new Map(
      navigation
        .filter((item) => item.requiresAuth)
        .map((item) => [normalize(item.href), item.href]),
    );

    const guard = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (!(event.target instanceof Element)) return;

      const authAction = event.target.closest<HTMLAnchorElement>('a[href]');

      // These six drawer rows own real public pages before login. Resolve them
      // before runtime navigation metadata can misclassify the same href as
      // protected and open the auth popup over a page that already exists.
      const guestPublicTarget = authAction
        && !summary.isLoggedIn
        && authAction.closest('#mobile-home-drawer')
        ? guestPublicMobileTargetFor(authAction)
        : '';
      if (guestPublicTarget) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        router.replace(guestPublicTarget, { scroll: false });
        return;
      }

      // These guest drawer rows are member-only even when their source markup
      // points at a popup or a public-looking fallback route. Capture them before
      // React closes the drawer so the single auth overlay opens over the drawer.
      if (authAction && !summary.isLoggedIn && requiresGuestLogin(authAction)) {
        const rawHref = normalize(authAction.getAttribute('href') ?? '');
        const intended = canonicalTargetFor(authAction) || rawHref;
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        openAuth('login', intended);
        return;
      }

      if (authAction && !authAction.closest('[data-mobile-member-popup]')) {
        const rawHref = normalize(authAction.getAttribute('href') ?? '');
        const canonicalTarget = canonicalTargetFor(authAction) || rawHref;
        const authMode = authModeForTarget(canonicalTarget);

        if (authMode) {
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
          openAuth(authMode, nextTargetFor(rawHref));
          return;
        }
      }

      const navigationLink = event.target.closest<HTMLAnchorElement>(NAVIGATION_SELECTOR);
      if (!navigationLink) return;

      // Popup actions are owned by their popup runtime. Never let the global
      // navigation controller turn them back into page navigation.
      if (navigationLink.closest('[data-mobile-member-popup]')) return;

      // Once the authenticated mobile drawer is mounted, every drawer action is
      // owned by MobileMemberPopupRuntime. This file only owns pre-login guards.
      const mobileRoot = navigationLink.closest<HTMLElement>('[data-mobile-home-root="true"]');
      const insideMobileDrawer = Boolean(navigationLink.closest('#mobile-home-drawer'));
      if (summary.isLoggedIn && mobileRoot?.dataset.mobileAuthenticated === 'true' && insideMobileDrawer) return;

      const href = normalize(navigationLink.getAttribute('href') ?? '');

      if (!summary.isLoggedIn && protectedTargets.size) {
        const intended = protectedTargets.get(href);
        if (intended) {
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
          openAuth('login', intended);
          return;
        }
      }

      const canonicalTarget = canonicalTargetFor(navigationLink);
      if (canonicalTarget && normalizeCurrentLocation() !== normalize(canonicalTarget)) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        router.replace(canonicalTarget, { scroll: false });
      }
    };

    document.addEventListener('click', guard, true);
    return () => document.removeEventListener('click', guard, true);
  }, [navigation, openAuth, router, summary.isLoggedIn]);

  return null;
}

function guestPublicMobileTargetFor(action: HTMLAnchorElement) {
  const href = normalize(action.getAttribute('href') ?? '');
  return GUEST_PUBLIC_MOBILE_TARGETS[href]
    ?? GUEST_PUBLIC_MOBILE_LABEL_TARGETS[actionLabel(action)]
    ?? '';
}

function requiresGuestLogin(action: HTMLAnchorElement) {
  return GUEST_LOGIN_REQUIRED_LABELS.has(actionLabel(action));
}

function canonicalTargetFor(action: HTMLAnchorElement) {
  const href = normalize(action.getAttribute('href') ?? '');
  const hrefTarget = CANONICAL_HREF_TARGETS[href];
  if (hrefTarget) return hrefTarget;

  return CANONICAL_LABEL_TARGETS[actionLabel(action)] ?? '';
}

function actionLabel(action: HTMLAnchorElement) {
  return action.textContent?.replace(/\s+/g, ' ').trim().toLowerCase() ?? '';
}

function authModeForTarget(value: string): MemberAuthMode | null {
  try {
    const url = new URL(value, 'https://member.local');
    const auth = url.searchParams.get('auth');
    if (auth === 'login' || auth === 'register') return auth;
    if (url.pathname === '/login') return 'login';
    if (url.pathname === '/register') return 'register';
  } catch {
    return null;
  }
  return null;
}

function nextTargetFor(value: string) {
  try {
    return safeNextTarget(new URL(value, 'https://member.local').searchParams.get('next'));
  } catch {
    return undefined;
  }
}

function safeNextTarget(value?: string | null) {
  const next = String(value ?? '').trim();
  return next.startsWith('/') && !next.startsWith('//') ? next : undefined;
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
