'use client';

import { useEffect } from 'react';
import { useMemberRuntime } from '../member-runtime-provider';

const NAVIGATION_SELECTOR = [
  '.member-desktop-nav a[href]',
  '.member-mobile-runtime-navigation a[href]',
  '.member-bottom-nav a[href]',
].join(',');

export default function MemberNavigationAuthController() {
  const { navigation, summary } = useMemberRuntime();

  useEffect(() => {
    const protectedTargets = new Map(
      navigation
        .filter((item) => item.requiresAuth)
        .map((item) => [normalize(item.href), item.href]),
    );
    if (!protectedTargets.size || summary.isLoggedIn) return;

    const guard = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (!(event.target instanceof Element)) return;
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
