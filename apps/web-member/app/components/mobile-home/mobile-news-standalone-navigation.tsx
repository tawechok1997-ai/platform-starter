'use client';

import { useLayoutEffect } from 'react';

const NEWS_ROUTE = '/mobile/member/news';
const NEWS_MENU_ITEM = '[data-source-member-menu-item="news"]';

export default function MobileNewsStandaloneNavigation() {
  useLayoutEffect(() => {
    const openStandaloneNews = (event: MouseEvent) => {
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

      const popupItem = target.closest<HTMLButtonElement>(NEWS_MENU_ITEM);
      const anchor = target.closest<HTMLAnchorElement>('a[href]');
      const newsAnchor = anchor && isNewsRoute(anchor.href) ? anchor : null;
      if (!popupItem && !newsAnchor) return;

      event.preventDefault();
      event.stopImmediatePropagation();

      document.querySelector<HTMLButtonElement>(
        '[data-mobile-popup-owner="menu"] button[aria-label="ปิด"]',
      )?.click();
      document.querySelector<HTMLButtonElement>('[data-mobile-drawer-dismiss="true"]')?.click();

      window.location.assign(NEWS_ROUTE);
    };

    // Register before passive inline-tab bridges so the Member menu opens the
    // dedicated News page while the News tab on Home remains an inline summary.
    window.addEventListener('click', openStandaloneNews, true);
    return () => window.removeEventListener('click', openStandaloneNews, true);
  }, []);

  return null;
}

function isNewsRoute(href: string) {
  try {
    const destination = new URL(href, window.location.href);
    return destination.origin === window.location.origin
      && (destination.pathname.replace(/\/+$/, '') || '/') === NEWS_ROUTE;
  } catch {
    return false;
  }
}
