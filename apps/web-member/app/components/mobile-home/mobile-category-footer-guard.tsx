'use client';

import { useEffect } from 'react';

const MOBILE_CATEGORY_SELECT_EVENT = 'member:mobile-category-select';
const PERSISTENT_BOTTOM_SECTION_SELECTOR = [
  ':scope > [data-mobile-section-owner="shortcut"]',
  ':scope > [data-mobile-section-owner="footer"]',
].join(',');

export default function MobileCategoryFooterGuard() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>('[data-mobile-home-root="true"]');
    if (!root) return;

    let animationFrame = 0;

    const applyVisibility = () => {
      const bottomStructure = root.querySelector<HTMLElement>('[data-mobile-bottom-owner="true"]');
      if (!bottomStructure) return;

      forceVisible(bottomStructure);
      bottomStructure.dataset.mobilePersistentBottom = 'true';

      bottomStructure
        .querySelectorAll<HTMLElement>(PERSISTENT_BOTTOM_SECTION_SELECTOR)
        .forEach((section) => {
          section.dataset.mobilePersistentBottom = 'true';
          forceVisible(section);
        });
    };

    const scheduleVisibility = () => {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(applyVisibility);
    };

    const selectFromClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const trigger = event.target.closest<HTMLElement>('[data-mobile-category-id]');
      if (!trigger || !root.contains(trigger)) return;
      scheduleVisibility();
    };

    const observer = new MutationObserver(scheduleVisibility);
    observer.observe(root, {
      attributes: true,
      attributeFilter: ['data-mobile-active-category'],
    });

    root.addEventListener('click', selectFromClick, true);
    window.addEventListener(MOBILE_CATEGORY_SELECT_EVENT, scheduleVisibility);
    applyVisibility();

    return () => {
      window.cancelAnimationFrame(animationFrame);
      observer.disconnect();
      root.removeEventListener('click', selectFromClick, true);
      window.removeEventListener(MOBILE_CATEGORY_SELECT_EVENT, scheduleVisibility);

      const bottomStructure = root.querySelector<HTMLElement>('[data-mobile-bottom-owner="true"]');
      bottomStructure?.removeAttribute('data-mobile-persistent-bottom');
      bottomStructure
        ?.querySelectorAll<HTMLElement>(PERSISTENT_BOTTOM_SECTION_SELECTOR)
        .forEach((section) => section.removeAttribute('data-mobile-persistent-bottom'));
    };
  }, []);

  return null;
}

function forceVisible(element: HTMLElement) {
  element.hidden = false;
  element.removeAttribute('aria-hidden');
  element.style.removeProperty('display');
}
