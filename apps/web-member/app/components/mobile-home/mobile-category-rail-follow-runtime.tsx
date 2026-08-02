'use client';

import { useEffect } from 'react';

const MOBILE_ROOT_SELECTOR = '[data-mobile-home-root="true"]';
const CATEGORY_RAIL_SELECTOR = '[data-mobile-section-owner="category-menu"]';
const MOBILE_HEADER_HEIGHT = 60;

export default function MobileCategoryRailFollowRuntime() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(MOBILE_ROOT_SELECTOR);
    const rail = root?.querySelector<HTMLElement>(CATEGORY_RAIL_SELECTOR) ?? null;
    const content = rail?.parentElement ?? null;
    if (!root || !rail || !(content instanceof HTMLElement)) return;

    let animationFrame = 0;

    const resetRail = () => {
      rail.style.setProperty('--mobile-category-rail-offset', '0px');
      rail.dataset.mobileCategoryFollow = 'start';
    };

    const syncRail = () => {
      animationFrame = 0;

      const category = root.dataset.mobileActiveCategory;
      if (!category || category === 'home') {
        resetRail();
        return;
      }

      const rootRect = root.getBoundingClientRect();
      const contentRect = content.getBoundingClientRect();
      const contentTop = contentRect.top - rootRect.top + root.scrollTop;
      const contentHeight = Math.max(content.offsetHeight, content.scrollHeight);
      const maxOffset = Math.max(0, contentHeight - rail.offsetHeight);
      const requestedOffset = root.scrollTop + MOBILE_HEADER_HEIGHT - contentTop;
      const offset = Math.min(Math.max(0, requestedOffset), maxOffset);

      rail.style.setProperty('--mobile-category-rail-offset', `${Math.round(offset)}px`);
      rail.dataset.mobileCategoryFollow = offset <= 0
        ? 'start'
        : maxOffset > 0 && offset >= maxOffset
          ? 'end'
          : 'following';
    };

    const scheduleSync = () => {
      if (animationFrame !== 0) return;
      animationFrame = window.requestAnimationFrame(syncRail);
    };

    const categoryObserver = new MutationObserver(scheduleSync);
    categoryObserver.observe(root, {
      attributes: true,
      attributeFilter: ['data-mobile-active-category'],
    });

    const resizeObserver = typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver(scheduleSync);
    resizeObserver?.observe(root);
    resizeObserver?.observe(content);
    resizeObserver?.observe(rail);

    root.addEventListener('scroll', scheduleSync, { passive: true });
    document.addEventListener('scroll', scheduleSync, { capture: true, passive: true });
    window.addEventListener('resize', scheduleSync, { passive: true });
    scheduleSync();

    return () => {
      if (animationFrame !== 0) window.cancelAnimationFrame(animationFrame);
      root.removeEventListener('scroll', scheduleSync);
      document.removeEventListener('scroll', scheduleSync, true);
      window.removeEventListener('resize', scheduleSync);
      categoryObserver.disconnect();
      resizeObserver?.disconnect();
      rail.style.removeProperty('--mobile-category-rail-offset');
      delete rail.dataset.mobileCategoryFollow;
    };
  }, []);

  return null;
}
