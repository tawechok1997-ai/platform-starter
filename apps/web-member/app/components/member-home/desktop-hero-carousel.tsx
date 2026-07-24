'use client';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type SyntheticEvent,
} from 'react';
import type { CmsContent } from '../../site-settings';

type CmsBanner = CmsContent['banners'][number];

type HeroSlide = {
  banner: CmsBanner;
  imageUrl: string;
  realIndex: number;
};

type DesktopHeroCarouselProps = {
  content: CmsContent;
  siteName: string;
  showPromotion: boolean;
};

type VisibleSlide = {
  role: 'previous' | 'active' | 'next';
  slide: HeroSlide;
};

const AUTOPLAY_DELAY_MS = 4200;
const SWIPE_THRESHOLD_PX = 48;

export function DesktopHeroCarousel({ content, siteName, showPromotion }: DesktopHeroCarouselProps) {
  const slides = useMemo<HeroSlide[]>(() => {
    const enabledBanners = Array.isArray(content.banners)
      ? content.banners.filter((banner) => banner.enabled)
      : [];

    return enabledBanners.flatMap((banner, realIndex) => {
      const imageUrl = normalizeUrl(banner.imageUrl || resolveCmsAssetById(content, banner.assetId));
      return imageUrl ? [{ banner, imageUrl, realIndex }] : [];
    });
  }, [content]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const pointerStartX = useRef<number | null>(null);
  const realCount = slides.length;
  const normalizedActiveIndex = realCount ? modulo(activeIndex, realCount) : 0;

  const visibleSlides = useMemo<VisibleSlide[]>(() => {
    if (realCount === 0) return [];
    if (realCount === 1) return [{ role: 'active', slide: slides[0]! }];

    return [
      { role: 'previous', slide: slides[modulo(normalizedActiveIndex - 1, realCount)]! },
      { role: 'active', slide: slides[normalizedActiveIndex]! },
      { role: 'next', slide: slides[modulo(normalizedActiveIndex + 1, realCount)]! },
    ];
  }, [normalizedActiveIndex, realCount, slides]);

  useEffect(() => {
    if (realCount < 2 || paused) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const timer = window.setInterval(() => {
      if (!document.hidden) setActiveIndex((current) => modulo(current + 1, realCount));
    }, AUTOPLAY_DELAY_MS);

    return () => window.clearInterval(timer);
  }, [paused, realCount]);

  if (!showPromotion || realCount === 0) return null;

  function moveBy(delta: number) {
    if (realCount < 2) return;
    setActiveIndex((current) => modulo(current + delta, realCount));
  }

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      moveBy(-1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      moveBy(1);
    }
  }

  function handlePointerDown(event: PointerEvent<HTMLElement>) {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    pointerStartX.current = event.clientX;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setPaused(true);
  }

  function handlePointerUp(event: PointerEvent<HTMLElement>) {
    const startX = pointerStartX.current;
    pointerStartX.current = null;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    setPaused(false);
    if (startX === null) return;

    const distance = event.clientX - startX;
    if (distance <= -SWIPE_THRESHOLD_PX) moveBy(1);
    else if (distance >= SWIPE_THRESHOLD_PX) moveBy(-1);
  }

  return (
    <section
      className="reference-hero-carousel"
      aria-label="โปรโมชั่นแนะนำ"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => {
        pointerStartX.current = null;
        setPaused(false);
      }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="reference-hero-mask">
        <div className="reference-hero-track">
          {visibleSlides.map(({ role, slide }) => (
            <HeroSlideCard
              key={`${role}-${slide.realIndex}-${slide.imageUrl}`}
              role={role}
              slide={slide}
              siteName={siteName}
            />
          ))}
        </div>
      </div>

      {realCount > 1 ? (
        <div className="reference-hero-pagination" aria-label="เลือกแบนเนอร์">
          {slides.map((slide, index) => (
            <button
              key={`${slide.realIndex}-${slide.imageUrl}`}
              type="button"
              className={index === normalizedActiveIndex ? 'is-active' : ''}
              onClick={() => setActiveIndex(index)}
              aria-label={`แบนเนอร์ ${index + 1}`}
              aria-current={index === normalizedActiveIndex ? 'true' : undefined}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

function HeroSlideCard({ role, slide, siteName }: { role: VisibleSlide['role']; slide: HeroSlide; siteName: string }) {
  const isActive = role === 'active';
  return (
    <a
      href={slide.banner.href || '/promotions'}
      className={`reference-hero-slide reference-hero-slide--${role}${isActive ? ' is-active' : ''}`}
      aria-label={slide.banner.title || `โปรโมชั่น ${slide.realIndex + 1}`}
      aria-hidden={isActive ? undefined : true}
      tabIndex={isActive ? 0 : -1}
    >
      <img
        src={slide.imageUrl}
        alt={slide.banner.title || siteName}
        draggable={false}
        onError={hideBrokenImage}
      />
    </a>
  );
}

function resolveCmsAssetById(content: CmsContent, assetId?: string) {
  return assetId ? content.assets.find((asset) => asset.enabled && asset.id === assetId)?.url || '' : '';
}

function normalizeUrl(value: string) {
  if (!value) return '';
  if (/^https?:\/\//i.test(value) || value.startsWith('/')) return value;
  return `/${value.replace(/^\.\//, '')}`;
}

function modulo(value: number, divisor: number) {
  return ((value % divisor) + divisor) % divisor;
}

function hideBrokenImage(event: SyntheticEvent<HTMLImageElement>) {
  event.currentTarget.style.visibility = 'hidden';
}
