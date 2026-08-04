'use client';

import { useLayoutEffect } from 'react';

const RAIL_SELECTOR = '[data-mobile-section-owner="category-menu"]';
const HEADER_HEIGHT = 60;
const VIEWPORT_GAP = 8;

export default function MobileCategoryRailPinRuntime() {
  useLayoutEffect(() => {
    const rail = document.querySelector<HTMLElement>(RAIL_SELECTOR);
    const container = rail?.parentElement;
    if (!rail || !container) return;

    const railCssText = rail.style.cssText;
    const containerCssText = container.style.cssText;
    let frame = 0;
    let fixed = false;

    container.style.setProperty('overflow', 'visible', 'important');
    container.style.setProperty('align-items', 'stretch', 'important');

    const restoreNaturalRail = () => {
      rail.style.cssText = railCssText;
      rail.dataset.mobileCategoryFollow = 'start';
      fixed = false;
    };

    const applyFixedRail = (left: number, width: number) => {
      rail.style.setProperty('position', 'fixed', 'important');
      rail.style.setProperty('top', `${HEADER_HEIGHT}px`, 'important');
      rail.style.setProperty('right', 'auto', 'important');
      rail.style.setProperty('bottom', 'auto', 'important');
      rail.style.setProperty('left', `${left.toFixed(3)}px`, 'important');
      rail.style.setProperty('width', `${width}px`, 'important');
      rail.style.setProperty('align-self', 'start', 'important');
      rail.style.setProperty('max-height', `calc(100dvh - ${HEADER_HEIGHT + VIEWPORT_GAP}px)`, 'important');
      rail.style.setProperty('overflow-x', 'hidden', 'important');
      rail.style.setProperty('overflow-y', 'auto', 'important');
      rail.style.setProperty('overscroll-behavior', 'contain', 'important');
      rail.style.setProperty('scrollbar-width', 'none', 'important');
      rail.style.setProperty('transform', 'none', 'important');
      rail.style.setProperty('will-change', 'auto', 'important');
      rail.style.setProperty('z-index', '100', 'important');
      rail.dataset.mobileCategoryFollow = 'fixed';
      fixed = true;
    };

    const syncPosition = () => {
      frame = 0;
      if (!rail.isConnected || !container.isConnected) return;

      const containerRect = container.getBoundingClientRect();
      const shouldFix = containerRect.top <= HEADER_HEIGHT;

      if (!shouldFix) {
        if (fixed) restoreNaturalRail();
        return;
      }

      const width = rail.offsetWidth || 53;
      if (!Number.isFinite(containerRect.left)) return;
      applyFixedRail(containerRect.left, width);
    };

    const scheduleSync = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(syncPosition);
    };

    const resizeObserver = new ResizeObserver(scheduleSync);
    resizeObserver.observe(container);
    document.addEventListener('scroll', scheduleSync, true);
    window.addEventListener('resize', scheduleSync, { passive: true });
    window.visualViewport?.addEventListener('resize', scheduleSync, { passive: true });
    scheduleSync();

    return () => {
      resizeObserver.disconnect();
      document.removeEventListener('scroll', scheduleSync, true);
      window.removeEventListener('resize', scheduleSync);
      window.visualViewport?.removeEventListener('resize', scheduleSync);
      if (frame) window.cancelAnimationFrame(frame);
      rail.style.cssText = railCssText;
      container.style.cssText = containerCssText;
      rail.dataset.mobileCategoryFollow = 'start';
    };
  }, []);

  return null;
}
