'use client';

import { useLayoutEffect } from 'react';

const ACTIVITY_ROUTE = '/mobile/member/activity';
const ACTIVITY_MENU_ITEM = '[data-source-member-menu-item="activity"]';

export default function MobileActivityStandaloneNavigation() {
  useLayoutEffect(() => {
    const openStandaloneActivity = (event: MouseEvent) => {
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

      const popupItem = target.closest<HTMLButtonElement>(ACTIVITY_MENU_ITEM);
      const anchor = target.closest<HTMLAnchorElement>('a[href]');
      const activityAnchor = anchor && isActivityRoute(anchor.href) ? anchor : null;
      if (!popupItem && !activityAnchor) return;

      event.preventDefault();
      event.stopImmediatePropagation();

      document.querySelector<HTMLButtonElement>(
        '[data-mobile-popup-owner="menu"] button[aria-label="ปิด"]',
      )?.click();
      document.querySelector<HTMLButtonElement>('[data-mobile-drawer-dismiss="true"]')?.click();

      window.location.assign(ACTIVITY_ROUTE);
    };

    // Register before passive inline-tab bridges so the Member menu opens the
    // dedicated Activity page while the Activity tab on Home stays a summary.
    window.addEventListener('click', openStandaloneActivity, true);
    return () => window.removeEventListener('click', openStandaloneActivity, true);
  }, []);

  return null;
}

function isActivityRoute(href: string) {
  try {
    const destination = new URL(href, window.location.href);
    return destination.origin === window.location.origin
      && (destination.pathname.replace(/\/+$/, '') || '/') === ACTIVITY_ROUTE;
  } catch {
    return false;
  }
}
