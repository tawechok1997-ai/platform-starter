import type { SyntheticEvent } from 'react';

export const MEMBER_IMAGE_FALLBACK = '/images/fallbacks/noah345-placeholder.svg';

export function applyMemberImageFallback(event: SyntheticEvent<HTMLImageElement>, fallback = MEMBER_IMAGE_FALLBACK) {
  const image = event.currentTarget;
  if (image.dataset.fallbackApplied === 'true') return;
  image.dataset.fallbackApplied = 'true';
  image.src = fallback;
}

export function hideDecorativeImage(event: SyntheticEvent<HTMLImageElement>) {
  event.currentTarget.style.display = 'none';
}
