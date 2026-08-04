'use client';

import { useEffect } from 'react';
import { applyFallbackToImage, MEMBER_IMAGE_FALLBACK } from './image-fallback';

const DECORATIVE_CLASS_PATTERN = /(background|backdrop|blur|glow|shine|wash|fade|mask)/i;
const SOURCE_PROVIDER_THEME_PATTERN = /\/providers\/set\/1_1_(?:bg|title|avatar)\//i;
const GAME_ART_OWNER_SELECTOR = [
  '[data-game-id]',
  '[data-game-code]',
  '[data-game-name]',
  '[data-game-tags]',
  '[data-game-card]',
  '.source-highlight-game',
  '.source-popular-card',
  '.source-online-card',
  '.reference-game-tile',
  '.v47-mobile-game-grid > a',
  '.member-game-card',
].join(',');

export default function MemberImageFallbackController() {
  useEffect(() => {
    const sanitizeImage = (image: HTMLImageElement) => {
      const rawSource = image.getAttribute('src')?.trim() ?? '';
      if (!rawSource || isUsableImageSource(rawSource)) return;
      image.dataset.invalidOriginalSource = rawSource;
      applyFallbackToImage(image);
    };

    const sanitizeTree = (root: ParentNode) => {
      if (root instanceof HTMLImageElement) sanitizeImage(root);
      root.querySelectorAll?.('img[src]').forEach((node) => {
        if (node instanceof HTMLImageElement) sanitizeImage(node);
      });
    };

    sanitizeTree(document);
    const mutationObserver = new MutationObserver((records) => {
      for (const record of records) {
        if (record.type === 'attributes' && record.target instanceof HTMLImageElement) {
          sanitizeImage(record.target);
          continue;
        }
        record.addedNodes.forEach((node) => {
          if (node instanceof Element) sanitizeTree(node);
        });
      }
    });
    mutationObserver.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['src'],
    });

    const recoverImage = (event: Event) => {
      const image = event.target;
      if (!(image instanceof HTMLImageElement)) return;

      const originalMobileSource = image.dataset.mobileOriginalSource;
      const attemptedLocalSource = image.dataset.mobileLocalSource;
      if (
        originalMobileSource
        && attemptedLocalSource
        && image.getAttribute('src') === attemptedLocalSource
      ) {
        image.dataset.mobileLocalFailedSource = originalMobileSource;
        delete image.dataset.mobileLocalSource;
        image.src = originalMobileSource;
        const originalSourceSet = image.dataset.mobileOriginalSourceSet;
        if (originalSourceSet) image.setAttribute('srcset', originalSourceSet);
        return;
      }

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

      if (image.closest(GAME_ART_OWNER_SELECTOR)) {
        // Let a card-specific React onError replace the source first. If that
        // handler leaves the same failed URL in place, close the chain with the
        // common placeholder instead of hiding the card or issuing another 404.
        const failedSource = image.currentSrc || image.src;
        window.setTimeout(() => {
          if (!image.isConnected || image.dataset.fallbackApplied === 'true') return;
          const currentSource = image.currentSrc || image.src;
          if (currentSource !== failedSource) return;
          applyFallbackToImage(image);
        }, 0);
        return;
      }

      applyFallbackToImage(image);
    };

    document.addEventListener('error', recoverImage, true);
    return () => {
      mutationObserver.disconnect();
      document.removeEventListener('error', recoverImage, true);
    };
  }, []);

  return null;
}

function isUsableImageSource(source: string) {
  if (/^(?:https?:\/\/|\/|\.\/|\.\.\/|data:image\/|blob:)/i.test(source)) return true;
  return /^[^\s/]+\.(?:avif|gif|ico|jpe?g|png|svg|webm|webp)(?:[?#].*)?$/i.test(source);
}
