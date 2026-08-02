'use client';

import { useEffect } from 'react';

const MOBILE_ROOT_SELECTOR = '[data-mobile-home-root="true"]';
const CATEGORY_RAIL_SELECTOR = '[data-mobile-section-owner="category-menu"]';
const MOBILE_HEADER_HEIGHT = 60;
const VIEWPORT_BOTTOM_GAP = 8;
const OWNED_STYLE_PROPERTIES = [
  'position',
  'top',
  'right',
  'bottom',
  'left',
  'width',
  'max-height',
  'transform',
  'will-change',
] as const;

type FollowState = 'start' | 'fixed' | 'end';

export default function MobileCategoryRailFollowRuntime() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(MOBILE_ROOT_SELECTOR);
    const rail = root?.querySelector<HTMLElement>(CATEGORY_RAIL_SELECTOR) ?? null;
    const content = rail?.parentElement ?? null;
    if (!root || !rail || !(content instanceof HTMLElement)) return;

    const mobileQuery = window.matchMedia('(max-width: 900px)');
    let animationFrame = 0;
    let settleTimer = 0;
    let naturalWidth = Math.max(1, rail.offsetWidth);
    let lastState: FollowState | '' = '';

    const setImportant = (property: string, value: string) => {
      rail.style.setProperty(property, value, 'important');
    };

    const setState = (state: FollowState) => {
      if (state !== lastState) {
        rail.dataset.mobileCategoryFollow = state;
        lastState = state;
      }
    };

    const applyStart = () => {
      setImportant('position', 'relative');
      setImportant('top', '0');
      setImportant('right', 'auto');
      setImportant('bottom', 'auto');
      setImportant('left', '0');
      setImportant('width', `${naturalWidth}px`);
      setImportant('max-height', 'calc(100dvh - 68px)');
      setImportant('transform', 'none');
      setImportant('will-change', 'auto');
      setState('start');
    };

    const applyFixed = (contentLeft: number) => {
      setImportant('position', 'fixed');
      setImportant('top', `${MOBILE_HEADER_HEIGHT}px`);
      setImportant('right', 'auto');
      setImportant('bottom', 'auto');
      setImportant('left', `${Math.round(contentLeft)}px`);
      setImportant('width', `${naturalWidth}px`);
      setImportant('max-height', 'calc(100dvh - 68px)');
      setImportant('transform', 'none');
      setImportant('will-change', 'left, top');
      setState('fixed');
    };

    const applyEnd = () => {
      setImportant('position', 'absolute');
      setImportant('top', 'auto');
      setImportant('right', 'auto');
      setImportant('bottom', '0');
      setImportant('left', '0');
      setImportant('width', `${naturalWidth}px`);
      setImportant('max-height', 'calc(100dvh - 68px)');
      setImportant('transform', 'none');
      setImportant('will-change', 'auto');
      setState('end');
    };

    const clearOwnedStyles = () => {
      OWNED_STYLE_PROPERTIES.forEach((property) => rail.style.removeProperty(property));
      delete rail.dataset.mobileCategoryFollow;
      lastState = '';
    };

    const syncRail = () => {
      animationFrame = 0;

      if (!mobileQuery.matches || !root.isConnected || !rail.isConnected || !content.isConnected) {
        clearOwnedStyles();
        return;
      }

      if (lastState === '' || lastState === 'start') {
        naturalWidth = Math.max(1, rail.offsetWidth || naturalWidth);
      }

      const contentRect = content.getBoundingClientRect();
      const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
      const availableHeight = Math.max(0, viewportHeight - MOBILE_HEADER_HEIGHT - VIEWPORT_BOTTOM_GAP);
      const railHeight = Math.min(
        Math.max(rail.scrollHeight, rail.offsetHeight),
        availableHeight || Number.POSITIVE_INFINITY,
      );
      const stopEdge = MOBILE_HEADER_HEIGHT + railHeight;

      if (contentRect.top > MOBILE_HEADER_HEIGHT) {
        applyStart();
        return;
      }

      if (contentRect.bottom <= stopEdge) {
        applyEnd();
        return;
      }

      applyFixed(contentRect.left);
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
    window.addEventListener('scroll', scheduleSync, { passive: true });
    window.addEventListener('resize', scheduleSync, { passive: true });
    window.visualViewport?.addEventListener('resize', scheduleSync, { passive: true });
    window.visualViewport?.addEventListener('scroll', scheduleSync, { passive: true });

    scheduleSync();
    settleTimer = window.setTimeout(scheduleSync, 250);

    return () => {
      if (animationFrame !== 0) window.cancelAnimationFrame(animationFrame);
      window.clearTimeout(settleTimer);
      root.removeEventListener('scroll', scheduleSync);
      document.removeEventListener('scroll', scheduleSync, true);
      window.removeEventListener('scroll', scheduleSync);
      window.removeEventListener('resize', scheduleSync);
      window.visualViewport?.removeEventListener('resize', scheduleSync);
      window.visualViewport?.removeEventListener('scroll', scheduleSync);
      mutationObserver.disconnect();
      resizeObserver?.disconnect();
      clearOwnedStyles();
    };
  }, []);

  return null;
}
