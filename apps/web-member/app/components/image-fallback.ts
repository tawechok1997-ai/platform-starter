import type { SyntheticEvent } from 'react';

const LOCAL_GAME_ROOT = '/assets/asset-pc/images/games/';

export const MEMBER_IMAGE_FALLBACK = '/images/fallbacks/noah345-placeholder.svg';

export function applyMemberImageFallback(event: SyntheticEvent<HTMLImageElement>, fallback = MEMBER_IMAGE_FALLBACK) {
  const image = event.currentTarget;
  const source = (image.currentSrc || image.src || '').replace(/\\/g, '/').split(/[?#]/, 1)[0] ?? '';
  const gameMarker = '/games/';
  const markerIndex = source.toLowerCase().lastIndexOf(gameMarker);

  if (markerIndex >= 0 && image.dataset.localGameRetry !== 'true') {
    const fileName = source.slice(markerIndex + gameMarker.length).split('/').filter(Boolean).pop() ?? '';
    if (fileName && !fileName.includes('..')) {
      const localAsset = `${LOCAL_GAME_ROOT}${fileName}`;
      if (!source.endsWith(localAsset)) {
        image.dataset.localGameRetry = 'true';
        image.src = localAsset;
        return;
      }
    }
  }

  if (markerIndex >= 0 || image.dataset.localGameRetry === 'true') {
    image.style.display = 'none';
    return;
  }

  if (image.dataset.fallbackApplied === 'true') return;
  image.dataset.fallbackApplied = 'true';
  image.src = fallback;
}

export function hideDecorativeImage(event: SyntheticEvent<HTMLImageElement>) {
  event.currentTarget.style.display = 'none';
}
