'use client';

import { useLayoutEffect } from 'react';

const ROOT_SELECTOR = '[data-mobile-home-root="true"]';
const RAIL_SELECTOR = '[data-mobile-section-owner="category-menu"]';
const HEADER_OFFSET = 60;

export default function MobileCategoryRailTransformFollower() {
  useLayoutEffect(() => {
    const root = document.querySelector<HTMLElement>(ROOT_SELECTOR);
    const rail = root?.querySelector<HTMLElement>(RAIL_SELECTOR);
    const container = rail?.parentElement;
    if (!root || !rail || !(container instanceof HTMLElement)) return;

    let frame = 0;
    let lastOffset = -1;

    const paint = () => {
      frame = 0;
      const containerRect = container.getBoundingClientRect();
      const railHeight = rail.offsetHeight;
      const containerHeight = container.offsetHeight;
      const maximumOffset = Math.max(0, containerHeight - railHeight);
      const nextOffset = Math.min(
        maximumOffset,
        Math.max(0, HEADER_OFFSET - containerRect.top),
      );

      if (Math.abs(nextOffset - lastOffset) < 0.25) return;
      lastOffset = nextOffset;
      rail.style.setProperty('--mobile-category-follow-y', `${nextOffset.toFixed(2)}px`);
      rail.dataset.mobileCategoryFollow = nextOffset <= 0
        ? 'start'
        : nextOffset >= maximumOffset
          ? 'end'
          : 'following';
    };

    const schedule = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(paint);
    };

    const resizeObserver = typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver(schedule);
    resizeObserver?.observe(container);
    resizeObserver?.observe(rail);

    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    window.visualViewport?.addEventListener('resize', schedule, { passive: true });
    window.addEventListener('pageshow', schedule);
    schedule();

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      window.visualViewport?.removeEventListener('resize', schedule);
      window.removeEventListener('pageshow', schedule);
      rail.style.removeProperty('--mobile-category-follow-y');
      rail.dataset.mobileCategoryFollow = 'start';
    };
  }, []);

  return null;
}
