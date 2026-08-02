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

export default function MobileLocalAssetRuntime() {
  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 900px)');
    let scanFrame = 0;

    const matchImage = (image: HTMLImageElement) => {
      if (!image.closest(MOBILE_MEDIA_SCOPE)) return;

      const currentSource = image.currentSrc || image.getAttribute('src') || '';
      if (!isRemoteMedia(currentSource)) return;
      if (image.dataset.mobileLocalFailedSource === currentSource) return;

      // asset-pc is the checked-in shared library for both viewports. Explicit
      // Mobile Admin URLs reach the element before this basename fallback runs.
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
