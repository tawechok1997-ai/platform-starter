'use client';

import { useEffect } from 'react';
import { API_URL } from '../../member-api';
import { canonicalizeLocalAssetPath, resolveLocalAssetOrSource } from '../../lib/local-asset-by-basename';

const MOBILE_HOME_ROOT = '[data-mobile-home-root="true"]';
const RECOVERABLE_IMAGE_SELECTOR = [
  '[data-mobile-section-owner="hero"] img',
  '[data-mobile-highlight-panel="promotions"] img',
  '[data-mobile-highlight-panel="activities"] img',
  '[data-mobile-highlight-panel="news"] img',
].join(',');

const API_ROOT = API_URL.replace(/\/$/, '');

export default function MobileHomeImageRecoveryRuntime() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(MOBILE_HOME_ROOT);
    if (!root) return;

    const recoverBrokenImage = (image: HTMLImageElement) => {
      if (!image.matches(RECOVERABLE_IMAGE_SELECTOR)) return false;
      const candidates = imageCandidates(image);
      const attempted = new Set(readAttempted(image));
      const next = candidates.find((candidate) => !attempted.has(candidate) && !sameUrl(candidate, image.currentSrc || image.src));
      if (!next) return false;

      attempted.add(next);
      image.dataset.mobileImageAttempts = JSON.stringify(Array.from(attempted));
      queueMicrotask(() => {
        image.hidden = false;
        image.removeAttribute('hidden');
        image.src = next;
      });
      return true;
    };

    const onImageError = (event: Event) => {
      if (!(event.target instanceof HTMLImageElement)) return;
      recoverBrokenImage(event.target);
    };

    const scan = () => {
      root.querySelectorAll<HTMLImageElement>(RECOVERABLE_IMAGE_SELECTOR).forEach((image) => {
        if (image.complete && image.naturalWidth === 0) recoverBrokenImage(image);
      });
    };

    root.addEventListener('error', onImageError, true);
    const observer = new MutationObserver(scan);
    observer.observe(root, { childList: true, subtree: true });
    const frame = window.requestAnimationFrame(scan);

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      root.removeEventListener('error', onImageError, true);
    };
  }, []);

  return null;
}

function imageCandidates(image: HTMLImageElement) {
  const source = image.getAttribute('src')?.trim() ?? '';
  const canonical = canonicalizeLocalAssetPath(source);
  const local = resolveLocalAssetOrSource(canonical, 'mobile');
  const pathname = pathOf(canonical || source);
  const basename = fileNameOf(pathname);
  const candidates = new Set<string>();

  addCandidate(candidates, local);
  addCandidate(candidates, canonical);

  if (pathname.startsWith('/public/cms-assets/')) {
    addCandidate(candidates, `${API_ROOT}${pathname}`);
  }

  if (basename && image.closest('[data-mobile-section-owner="hero"]')) {
    addCandidate(candidates, `/assets/asset-mobile/FEZX/imageslides/${basename}`);
    addCandidate(candidates, `/assets/asset-pc/images/FEZX/imageslides/${basename}`);
    addCandidate(candidates, `https://cdn.zabbet.com/FEZX/imageslides/${basename}`);
  }

  if (basename && image.closest('[data-mobile-highlight-panel="promotions"]')) {
    addCandidate(candidates, `/assets/asset-mobile/FEZX/promotions/${basename}`);
    addCandidate(candidates, `/assets/asset-pc/images/FEZX/promotions/${basename}`);
    addCandidate(candidates, `https://cdn.zabbet.com/FEZX/promotions/${basename}`);
  }

  if (/^https?:\/\//i.test(source)) addCandidate(candidates, source);
  return Array.from(candidates);
}

function readAttempted(image: HTMLImageElement): string[] {
  try {
    const value = JSON.parse(image.dataset.mobileImageAttempts ?? '[]');
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

function addCandidate(target: Set<string>, value: string) {
  const candidate = value.trim();
  if (candidate) target.add(candidate);
}

function pathOf(value: string) {
  if (!value) return '';
  try {
    return new URL(value, window.location.origin).pathname;
  } catch {
    return value.split(/[?#]/, 1)[0] ?? '';
  }
}

function fileNameOf(pathname: string) {
  const encoded = pathname.split('/').filter(Boolean).pop() ?? '';
  try {
    return decodeURIComponent(encoded);
  } catch {
    return encoded;
  }
}

function sameUrl(left: string, right: string) {
  try {
    return new URL(left, window.location.origin).href === new URL(right, window.location.origin).href;
  } catch {
    return left === right;
  }
}
