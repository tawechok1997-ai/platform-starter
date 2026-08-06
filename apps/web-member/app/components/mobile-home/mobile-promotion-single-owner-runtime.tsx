'use client';

import { useEffect } from 'react';

const PROMOTION_ROUTE = '/mobile/member/promotions';
const PROMOTION_TAB_ID = 'mobile-highlight-tab-1';
const HIGHLIGHT_TAB_IDS = new Set([
  'mobile-highlight-tab-0',
  'mobile-highlight-tab-1',
  'mobile-highlight-tab-2',
  'mobile-highlight-tab-3',
]);

export default function MobilePromotionSingleOwnerRuntime() {
  useEffect(() => {
    let activationFrame = 0;
    let dedupeFrame = 0;

    const activatePromotionFromLocation = () => {
      const tab = new URLSearchParams(window.location.search).get('tab');
      if (tab !== 'promotions') return;

      let attempts = 0;
      const activate = () => {
        const button = document.getElementById(PROMOTION_TAB_ID);
        if (button instanceof HTMLButtonElement) {
          button.click();
          return;
        }
        attempts += 1;
        if (attempts < 120) activationFrame = window.requestAnimationFrame(activate);
      };

      if (activationFrame) window.cancelAnimationFrame(activationFrame);
      activationFrame = window.requestAnimationFrame(activate);
    };

    const updatePromotionUrl = (active: boolean, mode: 'push' | 'replace' = 'push') => {
      const next = new URL(window.location.href);
      next.searchParams.delete('category');
      if (active) next.searchParams.set('tab', 'promotions');
      else next.searchParams.delete('tab');
      next.hash = '';
      const target = `${next.pathname}${next.search}`;
      if (`${window.location.pathname}${window.location.search}` === target) return;
      window.history[mode === 'replace' ? 'replaceState' : 'pushState']({}, '', target);
    };

    const keepPromotionInsideHome = (event: MouseEvent) => {
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
      if (!document.querySelector('[data-mobile-home-root="true"]')) return;

      const anchor = target.closest<HTMLAnchorElement>('a[href]');
      if (!anchor || anchor.download || (anchor.target && anchor.target !== '_self')) return;
      const destination = new URL(anchor.href, window.location.href);
      if (destination.origin !== window.location.origin) return;
      if ((destination.pathname.replace(/\/+$/, '') || '/') !== PROMOTION_ROUTE) return;

      const button = document.getElementById(PROMOTION_TAB_ID);
      if (!(button instanceof HTMLButtonElement)) return;

      event.preventDefault();
      updatePromotionUrl(true);
      button.click();
      button.focus({ preventScroll: true });
    };

    const keepTabUrlInSync = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const button = target.closest<HTMLButtonElement>('button[id^="mobile-highlight-tab-"]');
      if (!button || !HIGHLIGHT_TAB_IDS.has(button.id)) return;
      updatePromotionUrl(button.id === PROMOTION_TAB_ID);
    };

    const dedupePromotionCards = () => {
      const panel = document.querySelector<HTMLElement>('[data-mobile-highlight-panel="promotions"]');
      if (!panel) return;

      const seen = new Set<string>();
      panel.querySelectorAll<HTMLElement>('a[aria-label]').forEach((card) => {
        const label = normalizeText(card.getAttribute('aria-label') ?? '');
        const image = card.querySelector<HTMLImageElement>('img');
        const imageKey = normalizeAsset(image?.currentSrc || image?.getAttribute('src') || '');
        const key = imageKey || label;
        const duplicate = Boolean(key) && seen.has(key);

        if (key) seen.add(key);
        card.hidden = duplicate;
        if (duplicate) {
          card.dataset.duplicatePromotion = 'true';
          card.setAttribute('aria-hidden', 'true');
        } else {
          delete card.dataset.duplicatePromotion;
          card.removeAttribute('aria-hidden');
        }
      });
    };

    const scheduleDedupe = () => {
      if (dedupeFrame) window.cancelAnimationFrame(dedupeFrame);
      dedupeFrame = window.requestAnimationFrame(dedupePromotionCards);
    };

    const observer = new MutationObserver(scheduleDedupe);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['src'] });

    activatePromotionFromLocation();
    scheduleDedupe();
    window.addEventListener('popstate', activatePromotionFromLocation);
    window.addEventListener('click', keepPromotionInsideHome, true);
    window.addEventListener('click', keepTabUrlInSync, true);

    return () => {
      if (activationFrame) window.cancelAnimationFrame(activationFrame);
      if (dedupeFrame) window.cancelAnimationFrame(dedupeFrame);
      observer.disconnect();
      window.removeEventListener('popstate', activatePromotionFromLocation);
      window.removeEventListener('click', keepPromotionInsideHome, true);
      window.removeEventListener('click', keepTabUrlInSync, true);
    };
  }, []);

  return null;
}

function normalizeAsset(value: string) {
  if (!value) return '';
  try {
    const url = new URL(value, window.location.origin);
    return decodeURIComponent(url.pathname).replace(/\/+$/, '').toLowerCase();
  } catch {
    return value.split(/[?#]/, 1)[0].trim().toLowerCase();
  }
}

function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}
