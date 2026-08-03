'use client';

import { useLayoutEffect } from 'react';
import { REFERENCE_GAMES, REFERENCE_PROVIDERS } from '../reference-asset-catalog';

const GAME_IMAGE_SELECTOR = [
  '.desktop-reference-home .source-highlight-game__blur',
  '.desktop-reference-home .source-highlight-game__image',
  '.desktop-reference-home .source-popular-card__blur',
  '.desktop-reference-home .source-popular-card__image',
  '.desktop-reference-home .source-online-card__art img',
  '.desktop-reference-home .reference-game-tile > img',
  '.desktop-reference-home .reference-leaderboard-game-image',
].join(',');

const PROVIDER_IMAGE_SELECTOR = [
  '.desktop-reference-home .source-highlight-game__provider img',
  '.desktop-reference-home .source-popular-card__provider img',
].join(',');

const ATTEMPTED_ASSETS_DATASET_KEY = 'desktopHomeAttemptedAssets';

export default function DesktopHomeGameImageRecoveryRuntime() {
  useLayoutEffect(() => {
    const recoverBrokenImage = (event: Event) => {
      const image = event.target;
      if (!(image instanceof HTMLImageElement)) return;

      const providerArtwork = image.matches(PROVIDER_IMAGE_SELECTOR);
      if (!providerArtwork && !image.matches(GAME_IMAGE_SELECTOR)) return;

      // Run before the component-level onError handlers. Those handlers hide
      // or remove failed catalog items, while this owner keeps the card visible
      // and switches it to a verified local Desktop asset instead.
      event.stopImmediatePropagation();

      const catalog = providerArtwork ? REFERENCE_PROVIDERS : REFERENCE_GAMES;
      const candidates = rotateAssets(catalog.map((asset) => asset.url), imageSeed(image));
      const attempted = readAttemptedAssets(image);
      attempted.add(absoluteAssetUrl(image.currentSrc || image.src));

      const next = candidates.find((candidate) => !attempted.has(absoluteAssetUrl(candidate)));
      if (!next) {
        image.hidden = true;
        return;
      }

      attempted.add(absoluteAssetUrl(next));
      image.dataset[ATTEMPTED_ASSETS_DATASET_KEY] = JSON.stringify(Array.from(attempted));
      image.hidden = false;
      image.style.removeProperty('display');
      image.src = next;
    };

    document.addEventListener('error', recoverBrokenImage, true);
    return () => document.removeEventListener('error', recoverBrokenImage, true);
  }, []);

  return null;
}

function imageSeed(image: HTMLImageElement) {
  const owner = image.closest<HTMLElement>(
    '[data-game-id], [data-game-code], [data-game-name], [title], .source-popular-card, .source-online-card, .source-highlight-game, .reference-game-tile',
  );
  return [
    owner?.dataset.gameId,
    owner?.dataset.gameCode,
    owner?.dataset.gameName,
    owner?.getAttribute('title'),
    image.alt,
    image.currentSrc,
    image.src,
  ].filter(Boolean).join(':');
}

function rotateAssets(items: string[], seed: string) {
  if (items.length < 2) return items;
  const start = stableIndex(seed, items.length);
  return [...items.slice(start), ...items.slice(0, start)];
}

function stableIndex(seed: string, length: number) {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = ((hash << 5) - hash + seed.charCodeAt(index)) | 0;
  }
  return Math.abs(hash) % Math.max(1, length);
}

function readAttemptedAssets(image: HTMLImageElement) {
  try {
    const parsed = JSON.parse(image.dataset[ATTEMPTED_ASSETS_DATASET_KEY] ?? '[]');
    return new Set(Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string') : []);
  } catch {
    return new Set<string>();
  }
}

function absoluteAssetUrl(value: string) {
  try {
    return new URL(value, window.location.origin).href;
  } catch {
    return value;
  }
}
