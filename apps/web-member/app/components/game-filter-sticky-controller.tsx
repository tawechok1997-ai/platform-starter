'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const FILTER_SELECTOR = 'aside[aria-label^="ตัวกรอง"]';
const DESKTOP_QUERY = '(min-width: 901px)';
const STICKY_TOP_PX = 124;
const VIEWPORT_BOTTOM_GAP_PX = 20;

export default function GameFilterStickyController() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname?.startsWith('/browse')) return;

    const media = window.matchMedia(DESKTOP_QUERY);
    const originalStyles = new Map<HTMLElement, string | null>();
    let frame = 0;

    const remember = (element: HTMLElement | null) => {
      if (!element || originalStyles.has(element)) return;
      originalStyles.set(element, element.getAttribute('style'));
    };

    const restore = (element: HTMLElement) => {
      const original = originalStyles.get(element);
      if (original === undefined) return;
      if (original === null) element.removeAttribute('style');
      else element.setAttribute('style', original);
    };

    const restoreAll = () => {
      originalStyles.forEach((_style, element) => restore(element));
      originalStyles.clear();
    };

    const applyStickyFilters = () => {
      frame = 0;
      const filters = Array.from(document.querySelectorAll<HTMLElement>(FILTER_SELECTOR));

      if (!media.matches) {
        restoreAll();
        return;
      }

      filters.forEach((filter) => {
        const layout = filter.parentElement;
        const page = filter.closest<HTMLElement>('main');
        if (!layout || !page) return;

        remember(page);
        remember(layout);
        remember(filter);

        page.style.setProperty('overflow', 'visible', 'important');
        page.style.setProperty('overflow-x', 'visible', 'important');
        page.style.setProperty('overflow-y', 'visible', 'important');

        layout.style.setProperty('position', 'relative', 'important');
        layout.style.setProperty('align-items', 'start', 'important');
        layout.style.setProperty('overflow', 'visible', 'important');

        filter.style.setProperty('position', 'sticky', 'important');
        filter.style.setProperty('top', `${STICKY_TOP_PX}px`, 'important');
        filter.style.setProperty('align-self', 'start', 'important');
        filter.style.setProperty('height', 'fit-content', 'important');
        filter.style.setProperty('z-index', '12', 'important');
        filter.style.setProperty('overscroll-behavior', 'contain', 'important');

        const availableHeight = Math.max(
          320,
          window.innerHeight - STICKY_TOP_PX - VIEWPORT_BOTTOM_GAP_PX,
        );
        const needsInternalScroll = filter.scrollHeight > availableHeight;

        if (needsInternalScroll) {
          filter.style.setProperty('max-height', `${availableHeight}px`, 'important');
          filter.style.setProperty('overflow-x', 'hidden', 'important');
          filter.style.setProperty('overflow-y', 'auto', 'important');
          filter.style.setProperty('scrollbar-width', 'thin', 'important');
          filter.style.setProperty('scrollbar-gutter', 'stable', 'important');
        } else {
          filter.style.setProperty('max-height', 'none', 'important');
          filter.style.setProperty('overflow-x', 'hidden', 'important');
          filter.style.setProperty('overflow-y', 'visible', 'important');
          filter.style.removeProperty('scrollbar-width');
          filter.style.removeProperty('scrollbar-gutter');
        }
      });
    };

    const scheduleApply = () => {
      if (frame) window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(applyStickyFilters);
    };

    const observer = new MutationObserver(scheduleApply);
    observer.observe(document.body, { childList: true, subtree: true });

    window.addEventListener('resize', scheduleApply, { passive: true });
    media.addEventListener('change', scheduleApply);
    scheduleApply();

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', scheduleApply);
      media.removeEventListener('change', scheduleApply);
      if (frame) window.cancelAnimationFrame(frame);
      restoreAll();
    };
  }, [pathname]);

  return null;
}
