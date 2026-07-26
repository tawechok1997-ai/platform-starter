'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
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

type PointerState = {
  pointerId: number;
  startX: number;
  deltaX: number;
  moved: boolean;
};

type HeroTrackStyle = CSSProperties & {
  '--hero-track-x': string;
  '--hero-transition': string;
};

const AUTOPLAY_DELAY_MS = 3000;
const TRANSITION_MS = 480;
const SWIPE_THRESHOLD_PX = 48;
const DRAG_START_THRESHOLD_PX = 4;
const SLIDE_WIDTH_PX = 710.5;
const SLIDE_GAP_PX = 10;
const SLIDE_STEP_PX = SLIDE_WIDTH_PX + SLIDE_GAP_PX;
const SOURCE_RAIL_WIDTH_PX = 2180;
const SOURCE_INITIAL_SLIDE_INDEX = 2;

// Exact source order from the inspected NOAH345 desktop Swiper.
const SOURCE_IMAGE_URLS = [
  'https://cdn.zabbet.com/FEZX/imageslides/1784894399570-2ba3393c-2988-4971-834b-86bbe275d0bb.jpg',
  'https://cdn.zabbet.com/FEZX/imageslides/1784894972162-da9eaece-7402-4bb6-813f-7a83dc2925c2.jpg',
  'https://cdn.zabbet.com/FEZX/imageslides/1784895027990-67f1beb1-8c13-4582-b6ff-dbb647773c9a.jpg',
  'https://cdn.zabbet.com/FEZX/imageslides/1784895081838-4f8ccf22-9b17-4157-900f-0b78f883d69d.jpg',
  'https://cdn.zabbet.com/FEZX/imageslides/1784895118089-b5159a76-a1b4-491e-81d0-e0d3f27d3818.jpg',
  'https://cdn.zabbet.com/FEZX/imageslides/1784470530271-94bf2de8-a759-4e02-8af9-bbd08a398208.jpg',
  'https://cdn.zabbet.com/FEZX/imageslides/1782914061717-d7de2072-63f1-4dd5-95f6-8628990ba631.jpg',
  'https://cdn.zabbet.com/FEZX/imageslides/1782990586367-b41e5c36-0d4d-4e7c-80ed-bb145a2e3a77.jpg',
  'https://cdn.zabbet.com/FEZX/imageslides/1782630857612-4098241f-e70d-4a32-b41b-623d74b974b6.jpg',
  'https://cdn.zabbet.com/FEZX/imageslides/1780250534847-0b47bd80-15a3-4117-bdd3-f383308509bc.jpg',
  'https://cdn.zabbet.com/FEZX/imageslides/1778979600098-3be41f05-c93f-4c12-b278-54cfe390de4c.jpg',
] as const;

const SOURCE_BANNERS: CmsBanner[] = SOURCE_IMAGE_URLS.map((imageUrl, index) => ({
  title: `NOAH345 Banner ${String(index + 1).padStart(2, '0')}`,
  subtitle: 'NOAH345',
  imageUrl,
  href: index === 10 ? '/promotions' : '/',
  enabled: true,
}));

export function DesktopHeroCarousel({ siteName, showPromotion }: DesktopHeroCarouselProps) {
  const slides = useMemo<HeroSlide[]>(
    () => SOURCE_BANNERS.map((banner, realIndex) => ({ banner, imageUrl: banner.imageUrl, realIndex })),
    [],
  );
  const realCount = slides.length;
  const loopSlides = useMemo(() => [...slides, ...slides, ...slides], [slides]);
  const [virtualIndex, setVirtualIndex] = useState(realCount + SOURCE_INITIAL_SLIDE_INDEX);
  const [animate, setAnimate] = useState(true);
  const [paused, setPaused] = useState(false);
  const carouselRef = useRef<HTMLElement | null>(null);
  const pointerState = useRef<PointerState | null>(null);
  const suppressClickUntil = useRef(0);
  const normalizedActiveIndex = realCount ? modulo(virtualIndex, realCount) : 0;

  const offsetPx = SOURCE_RAIL_WIDTH_PX / 2 - (virtualIndex * SLIDE_STEP_PX + SLIDE_WIDTH_PX / 2);
  const trackStyle: HeroTrackStyle = {
    '--hero-track-x': `${offsetPx}px`,
    '--hero-transition': animate
      ? `transform ${TRANSITION_MS}ms cubic-bezier(.22,.61,.36,1)`
      : 'none',
  };

  const moveBy = useCallback((delta: number) => {
    if (realCount < 2) return;
    setAnimate(true);
    setVirtualIndex((current) => current + delta);
  }, [realCount]);

  const jumpTo = useCallback((realIndex: number) => {
    setAnimate(true);
    setPaused(false);
    setVirtualIndex(realCount + realIndex);
  }, [realCount]);

  // Re-arm after every completed move. This avoids an interval getting stuck after
  // drag, tab visibility changes, or a missed pointer-up event.
  useEffect(() => {
    if (realCount < 2 || paused) return;

    const timer = window.setTimeout(() => {
      moveBy(1);
    }, AUTOPLAY_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [moveBy, paused, realCount, virtualIndex]);

  useEffect(() => {
    const element = carouselRef.current;
    if (!element) return;

    const resetDragVisual = () => {
      element.style.setProperty('--hero-drag-x', '0px');
      element.classList.remove('is-dragging');
    };

    const releaseInteraction = () => {
      pointerState.current = null;
      resetDragVisual();
      setPaused(false);
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
      const limitedOffset = Math.max(-220, Math.min(220, pointer.deltaX));
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

    const cancelPointer = (event: globalThis.PointerEvent) => {
      if (pointerState.current?.pointerId !== event.pointerId) return;
      releaseInteraction();
    };

    const suppressDraggedClick = (event: MouseEvent) => {
      if (performance.now() >= suppressClickUntil.current) return;
      event.preventDefault();
      event.stopPropagation();
      suppressClickUntil.current = 0;
    };

    element.addEventListener('pointerdown', handlePointerDown);
    element.addEventListener('pointermove', handlePointerMove, { passive: false });
    element.addEventListener('pointerup', finishPointer);
    element.addEventListener('pointercancel', cancelPointer);
    element.addEventListener('lostpointercapture', releaseInteraction);
    element.addEventListener('click', suppressDraggedClick, true);
    window.addEventListener('blur', releaseInteraction);

    return () => {
      element.removeEventListener('pointerdown', handlePointerDown);
      element.removeEventListener('pointermove', handlePointerMove);
      element.removeEventListener('pointerup', finishPointer);
      element.removeEventListener('pointercancel', cancelPointer);
      element.removeEventListener('lostpointercapture', releaseInteraction);
      element.removeEventListener('click', suppressDraggedClick, true);
      window.removeEventListener('blur', releaseInteraction);
    };
  }, [moveBy]);

  const normalizeLoopPosition = useCallback(() => {
    if (virtualIndex >= realCount * 2) {
      setAnimate(false);
      setVirtualIndex((current) => current - realCount);
      window.requestAnimationFrame(() => window.requestAnimationFrame(() => setAnimate(true)));
    } else if (virtualIndex <= 0) {
      setAnimate(false);
      setVirtualIndex((current) => current + realCount);
      window.requestAnimationFrame(() => window.requestAnimationFrame(() => setAnimate(true)));
    }
  }, [realCount, virtualIndex]);

  if (!showPromotion || realCount === 0) return null;

  return (
    <section
      ref={carouselRef}
      className="reference-hero-carousel"
      aria-label="โปรโมชั่นแนะนำ"
      data-active-slide={normalizedActiveIndex}
    >
      <div className="reference-hero-mask">
        <div className="reference-hero-rail">
          <div
            className="reference-hero-track"
            style={trackStyle}
            onTransitionEnd={normalizeLoopPosition}
          >
            {loopSlides.map((slide, index) => {
              const distance = index - virtualIndex;
              const role = distance === 0 ? 'active' : distance === -1 ? 'previous' : distance === 1 ? 'next' : 'offscreen';
              return (
                <HeroSlideCard
                  key={`${index}-${slide.realIndex}-${slide.imageUrl}`}
                  role={role}
                  slide={slide}
                  siteName={siteName}
                />
              );
            })}
          </div>
        </div>
      </div>

      <div className="reference-hero-pagination" aria-label="เลือกแบนเนอร์">
        {slides.map((slide, index) => (
          <button
            key={`${slide.realIndex}-${slide.imageUrl}`}
            type="button"
            className={index === normalizedActiveIndex ? 'is-active' : ''}
            onClick={() => jumpTo(index)}
            aria-label={`แบนเนอร์ ${index + 1}`}
            aria-current={index === normalizedActiveIndex ? 'true' : undefined}
          />
        ))}
      </div>
    </section>
  );
}

function HeroSlideCard({ role, slide, siteName }: {
  role: 'previous' | 'active' | 'next' | 'offscreen';
  slide: HeroSlide;
  siteName: string;
}) {
  const isActive = role === 'active';
  const isNear = role !== 'offscreen';
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
        loading={isNear ? 'eager' : 'lazy'}
        onError={hideBrokenImage}
      />
    </a>
  );
}

function modulo(value: number, divisor: number) {
  return ((value % divisor) + divisor) % divisor;
}

function hideBrokenImage(event: SyntheticEvent<HTMLImageElement>) {
  event.currentTarget.style.visibility = 'hidden';
}
