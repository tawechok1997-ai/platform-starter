'use client';

import { useEffect } from 'react';

type MobileCategoryId = 'home' | 'casino' | 'slot' | 'fishing' | 'sport' | 'card' | 'lottery';

const MOBILE_CATEGORY_SELECT_EVENT = 'member:mobile-category-select';
const MOBILE_CATEGORY_IDS = new Set<MobileCategoryId>([
  'home',
  'casino',
  'slot',
  'fishing',
  'sport',
  'card',
  'lottery',
]);

export default function MobileCategoryFooterGuard() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>('[data-mobile-home-root="true"]');
    if (!root) return;

    let animationFrame = 0;

    const applyVisibility = (requestedCategory?: unknown) => {
      const activeCategory = isMobileCategoryId(requestedCategory)
        ? requestedCategory
        : readActiveCategory(root);
      const bottomStructure = root.querySelector<HTMLElement>('[data-mobile-bottom-owner="true"]');
      if (!bottomStructure) return;

      const footer = bottomStructure.querySelector<HTMLElement>(
        ':scope > [data-mobile-section-owner="footer"]',
      );
      const homeOnlySections = bottomStructure.querySelectorAll<HTMLElement>(
        ':scope > [data-mobile-section-owner]:not([data-mobile-section-owner="footer"])',
      );

      forceVisible(bottomStructure);
      homeOnlySections.forEach((section) => {
        setElementHidden(section, activeCategory !== 'home');
      });

      if (footer) {
        footer.dataset.mobilePersistentFooter = 'true';
        forceVisible(footer);
      }
    };

    const scheduleVisibility = (category?: unknown) => {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(() => applyVisibility(category));
    };

    const selectFromClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const trigger = event.target.closest<HTMLElement>('[data-mobile-category-id]');
      if (!trigger || !root.contains(trigger)) return;
      scheduleVisibility(trigger.dataset.mobileCategoryId);
    };

    const selectFromEvent = (event: Event) => {
      const detail = event instanceof CustomEvent ? event.detail : null;
      const category = detail && typeof detail === 'object'
        ? (detail as { category?: unknown }).category
        : undefined;
      scheduleVisibility(category);
    };

    const observer = new MutationObserver(() => scheduleVisibility());
    observer.observe(root, {
      attributes: true,
      attributeFilter: ['data-mobile-active-category'],
    });

    root.addEventListener('click', selectFromClick, true);
    window.addEventListener(MOBILE_CATEGORY_SELECT_EVENT, selectFromEvent);
    applyVisibility();

    return () => {
      window.cancelAnimationFrame(animationFrame);
      observer.disconnect();
      root.removeEventListener('click', selectFromClick, true);
      window.removeEventListener(MOBILE_CATEGORY_SELECT_EVENT, selectFromEvent);
      applyVisibility('home');

      const footer = root.querySelector<HTMLElement>(
        '[data-mobile-bottom-owner="true"] > [data-mobile-section-owner="footer"]',
      );
      footer?.removeAttribute('data-mobile-persistent-footer');
    };
  }, []);

  return null;
}

function readActiveCategory(root: HTMLElement): MobileCategoryId {
  const value = root.dataset.mobileActiveCategory;
  return isMobileCategoryId(value) ? value : 'home';
}

function forceVisible(element: HTMLElement) {
  setElementHidden(element, false);
}

function setElementHidden(element: HTMLElement, hidden: boolean) {
  element.hidden = hidden;

  if (hidden) {
    element.setAttribute('aria-hidden', 'true');
    element.style.setProperty('display', 'none', 'important');
    return;
  }

  element.removeAttribute('aria-hidden');
  element.style.removeProperty('display');
}

function isMobileCategoryId(value: unknown): value is MobileCategoryId {
  return typeof value === 'string' && MOBILE_CATEGORY_IDS.has(value as MobileCategoryId);
}
