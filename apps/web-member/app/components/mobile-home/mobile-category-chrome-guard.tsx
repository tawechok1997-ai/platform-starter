'use client';

import { useEffect } from 'react';

const CATEGORY_IDS = new Set(['home', 'casino', 'slot', 'fishing', 'sport', 'card', 'lottery']);
const TOP_CHROME_SELECTOR = [
  '[data-mobile-section-owner="header"]',
  '[data-mobile-section-owner="hero"]',
  '[data-mobile-section-owner="auth-actions"]',
  '[data-mobile-section-owner="announcement"]',
  '[data-mobile-section-owner="highlight-tabs"]',
].join(', ');

export default function MobileCategoryChromeGuard() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>('[data-mobile-home-root="true"]');
    if (!root) return;

    const restoreTopChrome = () => {
      root.querySelectorAll<HTMLElement>(TOP_CHROME_SELECTOR).forEach((section) => {
        section.hidden = false;
        section.removeAttribute('aria-hidden');
        section.style.removeProperty('display');
        section.style.removeProperty('visibility');
        section.style.removeProperty('opacity');
      });
    };

    const selectCategory = (category: string) => {
      if (!CATEGORY_IDS.has(category)) return;
      restoreTopChrome();
      root.dataset.mobileActiveCategory = category;
      window.dispatchEvent(new CustomEvent('member:mobile-category-select', {
        detail: { category },
      }));
    };

    const handleClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const button = target.closest<HTMLElement>('[data-mobile-category-id]');
      const category = button?.dataset.mobileCategoryId;
      if (!category || !CATEGORY_IDS.has(category)) return;
      window.requestAnimationFrame(() => selectCategory(category));
    };

    const handleCategoryEvent = () => restoreTopChrome();
    const handlePopState = () => {
      const category = new URLSearchParams(window.location.search).get('category') || 'home';
      window.requestAnimationFrame(() => selectCategory(CATEGORY_IDS.has(category) ? category : 'home'));
    };

    restoreTopChrome();
    root.addEventListener('click', handleClick);
    window.addEventListener('member:mobile-category-select', handleCategoryEvent);
    window.addEventListener('popstate', handlePopState);

    return () => {
      root.removeEventListener('click', handleClick);
      window.removeEventListener('member:mobile-category-select', handleCategoryEvent);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  return null;
}
