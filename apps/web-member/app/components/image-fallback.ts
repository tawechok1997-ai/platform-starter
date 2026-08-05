import type { SyntheticEvent } from 'react';

export const MEMBER_IMAGE_FALLBACK = '/images/fallbacks/noah345-placeholder.svg';

export function applyMemberImageFallback(event: SyntheticEvent<HTMLImageElement>, fallback = MEMBER_IMAGE_FALLBACK) {
  const image = event.currentTarget;
  applyFallbackToImage(image, fallback);
}

export function applyFallbackToImage(image: HTMLImageElement, fallback = MEMBER_IMAGE_FALLBACK) {
  if (image.dataset.fallbackApplied === 'true' || image.src.includes(fallback)) return;

  // Do not manufacture a local `/games/<basename>` URL after a remote image
  // fails. The old retry created a second guaranteed 404 whenever that basename
  // was not shipped. Catalog owners already resolve local assets before render;
  // at error time the safe final state is the branded placeholder.
  image.dataset.fallbackApplied = 'true';
  image.removeAttribute('srcset');
  image.removeAttribute('sizes');
  image.style.removeProperty('display');
  image.style.removeProperty('visibility');
  image.style.removeProperty('opacity');
  image.src = fallback;
}

export function hideDecorativeImage(event: SyntheticEvent<HTMLImageElement>) {
  event.currentTarget.style.display = 'none';
}
