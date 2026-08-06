'use client';

import { useLayoutEffect } from 'react';

const PROMOTION_ROUTE = '/mobile/member/promotions';
const PROMOTION_MENU_ITEM = '[data-source-member-menu-item="promotions"]';

export default function MobilePromotionStandaloneNavigation() {
  useLayoutEffect(() => {
    const openStandalonePromotions = (event: MouseEvent) => {
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

      const popupItem = target.closest<HTMLButtonElement>(PROMOTION_MENU_ITEM);
      const anchor = target.closest<HTMLAnchorElement>('a[href]');
      const promotionAnchor = anchor && isPromotionRoute(anchor.href) ? anchor : null;
      if (!popupItem && !promotionAnchor) return;

      event.preventDefault();
      event.stopImmediatePropagation();

      document.querySelector<HTMLButtonElement>(
        '[data-mobile-popup-owner="menu"] button[aria-label="ปิด"]',
      )?.click();
      document.querySelector<HTMLButtonElement>('[data-mobile-drawer-dismiss="true"]')?.click();

      window.location.assign(PROMOTION_ROUTE);
    };

    // This uses a layout effect so the dedicated page wins before older passive
    // inline-tab bridges register their click handlers.
    window.addEventListener('click', openStandalonePromotions, true);
    return () => window.removeEventListener('click', openStandalonePromotions, true);
  }, []);

  return null;
}

function isPromotionRoute(href: string) {
  try {
    const destination = new URL(href, window.location.href);
    return destination.origin === window.location.origin
      && (destination.pathname.replace(/\/+$/, '') || '/') === PROMOTION_ROUTE;
  } catch {
    return false;
  }
}
