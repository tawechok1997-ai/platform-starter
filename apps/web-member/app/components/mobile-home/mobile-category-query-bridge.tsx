'use client';

import { useEffect } from 'react';

type MobileCategoryId = 'home' | 'casino' | 'slot' | 'fishing' | 'sport' | 'card' | 'lottery';

const MOBILE_CATEGORY_IDS = new Set<MobileCategoryId>([
  'home',
  'casino',
  'slot',
  'fishing',
  'sport',
  'card',
  'lottery',
]);

export default function MobileCategoryQueryBridge() {
  useEffect(() => {
    let frame = 0;
    let attempts = 0;

    const applyCategoryFromLocation = () => {
      const category = normalizeCategory(new URLSearchParams(window.location.search).get('category')) ?? 'home';

      const activate = () => {
        const button = document.querySelector<HTMLButtonElement>(
          `[data-mobile-category-id="${category}"]`,
        );
        if (button) {
          button.click();
          if (category !== 'home') button.focus({ preventScroll: true });
          return;
        }

        attempts += 1;
        if (attempts < 120) frame = window.requestAnimationFrame(activate);
      };

      attempts = 0;
      if (frame) window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(activate);
    };

    const keepCategoryInHomeUrl = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const button = target.closest<HTMLButtonElement>('[data-mobile-category-id]');
      if (!button) return;

      const category = normalizeCategory(button.dataset.mobileCategoryId ?? null);
      if (!category) return;

      const current = normalizeCategory(new URLSearchParams(window.location.search).get('category')) ?? 'home';
      if (current === category) return;

      const next = new URL(window.location.href);
      if (category === 'home') next.searchParams.delete('category');
      else next.searchParams.set('category', category);
      next.hash = '';
      window.history.pushState({}, '', `${next.pathname}${next.search}`);
    };

    applyCategoryFromLocation();
    window.addEventListener('popstate', applyCategoryFromLocation);
    window.addEventListener('click', keepCategoryInHomeUrl, true);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('popstate', applyCategoryFromLocation);
      window.removeEventListener('click', keepCategoryInHomeUrl, true);
    };
  }, []);

  return null;
}

function normalizeCategory(value: string | null): MobileCategoryId | null {
  if (value === 'lotto') return 'lottery';
  return value && MOBILE_CATEGORY_IDS.has(value as MobileCategoryId)
    ? value as MobileCategoryId
    : null;
}
