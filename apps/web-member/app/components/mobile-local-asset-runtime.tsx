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

const ORIGINAL_SOURCE_ATTRIBUTE = 'data-mobile-original-source';
const LOCAL_SOURCE_ATTRIBUTE = 'data-mobile-local-source';
const FALLBACK_BOUND_ATTRIBUTE = 'data-mobile-local-fallback-bound';

export default function MobileLocalAssetRuntime() {
  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 900px)');
    let scanFrame = 0;

    const matchImage = (image: HTMLImageElement) => {
      if (!image.closest(MOBILE_MEDIA_SCOPE)) return;

      const currentSource = image.currentSrc || image.getAttribute('src') || '';
      if (!isRemoteMedia(currentSource)) return;

      const localSource = resolveLocalAssetByBasename(currentSource, 'mobile')
        || resolveLocalAssetByBasename(currentSource, 'pc');
      if (!localSource || localSource === currentSource) return;

      image.dataset.mobileOriginalSource ||= currentSource;
      image.dataset.mobileLocalSource = localSource;
      image.src = localSource;

      if (image.dataset.mobileLocalFallbackBound === 'true') return;
      image.dataset.mobileLocalFallbackBound = 'true';
      image.addEventListener('error', () => {
        const originalSource = image.dataset.mobileOriginalSource;
        const attemptedLocalSource = image.dataset.mobileLocalSource;
        if (!originalSource || !attemptedLocalSource) return;
        if (image.getAttribute('src') !== attemptedLocalSource) return;

        delete image.dataset.mobileLocalSource;
        image.src = originalSource;
      });
    };

    const matchVideoPoster = (video: HTMLVideoElement) => {
      if (!video.closest(MOBILE_MEDIA_SCOPE)) return;
      const poster = video.getAttribute('poster') || '';
      if (!isRemoteMedia(poster)) return;
      const localPoster = resolveLocalAssetByBasename(poster, 'mobile')
        || resolveLocalAssetByBasename(poster, 'pc');
      if (localPoster && localPoster !== poster) video.poster = localPoster;
    };

    const scan = () => {
      scanFrame = 0;
      if (!mediaQuery.matches) return;
      document.querySelectorAll<HTMLImageElement>(`${MOBILE_MEDIA_SCOPE} img[src]`).forEach(matchImage);
      document.querySelectorAll<HTMLVideoElement>(`${MOBILE_MEDIA_SCOPE} video[poster]`).forEach(matchVideoPoster);
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
      attributeFilter: ['src', 'poster'],
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
