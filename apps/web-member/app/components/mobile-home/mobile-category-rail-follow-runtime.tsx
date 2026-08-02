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

    const syncRail = () => {
      animationFrame = 0;

      const contentRect = content.getBoundingClientRect();
      const contentHeight = Math.max(content.offsetHeight, content.scrollHeight);
      const railHeight = rail.offsetHeight;
      const scaleY = contentHeight > 0 ? contentRect.height / contentHeight : 1;
      const maxOffset = Math.max(0, contentHeight - railHeight);
      const requestedOffset = scaleY > 0
        ? Math.max(0, MOBILE_HEADER_HEIGHT - contentRect.top) / scaleY
        : 0;
      const offset = Math.min(requestedOffset, maxOffset);
      const followState = offset <= 0
        ? 'start'
        : maxOffset > 0 && offset >= maxOffset
          ? 'end'
          : 'following';

      rail.style.transform = offset > 0
        ? `translate3d(0, ${Math.round(offset)}px, 0)`
        : 'none';
      rail.style.willChange = offset > 0 ? 'transform' : 'auto';
      rail.dataset.mobileCategoryFollow = followState;
    };

    const scheduleSync = () => {
      if (animationFrame !== 0) return;
      animationFrame = window.requestAnimationFrame(syncRail);
    };

    const mutationObserver = new MutationObserver(scheduleSync);
    mutationObserver.observe(root, {
      attributes: true,
      attributeFilter: ['data-mobile-active-category'],
      childList: true,
      subtree: true,
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
    window.visualViewport?.addEventListener('resize', scheduleSync, { passive: true });
    window.visualViewport?.addEventListener('scroll', scheduleSync, { passive: true });
    scheduleSync();

    return () => {
      if (animationFrame !== 0) window.cancelAnimationFrame(animationFrame);
      root.removeEventListener('scroll', scheduleSync);
      document.removeEventListener('scroll', scheduleSync, true);
      window.removeEventListener('resize', scheduleSync);
      window.visualViewport?.removeEventListener('resize', scheduleSync);
      window.visualViewport?.removeEventListener('scroll', scheduleSync);
      mutationObserver.disconnect();
      resizeObserver?.disconnect();
      rail.style.removeProperty('transform');
      rail.style.removeProperty('will-change');
      delete rail.dataset.mobileCategoryFollow;
    };
  }, []);

  return null;
}
