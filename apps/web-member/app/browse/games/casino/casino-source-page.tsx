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
  useTransparentCasinoProviderCards();

  return (
    <>
      <SourceGameCategoryPage config={config} />
      <style>{`
        /* Restore the original casino page artwork and motion. Only the provider
         * card bitmap is altered by the runtime transparency pass below. */
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

        main[data-source-game-category='casino'] [data-source-game-cover] > img:not([aria-hidden='true']) {
          mix-blend-mode: normal !important;
          filter: none !important;
          background: transparent !important;
        }

        main[data-source-game-category='casino'] img[data-casino-card-source='true'] {
          opacity: 0;
        }

        main[data-source-game-category='casino'] img[data-casino-transparent='done'],
        main[data-source-game-category='casino'] img[data-casino-transparent='failed'] {
          opacity: 1;
        }
      `}</style>
    </>
  );
}

function useTransparentCasinoProviderCards() {
  useEffect(() => {
    const page = document.querySelector<HTMLElement>("main[data-source-game-category='casino']");
    if (!page) return;

    const pendingTimers = new Set<number>();
    const loadCleanups = new Map<HTMLImageElement, () => void>();

    const processImage = (image: HTMLImageElement) => {
      if (image.dataset.casinoCardSource === 'true' || image.src.startsWith('data:image/png')) return;
      if (!image.src.includes('/providers/set/1_1_v/')) return;

      image.dataset.casinoCardSource = 'true';

      const run = () => {
        loadCleanups.delete(image);
        if (!image.isConnected || image.dataset.casinoTransparent) return;

        const timer = window.setTimeout(() => {
          pendingTimers.delete(timer);
          try {
            replaceEdgeBackgroundWithAlpha(image);
            image.dataset.casinoTransparent = 'done';
          } catch {
            image.dataset.casinoTransparent = 'failed';
          }
        }, 0);
        pendingTimers.add(timer);
      };

      if (image.complete && image.naturalWidth > 0) {
        run();
        return;
      }

      const handleLoad = () => run();
      const handleError = () => {
        loadCleanups.delete(image);
        image.dataset.casinoTransparent = 'failed';
      };
      image.addEventListener('load', handleLoad, { once: true });
      image.addEventListener('error', handleError, { once: true });
      loadCleanups.set(image, () => {
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
      pendingTimers.forEach((timer) => window.clearTimeout(timer));
      loadCleanups.forEach((cleanup) => cleanup());
    };
  }, []);
}

function replaceEdgeBackgroundWithAlpha(image: HTMLImageElement) {
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
  const candidates = new Uint8Array(pixelCount);
  const visited = new Uint8Array(pixelCount);
  const queue = new Int32Array(pixelCount);
  const samples = collectEdgeBackgroundSamples(pixels, width, height);
  const distanceLimit = 34 * 34;

  for (let index = 0; index < pixelCount; index += 1) {
    const offset = index * 4;
    if (pixels[offset + 3] === 0) continue;

    const red = pixels[offset];
    const green = pixels[offset + 1];
    const blue = pixels[offset + 2];
    const luminance = (red * 2126 + green * 7152 + blue * 722) / 10000;
    if (luminance > 92) continue;

    for (const sample of samples) {
      const dr = red - sample[0];
      const dg = green - sample[1];
      const db = blue - sample[2];
      if ((dr * dr) + (dg * dg) + (db * db) <= distanceLimit) {
        candidates[index] = 1;
        break;
      }
    }
  }

  let head = 0;
  let tail = 0;
  const enqueue = (index: number) => {
    if (!candidates[index] || visited[index]) return;
    visited[index] = 1;
    queue[tail] = index;
    tail += 1;
  };

  for (let x = 0; x < width; x += 1) {
    enqueue(x);
    enqueue(((height - 1) * width) + x);
  }
  for (let y = 1; y < height - 1; y += 1) {
    enqueue(y * width);
    enqueue((y * width) + width - 1);
  }

  while (head < tail) {
    const index = queue[head];
    head += 1;
    const x = index % width;
    const y = Math.floor(index / width);

    if (x > 0) enqueue(index - 1);
    if (x + 1 < width) enqueue(index + 1);
    if (y > 0) enqueue(index - width);
    if (y + 1 < height) enqueue(index + width);
  }

  for (let index = 0; index < pixelCount; index += 1) {
    if (visited[index]) pixels[(index * 4) + 3] = 0;
  }

  context.putImageData(frame, 0, 0);
  image.src = canvas.toDataURL('image/png');
}

function collectEdgeBackgroundSamples(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
): Array<[number, number, number]> {
  const sampleSize = Math.max(4, Math.min(14, Math.floor(Math.min(width, height) * 0.025)));
  const positions = [
    [0, 0],
    [width - sampleSize, 0],
    [0, height - sampleSize],
    [width - sampleSize, height - sampleSize],
    [Math.floor((width - sampleSize) / 2), 0],
  ] as const;

  return positions.map(([startX, startY]) => {
    let red = 0;
    let green = 0;
    let blue = 0;
    let count = 0;

    for (let y = startY; y < startY + sampleSize; y += 1) {
      for (let x = startX; x < startX + sampleSize; x += 1) {
        const offset = ((y * width) + x) * 4;
        if (pixels[offset + 3] === 0) continue;
        red += pixels[offset];
        green += pixels[offset + 1];
        blue += pixels[offset + 2];
        count += 1;
      }
    }

    const divisor = Math.max(1, count);
    return [Math.round(red / divisor), Math.round(green / divisor), Math.round(blue / divisor)];
  });
}
