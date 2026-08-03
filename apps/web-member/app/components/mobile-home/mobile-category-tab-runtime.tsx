'use client';

import { useEffect, useLayoutEffect, useState } from 'react';

type MobileCategoryId = 'home' | 'casino' | 'slot' | 'fishing' | 'sport' | 'card' | 'lottery';

const MOBILE_CATEGORY_SELECT_EVENT = 'member:mobile-category-select';
const TOP_CHROME_SELECTOR = [
  '[data-mobile-section-owner="header"]',
  '[data-mobile-section-owner="hero"]',
  '[data-mobile-section-owner="auth-actions"]',
  '[data-mobile-section-owner="announcement"]',
  '[data-mobile-section-owner="highlight-tabs"]',
].join(', ');

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

      releaseStalePageLock(root);
      setActiveCategory(category);
      window.dispatchEvent(new CustomEvent(MOBILE_CATEGORY_SELECT_EVENT, {
        detail: { category },
      }));
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

    restoreTopChrome(root);

    const frame = activeCategory === 'home'
      ? 0
      : window.requestAnimationFrame(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
        document.scrollingElement?.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      });

    // Only the category content changes. Header, hero, auth actions,
    // announcement and highlight tabs remain mounted for every game category.
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      if (root.dataset.mobileActiveCategory === activeCategory) {
        delete root.dataset.mobileActiveCategory;
      }
    };
  }, [activeCategory]);

  return null;
}

function restoreTopChrome(root: HTMLElement) {
  root.querySelectorAll<HTMLElement>(TOP_CHROME_SELECTOR).forEach((section) => {
    section.hidden = false;
    section.removeAttribute('aria-hidden');
    section.style.removeProperty('display');
    section.style.removeProperty('visibility');
    section.style.removeProperty('opacity');
  });
}

function releaseStalePageLock(root: HTMLElement) {
  const drawerOpen = root.querySelector('[aria-controls="mobile-home-drawer"][aria-expanded="true"]');
  const modalOpen = document.querySelector('[role="dialog"][aria-modal="true"]');
  if (drawerOpen || modalOpen) return;

  document.body.style.removeProperty('overflow');
  document.body.style.removeProperty('overflow-y');
  document.body.style.removeProperty('touch-action');
  document.documentElement.style.removeProperty('overflow');
  document.documentElement.style.removeProperty('overflow-y');
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
