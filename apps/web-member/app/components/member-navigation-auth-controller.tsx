'use client';

import { useEffect } from 'react';
import { useMemberRuntime } from '../member-runtime-provider';

const NAVIGATION_SELECTOR = [
  '.member-desktop-nav a[href]',
  '.member-mobile-runtime-navigation a[href]',
  '.member-bottom-nav a[href]',
  '#mobile-home-drawer a[href]',
].join(',');

const ACTION_SELECTOR = 'a[href], button';

const CANONICAL_LABEL_TARGETS: Readonly<Record<string, string>> = {
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
  'แนะนำการใช้งาน': '/guide',
  'คู่มือการใช้งาน': '/guide',
  'guide': '/guide',
};

const CANONICAL_HREF_TARGETS: Readonly<Record<string, string>> = {
  '/promotions': '/browse/promotions?view=promotion',
  '/mobile-menu/promotions': '/browse/promotions?view=promotion',
  '/mobile-menu/activities': '/browse/promotions?view=activity',
  '/mobile-menu/news': '/browse/promotions?view=news',
  '/mobile-menu/live': '/live',
  '/mobile-menu/guide': '/guide',
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

      const action = event.target.closest<HTMLElement>(ACTION_SELECTOR);
      if (action) {
        const canonicalTarget = canonicalTargetFor(action);
        if (canonicalTarget && normalizeCurrentLocation() !== normalize(canonicalTarget)) {
          event.preventDefault();
          event.stopPropagation();
          window.location.assign(canonicalTarget);
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
      window.location.assign(`/?auth=login&next=${encodeURIComponent(intended)}`);
    };

    document.addEventListener('click', guard, true);
    return () => document.removeEventListener('click', guard, true);
  }, [navigation, summary.isLoggedIn]);

  return null;
}

function canonicalTargetFor(action: HTMLElement) {
  const href = action instanceof HTMLAnchorElement
    ? normalize(action.getAttribute('href') ?? '')
    : '';
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
