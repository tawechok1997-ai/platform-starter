'use client';

import { useEffect } from 'react';
import SourceGameCategoryPage, { type SourceGameCategoryConfig } from '../../source-game-category-page';

const rows = [
  ['dg', 'DREAM GAMING', false],
  ['sexyd', 'Sexy Baccarat', false],
  ['yeebet', 'Yeebet', true],
  ['sag', 'SA GAMING', false],
  ['ppcasino', 'PRAGMATIC PLAY Casino', false],
  ['evt', 'EVOLUTION', false],
  ['ab', 'AllBet', false],
  ['wmc', 'WM CASINO', false],
  ['biggamecasino', 'Biggame casino', false],
  ['astar', 'Astar', true],
] as const;

const LOCAL_PROVIDER_CARD_ROOT = '/assets/asset-pc/images/providers/set/1_1_v';
const transparentCardCache = new Map<string, string>();

const providers = rows.map(([code, name]) => ({
  code,
  name,
  badge: `https://cdn.zabbet.com/providers/set/1_1_badge/${code}.png`,
  card: `${LOCAL_PROVIDER_CARD_ROOT}/${code}.png`,
  background: `https://cdn.zabbet.com/providers/set/1_1_bg/${code}.png`,
  title: `https://cdn.zabbet.com/providers/set/1_1_title/${code}.png`,
  avatar: `https://cdn.zabbet.com/providers/set/1_1_avatar/${code}.png`,
}));

const config: SourceGameCategoryConfig = {
  slug: 'casino',
  title: 'คาสิโน',
  total: 10,
  resultUnit: 'ค่าย',
  mode: 'provider-cards',
  baseBackground: '/assets/asset-pc/images/game/casino/bg_casino.webp',
  baseLogo: '/assets/asset-pc/images/game/casino/logo_casino.webp',
  filters: [{ key: 'new', label: 'เกมส์ใหม่', count: 1 }],
  providers,
  games: rows.map(([code, name, isNew]) => ({
    id: code,
    name,
    image: `${LOCAL_PROVIDER_CARD_ROOT}/${code}.png`,
    provider: code,
    isNew,
    isHot: false,
    tags: isNew ? ['new' as const] : [],
  })),
};

export default function CasinoSourcePage() {
  useCasinoCardTransparency();

  return (
    <>
      <SourceGameCategoryPage config={config} />
      <style>{`
        /* Preserve the original casino page artwork, fade and provider motion. */
        main[data-source-game-category='casino'][data-source-game-category='casino'] {
          background: #110e16 !important;
          background-color: #110e16 !important;
        }

        main[data-source-game-category='casino'] > div[aria-hidden='true'] {
          height: auto !important;
          min-height: 600px !important;
        }

        main[data-source-game-category='casino'] > div[aria-hidden='true'] > img {
          height: auto !important;
          min-height: 600px !important;
        }

        main[data-source-game-category='casino'] [data-source-bottom-fade][data-source-bottom-fade] {
          opacity: 1 !important;
          background: linear-gradient(182deg, rgba(115, 115, 115, 0) 29.43%, #110e16 52.3%, #110e16 85.96%) !important;
        }

        /* Only the provider-card bitmap is changed. No page background or
         * animation layer participates in the transparency treatment. */
        main[data-source-game-category='casino'] [data-source-game-cover] {
          background: transparent !important;
          background-color: transparent !important;
          background-image: none !important;
          box-shadow: none !important;
        }

        main[data-source-game-category='casino'] [data-source-game-cover] > img:not([aria-hidden='true']) {
          mix-blend-mode: normal !important;
          filter: none !important;
          background: transparent !important;
        }

        main[data-source-game-category='casino'] img[data-casino-processing='true'] {
          opacity: 0 !important;
        }

        main[data-source-game-category='casino'] img[data-casino-transparent='done'],
        main[data-source-game-category='casino'] img[data-casino-transparent='failed'] {
          opacity: 1 !important;
        }
      `}</style>
    </>
  );
}

function useCasinoCardTransparency() {
  useEffect(() => {
    const page = document.querySelector<HTMLElement>("main[data-source-game-category='casino']");
    if (!page) return;

    const cleanups = new Map<HTMLImageElement, () => void>();
    const timers = new Set<number>();

    const processImage = (image: HTMLImageElement) => {
      if (!image.src.includes('/providers/set/1_1_v/')) return;
      if (image.dataset.casinoTransparent || image.dataset.casinoProcessing === 'true') return;

      const source = image.currentSrc || image.src;
      const cached = transparentCardCache.get(source);
      if (cached) {
        image.dataset.casinoTransparent = 'done';
        image.src = cached;
        return;
      }

      const run = () => {
        cleanups.get(image)?.();
        cleanups.delete(image);
        if (!image.isConnected || image.dataset.casinoTransparent) return;

        image.dataset.casinoProcessing = 'true';
        const timer = window.setTimeout(() => {
          timers.delete(timer);
          try {
            const transparent = removeConnectedDarkBackground(image);
            transparentCardCache.set(source, transparent);
            image.dataset.casinoTransparent = 'done';
            image.src = transparent;
          } catch {
            image.dataset.casinoTransparent = 'failed';
          } finally {
            delete image.dataset.casinoProcessing;
          }
        }, 0);
        timers.add(timer);
      };

      if (image.complete && image.naturalWidth > 0) {
        run();
        return;
      }

      const handleLoad = () => run();
      const handleError = () => {
        image.dataset.casinoTransparent = 'failed';
        delete image.dataset.casinoProcessing;
      };
      image.addEventListener('load', handleLoad, { once: true });
      image.addEventListener('error', handleError, { once: true });
      cleanups.set(image, () => {
        image.removeEventListener('load', handleLoad);
        image.removeEventListener('error', handleError);
      });
    };

    const scan = () => {
      page.querySelectorAll<HTMLImageElement>("[data-source-game-cover] > img:not([aria-hidden='true'])")
        .forEach(processImage);
    };

    scan();
    const observer = new MutationObserver(scan);
    observer.observe(page, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      cleanups.forEach((cleanup) => cleanup());
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);
}

function removeConnectedDarkBackground(image: HTMLImageElement): string {
  const width = image.naturalWidth;
  const height = image.naturalHeight;
  if (!width || !height) throw new Error('Casino provider image has no dimensions');

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('Canvas context unavailable');

  context.drawImage(image, 0, 0, width, height);
  const frame = context.getImageData(0, 0, width, height);
  const pixels = frame.data;
  const pixelCount = width * height;
  const backgroundSamples = collectDominantBoundaryColours(pixels, width, height);
  const candidates = new Uint8Array(pixelCount);
  const visited = new Uint8Array(pixelCount);
  const queue = new Int32Array(pixelCount);
  const maximumLuminance = 118;
  const maximumColourDistance = 54 * 54;

  for (let index = 0; index < pixelCount; index += 1) {
    const offset = index * 4;
    const alpha = pixels[offset + 3] ?? 0;
    if (alpha <= 16) continue;

    const red = pixels[offset] ?? 0;
    const green = pixels[offset + 1] ?? 0;
    const blue = pixels[offset + 2] ?? 0;
    if (luminance(red, green, blue) > maximumLuminance) continue;

    for (const sample of backgroundSamples) {
      const dr = red - sample[0];
      const dg = green - sample[1];
      const db = blue - sample[2];
      if ((dr * dr) + (dg * dg) + (db * db) <= maximumColourDistance) {
        candidates[index] = 1;
        break;
      }
    }
  }

  const largeBackgroundRegion = Math.max(64, Math.floor(pixelCount * 0.018));
  const neighbours = [-1, 1, -width, width, -width - 1, -width + 1, width - 1, width + 1];

  for (let start = 0; start < pixelCount; start += 1) {
    if (!(candidates[start] ?? 0) || (visited[start] ?? 0)) continue;

    let head = 0;
    let tail = 0;
    let touchesExterior = false;
    queue[tail++] = start;
    visited[start] = 1;

    while (head < tail) {
      const index = queue[head++] ?? 0;
      const x = index % width;
      const y = Math.floor(index / width);
      if (x === 0 || y === 0 || x === width - 1 || y === height - 1) touchesExterior = true;

      for (const delta of neighbours) {
        const next = index + delta;
        if (next < 0 || next >= pixelCount) continue;
        const nextX = next % width;
        if (Math.abs(nextX - x) > 1) continue;

        const nextAlpha = pixels[(next * 4) + 3] ?? 0;
        if (nextAlpha <= 16) touchesExterior = true;
        if (!(candidates[next] ?? 0) || (visited[next] ?? 0)) continue;
        visited[next] = 1;
        queue[tail++] = next;
      }
    }

    if (!touchesExterior && tail < largeBackgroundRegion) continue;
    for (let member = 0; member < tail; member += 1) {
      const index = queue[member] ?? 0;
      pixels[(index * 4) + 3] = 0;
    }
  }

  context.putImageData(frame, 0, 0);
  return canvas.toDataURL('image/png');
}

function collectDominantBoundaryColours(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
): Array<[number, number, number]> {
  const rawSamples: Array<[number, number, number]> = [];
  const xStep = Math.max(1, Math.floor(width / 48));
  const yStep = Math.max(1, Math.floor(height / 48));

  const addFirstOpaque = (indexes: Iterable<number>) => {
    for (const index of indexes) {
      const offset = index * 4;
      if ((pixels[offset + 3] ?? 0) <= 16) continue;
      const red = pixels[offset] ?? 0;
      const green = pixels[offset + 1] ?? 0;
      const blue = pixels[offset + 2] ?? 0;
      if (luminance(red, green, blue) <= 130) rawSamples.push([red, green, blue]);
      return;
    }
  };

  for (let x = 0; x < width; x += xStep) {
    addFirstOpaque(columnIndexes(x, 0, height, width, 1));
    addFirstOpaque(columnIndexes(x, height - 1, height, width, -1));
  }
  for (let y = 0; y < height; y += yStep) {
    addFirstOpaque(rowIndexes(y, 0, width, 1));
    addFirstOpaque(rowIndexes(y, width - 1, width, -1));
  }

  if (!rawSamples.length) return [[0, 0, 0]];

  const buckets = new Map<string, { count: number; red: number; green: number; blue: number }>();
  rawSamples.forEach(([red, green, blue]) => {
    const key = `${red >> 4}:${green >> 4}:${blue >> 4}`;
    const bucket = buckets.get(key) ?? { count: 0, red: 0, green: 0, blue: 0 };
    bucket.count += 1;
    bucket.red += red;
    bucket.green += green;
    bucket.blue += blue;
    buckets.set(key, bucket);
  });

  return Array.from(buckets.values())
    .sort((left, right) => right.count - left.count)
    .slice(0, 6)
    .map((bucket) => [
      Math.round(bucket.red / bucket.count),
      Math.round(bucket.green / bucket.count),
      Math.round(bucket.blue / bucket.count),
    ]);
}

function* columnIndexes(x: number, startY: number, height: number, width: number, direction: 1 | -1) {
  for (let y = startY; y >= 0 && y < height; y += direction) yield (y * width) + x;
}

function* rowIndexes(y: number, startX: number, width: number, direction: 1 | -1) {
  for (let x = startX; x >= 0 && x < width; x += direction) yield (y * width) + x;
}

function luminance(red: number, green: number, blue: number) {
  return (red * 2126 + green * 7152 + blue * 722) / 10000;
}
