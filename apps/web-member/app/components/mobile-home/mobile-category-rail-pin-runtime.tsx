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

    container.style.setProperty('overflow', 'visible', 'important');
    container.style.setProperty('align-items', 'stretch', 'important');

    rail.style.setProperty('position', 'sticky', 'important');
    rail.style.setProperty('top', `${HEADER_HEIGHT}px`, 'important');
    rail.style.setProperty('align-self', 'start', 'important');
    rail.style.setProperty('max-height', `calc(100dvh - ${HEADER_HEIGHT + VIEWPORT_GAP}px)`, 'important');
    rail.style.setProperty('overflow-x', 'hidden', 'important');
    rail.style.setProperty('overflow-y', 'auto', 'important');
    rail.style.setProperty('overscroll-behavior', 'contain', 'important');
    rail.style.setProperty('scrollbar-width', 'none', 'important');
    rail.style.setProperty('transform', 'none', 'important');
    rail.style.setProperty('will-change', 'auto', 'important');
    rail.style.setProperty('z-index', '100', 'important');
    rail.dataset.mobileCategoryFollow = 'pinned';

    return () => {
      rail.style.cssText = railCssText;
      container.style.cssText = containerCssText;
      rail.dataset.mobileCategoryFollow = 'start';
    };
  }, []);

  return null;
}
