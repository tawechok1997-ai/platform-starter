'use client';

import { useEffect } from 'react';
import { MEMBER_IMAGE_FALLBACK } from './image-fallback';

const DECORATIVE_CLASS_PATTERN = /(background|backdrop|blur|glow|shine|wash|fade|mask)/i;
const SOURCE_PROVIDER_THEME_PATTERN = /\/providers\/set\/1_1_(?:bg|title|avatar)\//i;

export default function MemberImageFallbackController() {
  useEffect(() => {
    const recoverImage = (event: Event) => {
      const image = event.target;
      if (!(image instanceof HTMLImageElement)) return;
      if (image.dataset.noFallback === 'true' || image.dataset.fallbackApplied === 'true') return;
      if (image.src.includes(MEMBER_IMAGE_FALLBACK)) return;

      const sourceCategoryPage = image.closest("main[data-source-game-category]");
      const isProviderThemeAsset = sourceCategoryPage && SOURCE_PROVIDER_THEME_PATTERN.test(image.src);

      if (isProviderThemeAsset) {
        image.dataset.noFallback = 'true';
        image.style.display = 'none';
        image.setAttribute('aria-hidden', 'true');
        return;
      }

      const className = typeof image.className === 'string' ? image.className : '';
      const decorative = image.getAttribute('aria-hidden') === 'true'
        && !image.alt
        && DECORATIVE_CLASS_PATTERN.test(className);
      if (decorative) return;

      image.dataset.fallbackApplied = 'true';
      image.removeAttribute('srcset');
      image.removeAttribute('sizes');
      image.src = MEMBER_IMAGE_FALLBACK;

      window.requestAnimationFrame(() => {
        image.style.removeProperty('display');
        image.style.removeProperty('visibility');
        image.style.removeProperty('opacity');
      });
    };

    document.addEventListener('error', recoverImage, true);
    return () => document.removeEventListener('error', recoverImage, true);
  }, []);

  return null;
}
