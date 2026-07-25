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

// Exact source order from the inspected NOAH345 desktop Swiper.
// Index 0 starts in the centre, with index 10 on the left and index 1 on the right.
const SOURCE_BANNERS: CmsBanner[] = [
  {
    title: 'NOAH345 Banner 01',
    imageUrl: 'https://cdn.zabbet.com/FEZX/imageslides/1784894399570-2ba3393c-2988-4971-834b-86bbe275d0bb.jpg',
    href: '/promotions',
    enabled: true,
  },
  {
    title: 'NOAH345 Banner 02',
    imageUrl: 'https://cdn.zabbet.com/FEZX/imageslides/1784894972162-da9eaece-7402-4bb6-813f-7a83dc2925c2.jpg',
    href: '/promotions',
    enabled: true,
  },
  {
    title: 'NOAH345 Banner 03',
    imageUrl: 'https://cdn.zabbet.com/FEZX/imageslides/1784895027990-67f1beb1-8c13-4582-b6ff-dbb647773c9a.jpg',
    href: '/promotions',
    enabled: true,
  },
  {
    title: 'NOAH345 Banner 04',
    imageUrl: 'https://cdn.zabbet.com/FEZX/imageslides/1784895081838-4f8ccf22-9b17-4157-900f-0b78f883d69d.jpg',
    href: '/promotions',
    enabled: true,
  },
  {
    title: 'NOAH345 Banner 05',
    imageUrl: 'https://cdn.zabbet.com/FEZX/imageslides/1784895118089-b5159a76-a1b4-491e-81d0-e0d3f27d3818.jpg',
    href: '/promotions',
    enabled: true,
  },
  {
    title: 'NOAH345 Banner 06',
    imageUrl: 'https://cdn.zabbet.com/FEZX/imageslides/1784470530271-94bf2de8-a759-4e02-8af9-bbd08a398208.jpg',
    href: '/promotions',
    enabled: true,
  },
  {
    title: 'NOAH345 Banner 07',
    imageUrl: 'https://cdn.zabbet.com/FEZX/imageslides/1782914061717-d7de2072-63f1-4dd5-95f6-8628990ba631.jpg',
    href: '/promotions',
    enabled: true,
  },
  {
    title: 'NOAH345 Banner 08',
    imageUrl: 'https://cdn.zabbet.com/FEZX/imageslides/1782990586367-b41e5c36-0d4d-4e7c-80ed-bb145a2e3a77.jpg',
    href: '/promotions',
    enabled: true,
  },
  {
    title: 'NOAH345 Banner 09',
    imageUrl: 'https://cdn.zabbet.com/FEZX/imageslides/1782630857612-4098241f-e70d-4a32-b41b-623d74b974b6.jpg',
    href: '/promotions',
    enabled: true,
  },
  {
    title: 'NOAH345 Banner 10',
    imageUrl: 'https://cdn.zabbet.com/FEZX/imageslides/1780250534847-0b47bd80-15a3-4117-bdd3-f383308509bc.jpg',
    href: '/promotions',
    enabled: true,
  },
  {
    title: 'NOAH345 Banner 11',
    imageUrl: 'https://cdn.zabbet.com/FEZX/imageslides/1778979600098-3be41f05-c93f-4c12-b278-54cfe390de4c.jpg',
    href: '/promotion',
    enabled: true,
  },
];

export function DesktopHeroCarousel({ siteName, showPromotion }: DesktopHeroCarouselProps) {
  const slides = useMemo<HeroSlide[]>(
    () => SOURCE_BANNERS.map((banner, realIndex) => ({
      banner,
      imageUrl: banner.imageUrl || '',
      realIndex,
    })).filter((slide) => Boolean(slide.imageUrl)),
    [],
  );

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
        loading={isActive ? 'eager' : 'lazy'}
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
