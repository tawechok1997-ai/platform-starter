'use client';

import { useRouter } from 'next/navigation';
import { useLayoutEffect } from 'react';

const MEMBER_CONTENT_ROUTES = {
  promotions: '/mobile/member/promotions',
  activity: '/mobile/member/activity',
  news: '/mobile/member/news',
} as const;

type MemberContentRouteKey = keyof typeof MEMBER_CONTENT_ROUTES;

const MENU_SELECTOR = '[data-source-member-menu-item]';
const HIGHLIGHT_TABS_SELECTOR = '[data-mobile-section-owner="highlight-tabs"]';

export default function MobileMemberStandaloneNavigation() {
  const router = useRouter();

  useLayoutEffect(() => {
    document.documentElement.dataset.mobileMemberContentNavigationOwner = 'standalone';

    const openStandaloneContent = (event: MouseEvent) => {
      if (
        event.defaultPrevented
        || event.button !== 0
        || event.metaKey
        || event.ctrlKey
        || event.shiftKey
        || event.altKey
      ) return;

      const target = event.target;
      if (!(target instanceof Element)) return;

      // The Home highlight tabs intentionally remain inline summaries. Only
      // member-menu items and actual route links open the dedicated pages.
      if (target.closest(HIGHLIGHT_TABS_SELECTOR)) return;

      const menuItem = target.closest<HTMLElement>(MENU_SELECTOR);
      const menuKey = menuItem?.dataset.sourceMemberMenuItem;
      const menuRoute = isMemberContentRouteKey(menuKey)
        ? MEMBER_CONTENT_ROUTES[menuKey]
        : null;

      const anchor = target.closest<HTMLAnchorElement>('a[href]');
      const anchorRoute = anchor && !anchor.download && (!anchor.target || anchor.target === '_self')
        ? routeFromAnchor(anchor)
        : null;
      const route = menuRoute ?? anchorRoute;
      if (!route) return;

      event.preventDefault();
      event.stopImmediatePropagation();

      closeMemberNavigationSurfaces();
      repairAbandonedPointerLock();
      router.push(route);
    };

    window.addEventListener('click', openStandaloneContent, true);
    return () => {
      window.removeEventListener('click', openStandaloneContent, true);
      delete document.documentElement.dataset.mobileMemberContentNavigationOwner;
    };
  }, [router]);

  return null;
}

function routeFromAnchor(anchor: HTMLAnchorElement) {
  try {
    const destination = new URL(anchor.href, window.location.href);
    if (destination.origin !== window.location.origin) return null;
    const pathname = destination.pathname.replace(/\/+$/, '') || '/';
    return Object.values(MEMBER_CONTENT_ROUTES).find((route) => route === pathname) ?? null;
  } catch {
    return null;
  }
}

function isMemberContentRouteKey(value: string | undefined): value is MemberContentRouteKey {
  return Boolean(value && value in MEMBER_CONTENT_ROUTES);
}

function closeMemberNavigationSurfaces() {
  document.querySelector<HTMLButtonElement>(
    '[data-mobile-popup-owner="menu"] button[aria-label="ปิด"]',
  )?.click();
  document.querySelector<HTMLButtonElement>('[data-mobile-drawer-dismiss="true"]')?.click();
}

function repairAbandonedPointerLock() {
  for (const element of [document.documentElement, document.body]) {
    if (element.style.pointerEvents === 'none') element.style.removeProperty('pointer-events');
    if (element.style.touchAction === 'none') element.style.removeProperty('touch-action');
  }
}
