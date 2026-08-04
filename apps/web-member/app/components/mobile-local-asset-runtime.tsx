'use client';

import { useEffect } from 'react';
import { resolveLocalAssetByBasename } from '../lib/local-asset-by-basename';

const MOBILE_MEDIA_SCOPE = [
  '[data-mobile-home-root="true"]',
  '[data-mobile-member-page]',
  '[data-mobile-search-owner="true"]',
  '[data-mobile-avatar-owner="true"]',
  '[data-mobile-popup-owner]',
  '.auth-reference-scope',
].join(',');

const CARD_OWNED_MEDIA_SELECTOR = [
  '[data-no-fallback="true"]',
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

export default function MobileLocalAssetRuntime() {
  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 900px)');
    let scanFrame = 0;

    const matchImage = (image: HTMLImageElement) => {
      if (!image.closest(MOBILE_MEDIA_SCOPE)) return;

      // Game cards already resolve the checked-in asset, remote source and
      // replacement item together. Rewriting their src here creates a second
      // error owner and can separate the artwork from its game link.
      if (image.closest(CARD_OWNED_MEDIA_SELECTOR)) return;

      const currentSource = image.currentSrc || image.getAttribute('src') || '';
      if (!isRemoteMedia(currentSource)) return;
      if (image.dataset.mobileLocalFailedSource === currentSource) return;

      // This basename fallback is retained only for generic Mobile media.
      // Game artwork must use its provider/platform/game identity resolver.
      const localSource = resolveLocalAssetByBasename(currentSource, 'pc')
        || resolveLocalAssetByBasename(currentSource, 'mobile');
      if (!localSource || localSource === currentSource) return;

      image.dataset.mobileOriginalSource ||= image.getAttribute('src') || currentSource;
      const originalSourceSet = image.getAttribute('srcset');
      if (originalSourceSet) {
        image.dataset.mobileOriginalSourceSet ||= originalSourceSet;
        image.removeAttribute('srcset');
      }

      image.dataset.mobileLocalSource = localSource;
      image.src = localSource;

      if (image.dataset.mobileLocalFallbackBound === 'true') return;
      image.dataset.mobileLocalFallbackBound = 'true';
      image.addEventListener('error', () => {
        const originalSource = image.dataset.mobileOriginalSource;
        const attemptedLocalSource = image.dataset.mobileLocalSource;
        if (!originalSource || !attemptedLocalSource) return;
        if (image.getAttribute('src') !== attemptedLocalSource) return;

        image.dataset.mobileLocalFailedSource = originalSource;
        delete image.dataset.mobileLocalSource;
        image.src = originalSource;
        const sourceSet = image.dataset.mobileOriginalSourceSet;
        if (sourceSet) image.setAttribute('srcset', sourceSet);
      });
    };

    const matchVideoPoster = (video: HTMLVideoElement) => {
      if (!video.closest(MOBILE_MEDIA_SCOPE)) return;
      const poster = video.getAttribute('poster') || '';
      if (!isRemoteMedia(poster)) return;
      if (video.dataset.mobileLocalFailedPoster === poster) return;

      const localPoster = resolveLocalAssetByBasename(poster, 'pc')
        || resolveLocalAssetByBasename(poster, 'mobile');
      if (!localPoster || localPoster === poster) return;

      video.dataset.mobileOriginalPoster ||= poster;
      video.poster = localPoster;
      video.addEventListener('error', () => {
        const originalPoster = video.dataset.mobileOriginalPoster;
        if (!originalPoster || video.getAttribute('poster') !== localPoster) return;
        video.dataset.mobileLocalFailedPoster = originalPoster;
        video.poster = originalPoster;
      }, { once: true });
    };

    const scan = () => {
      scanFrame = 0;
      if (!mediaQuery.matches) return;
      document.querySelectorAll<HTMLImageElement>('img[src]').forEach(matchImage);
      document.querySelectorAll<HTMLVideoElement>('video[poster]').forEach(matchVideoPoster);
    };

    const scheduleScan = () => {
      if (scanFrame) return;
      scanFrame = window.requestAnimationFrame(scan);
    };

    scheduleScan();
    const observer = new MutationObserver(scheduleScan);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['src', 'srcset', 'poster'],
    });
    mediaQuery.addEventListener('change', scheduleScan);

    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener('change', scheduleScan);
      if (scanFrame) window.cancelAnimationFrame(scanFrame);
    };
  }, []);

  return null;
}

function isRemoteMedia(value: string) {
  return /^https?:\/\//i.test(value.trim());
}
