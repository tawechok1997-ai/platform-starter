'use client';

import { useEffect } from 'react';
import { useMemberRuntime } from '../member-runtime-provider';

const NAVIGATION_SELECTOR = [
  '.member-desktop-nav a[href]',
  '.member-mobile-runtime-navigation a[href]',
  '.member-bottom-nav a[href]',
  '#mobile-home-drawer a[href]',
].join(',');

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

function normalize(value: string) {
  try {
    const url = new URL(value, 'https://member.local');
    return `${url.pathname}${url.search}`;
  } catch {
    return value;
  }
}
