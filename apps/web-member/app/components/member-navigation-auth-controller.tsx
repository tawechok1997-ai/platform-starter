'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMemberRuntime } from '../member-runtime-provider';
import { useMemberSession } from '../member-session-provider';
import MemberAuthOverlay, { type MemberAuthMode } from './auth/member-auth-overlay';

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

type AuthRequest = {
  mode: MemberAuthMode;
  next?: string;
  scrollX: number;
  scrollY: number;
};

type AuthOpenDetail = {
  mode?: unknown;
  next?: unknown;
};

export default function MemberNavigationAuthController() {
  const router = useRouter();
  const { navigation, summary } = useMemberRuntime();
  const { verify } = useMemberSession();
  const [authRequest, setAuthRequest] = useState<AuthRequest | null>(null);

  const openAuth = useCallback((mode: MemberAuthMode, next?: string) => {
    setAuthRequest({
      mode,
      next: safeNextTarget(next),
      scrollX: window.scrollX,
      scrollY: window.scrollY,
    });
  }, []);

  const closeAuth = useCallback(() => {
    const current = authRequest;
    setAuthRequest(null);
    if (current) restoreScrollPosition(current.scrollX, current.scrollY);
  }, [authRequest]);

  const completeAuth = useCallback(async () => {
    if (!authRequest) return;
    const authenticated = await verify();
    if (!authenticated) return;

    const current = authRequest;
    setAuthRequest(null);

    if (current.next) {
      router.replace(current.next, { scroll: false });
      return;
    }

    restoreScrollPosition(current.scrollX, current.scrollY);
    router.refresh();
  }, [authRequest, router, verify]);

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
    if (!authRequest) return;

    let secondFrame = 0;
    const firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        window.scrollTo(authRequest.scrollX, authRequest.scrollY);
      });
    });

    return () => {
      window.cancelAnimationFrame(firstFrame);
      if (secondFrame) window.cancelAnimationFrame(secondFrame);
    };
  }, [authRequest]);

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
      // owned by MobileMemberPopupRuntime. It decides whether to open a popup or
      // enter a mobile member section. Competing capture listeners caused the
      // deposit/withdraw links and the remaining drawer actions to misfire.
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

  return authRequest ? (
    <MemberAuthOverlay
      mode={authRequest.mode}
      onClose={closeAuth}
      onSuccess={completeAuth}
    />
  ) : null;
}

function canonicalTargetFor(action: HTMLAnchorElement) {
  const href = normalize(action.getAttribute('href') ?? '');
  const hrefTarget = CANONICAL_HREF_TARGETS[href];
  if (hrefTarget) return hrefTarget;

  const label = action.textContent?.replace(/\s+/g, ' ').trim().toLowerCase() ?? '';
  return CANONICAL_LABEL_TARGETS[label] ?? '';
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

function restoreScrollPosition(scrollX: number, scrollY: number) {
  let secondFrame = 0;
  window.requestAnimationFrame(() => {
    secondFrame = window.requestAnimationFrame(() => {
      window.scrollTo(scrollX, scrollY);
    });
  });
  return () => {
    if (secondFrame) window.cancelAnimationFrame(secondFrame);
  };
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
