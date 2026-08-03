'use client';

import { useEffect, useLayoutEffect, useState } from 'react';

type MobileCategoryId = 'home' | 'casino' | 'slot' | 'fishing' | 'sport' | 'card' | 'lottery';

const MOBILE_CATEGORY_SELECT_EVENT = 'member:mobile-category-select';

export default function MobileCategoryTabRuntime() {
  const [activeCategory, setActiveCategory] = useState<MobileCategoryId>('home');

  useEffect(() => {
    const root = document.querySelector<HTMLElement>('[data-mobile-home-root="true"]');
    if (!root) return;

    const switchCategory = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const trigger = event.target.closest<HTMLElement>('[data-mobile-category-id]');
      if (!trigger || !root.contains(trigger)) return;

      const category = trigger.dataset.mobileCategoryId;
      if (!isMobileCategoryId(category)) return;

      // Observe the category click without consuming it. MobileHomeRoot owns the
      // visible active class, so its React onClick must receive the same event.
      setActiveCategory(category);
    };

    const selectCategory = (event: Event) => {
      const detail = event instanceof CustomEvent ? event.detail : null;
      const category = detail && typeof detail === 'object'
        ? (detail as { category?: string }).category
        : undefined;
      if (isMobileCategoryId(category)) setActiveCategory(category);
    };

    root.addEventListener('click', switchCategory, true);
    window.addEventListener(MOBILE_CATEGORY_SELECT_EVENT, selectCategory);
    return () => {
      root.removeEventListener('click', switchCategory, true);
      window.removeEventListener(MOBILE_CATEGORY_SELECT_EVENT, selectCategory);
    };
  }, []);

  useLayoutEffect(() => {
    const root = document.querySelector<HTMLElement>('[data-mobile-home-root="true"]');
    if (!root) return;

    root.dataset.mobileActiveCategory = activeCategory;
    root.querySelectorAll<HTMLElement>('[data-mobile-category-id]').forEach((item) => {
      const active = item.dataset.mobileCategoryId === activeCategory;
      item.setAttribute('aria-selected', active ? 'true' : 'false');
      if (active) item.setAttribute('aria-current', 'page');
      else item.removeAttribute('aria-current');
    });

    // Only the category content changes. Header, auth actions, announcement,
    // highlight tabs, shortcut and footer stay mounted to avoid document-height
    // collapse, scroll jumps and hydration flicker while switching categories.
    return () => {
      if (root.dataset.mobileActiveCategory === activeCategory) {
        delete root.dataset.mobileActiveCategory;
      }
    };
  }, [activeCategory]);

  return null;
}

function isMobileCategoryId(value: string | undefined): value is MobileCategoryId {
  return value === 'home'
    || value === 'casino'
    || value === 'slot'
    || value === 'fishing'
    || value === 'sport'
    || value === 'card'
    || value === 'lottery';
}
