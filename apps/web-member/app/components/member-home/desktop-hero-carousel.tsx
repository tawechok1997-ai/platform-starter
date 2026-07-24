'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type SyntheticEvent,
} from 'react';
import type { CmsContent } from '../../site-settings';
import { V47_ASSETS } from './v47-asset-map';

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

type PointerState = {
  pointerId: number;
  startX: number;
  deltaX: number;
  moved: boolean;
};

const AUTOPLAY_DELAY_MS = 4200;
const SWIPE_THRESHOLD_PX = 48;
const DRAG_START_THRESHOLD_PX = 4;
const ARCHIVE_BANNERS: CmsBanner[] = [
  { title: 'ประกาศรางวัลผู้โชคดี', subtitle: 'NOAH345', imageUrl: V47_ASSETS.heroWinners, href: '/promotions', enabled: true },
  { title: 'กิจกรรม Daily Login', subtitle: 'รับรางวัลทุกวัน', imageUrl: V47_ASSETS.heroLogin, href: '/promotions', enabled: true },
  { title: 'ติดตามข่าวสาร', subtitle: 'ข่าวสารและกิจกรรมล่าสุด', imageUrl: V47_ASSETS.heroNews, href: '/notifications', enabled: true },
];

export function DesktopHeroCarousel({ content, siteName, showPromotion }: DesktopHeroCarouselProps) {
  const slides = useMemo<HeroSlide[]>(() => {
    const enabledBanners = Array.isArray(content.banners)
      ? content.banners.filter((banner) => banner.enabled)
      : [];
    const bannerSource = enabledBanners.length >= 3
      ? enabledBanners
      : [...enabledBanners, ...ARCHIVE_BANNERS].slice(0, 3);

    return bannerSource.flatMap((banner, realIndex) => {
      const imageUrl = normalizeUrl(banner.imageUrl || resolveCmsAssetById(content, banner.assetId));
      return imageUrl ? [{ banner, imageUrl, realIndex }] : [];
    });
  }, [content]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const carouselRef = useRef<HTMLElement | null>(null);
  const pointerState = useRef<PointerState | null>(null);
  const suppressClickUntil = useRef(0);
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

  const moveBy = useCallback((delta: number) => {
    if (realCount < 2) return;
    setActiveIndex((current) => modulo(current + delta, realCount));
  }, [realCount]);

  useEffect(() => {
    if (realCount < 2 || paused) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const timer = window.setInterval(() => {
      if (!document.hidden) setActiveIndex((current) => modulo(current + 1, realCount));
    }, AUTOPLAY_DELAY_MS);

    return () => window.clearInterval(timer);
  }, [paused, realCount]);

  useEffect(() => {
    const element = carouselRef.current;
    if (!element) return;

    const resetDragVisual = () => {
      element.style.setProperty('--hero-drag-x', '0px');
      element.classList.remove('is-dragging');
    };

    const handlePointerDown = (event: globalThis.PointerEvent) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      if (event.target instanceof Element && event.target.closest('button')) return;
      pointerState.current = { pointerId: event.pointerId, startX: event.clientX, deltaX: 0, moved: false };
      element.setPointerCapture?.(event.pointerId);
      setPaused(true);
    };

    const handlePointerMove = (event: globalThis.PointerEvent) => {
      const pointer = pointerState.current;
      if (!pointer || pointer.pointerId !== event.pointerId) return;

      pointer.deltaX = event.clientX - pointer.startX;
      if (!pointer.moved && Math.abs(pointer.deltaX) < DRAG_START_THRESHOLD_PX) return;

      pointer.moved = true;
      element.classList.add('is-dragging');
      const limitedOffset = Math.max(-180, Math.min(180, pointer.deltaX));
      element.style.setProperty('--hero-drag-x', `${limitedOffset}px`);
      event.preventDefault();
    };

    const finishPointer = (event: globalThis.PointerEvent) => {
      const pointer = pointerState.current;
      if (!pointer || pointer.pointerId !== event.pointerId) return;
      pointerState.current = null;
      if (element.hasPointerCapture?.(event.pointerId)) element.releasePointerCapture(event.pointerId);

      const distance = pointer.deltaX;
      resetDragVisual();
      setPaused(false);

      if (pointer.moved) suppressClickUntil.current = performance.now() + 350;
      if (distance <= -SWIPE_THRESHOLD_PX) moveBy(1);
      else if (distance >= SWIPE_THRESHOLD_PX) moveBy(-1);
    };

    const handlePointerCancel = (event: globalThis.PointerEvent) => {
      if (pointerState.current?.pointerId !== event.pointerId) return;
      pointerState.current = null;
      resetDragVisual();
      setPaused(false);
    };

    const handleClickCapture = (event: MouseEvent) => {
      if (performance.now() >= suppressClickUntil.current) return;
      event.preventDefault();
      event.stopPropagation();
      suppressClickUntil.current = 0;
    };

    const pause = () => setPaused(true);
    const resume = () => {
      if (!pointerState.current) setPaused(false);
    };

    element.addEventListener('pointerdown', handlePointerDown);
    element.addEventListener('pointermove', handlePointerMove, { passive: false });
    element.addEventListener('pointerup', finishPointer);
    element.addEventListener('pointercancel', handlePointerCancel);
    element.addEventListener('click', handleClickCapture, true);
    element.addEventListener('mouseenter', pause);
    element.addEventListener('mouseleave', resume);
    element.addEventListener('focusin', pause);
    element.addEventListener('focusout', resume);

    return () => {
      element.removeEventListener('pointerdown', handlePointerDown);
      element.removeEventListener('pointermove', handlePointerMove);
      element.removeEventListener('pointerup', finishPointer);
      element.removeEventListener('pointercancel', handlePointerCancel);
      element.removeEventListener('click', handleClickCapture, true);
      element.removeEventListener('mouseenter', pause);
      element.removeEventListener('mouseleave', resume);
      element.removeEventListener('focusin', pause);
      element.removeEventListener('focusout', resume);
    };
  }, [moveBy]);

  if (!showPromotion || realCount === 0) return null;

  return (
    <section
      ref={carouselRef}
      className="reference-hero-carousel"
      aria-label="โปรโมชั่นแนะนำ"
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
