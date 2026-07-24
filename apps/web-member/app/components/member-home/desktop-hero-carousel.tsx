'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
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

const AUTOPLAY_DELAY_MS = 4200;

export function DesktopHeroCarousel({ content, siteName, showPromotion }: DesktopHeroCarouselProps) {
  const slides = useMemo<HeroSlide[]>(() => {
    const enabledBanners = Array.isArray(content.banners)
      ? content.banners.filter((banner) => banner?.enabled)
      : [];

    return enabledBanners.flatMap((banner, realIndex) => {
      const imageUrl = normalizeUrl(banner.imageUrl || resolveCmsAssetById(content, banner.assetId));
      return imageUrl ? [{ banner, imageUrl, realIndex }] : [];
    });
  }, [content]);

  const loopSlides = useMemo(() => {
    if (slides.length < 2) return slides;
    return [slides[slides.length - 1]!, ...slides, slides[0]!];
  }, [slides]);

  const [position, setPosition] = useState(slides.length > 1 ? 1 : 0);
  const [transitionEnabled, setTransitionEnabled] = useState(true);
  const [paused, setPaused] = useState(false);
  const [dragging, setDragging] = useState(false);
  const maskRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const positionRef = useRef(position);
  const dragRef = useRef({ pointerId: -1, startX: 0, deltaX: 0 });
  const realCount = slides.length;
  const activeIndex = realCount > 1 ? modulo(position - 1, realCount) : 0;

  const centerCurrentSlide = useCallback((animate: boolean, extraOffset = 0) => {
    const mask = maskRef.current;
    const track = trackRef.current;
    const slide = track?.children.item(positionRef.current) as HTMLElement | null;
    if (!mask || !track || !slide) return;

    const offset = (mask.clientWidth / 2) - (slide.offsetLeft + slide.offsetWidth / 2) + extraOffset;
    track.style.transition = animate ? '' : 'none';
    track.style.transform = `translate3d(${offset}px, 0, 0)`;
  }, []);

  useLayoutEffect(() => {
    positionRef.current = position;
    centerCurrentSlide(transitionEnabled && !dragging);
  }, [centerCurrentSlide, dragging, position, transitionEnabled]);

  useEffect(() => {
    if (slides.length > 1) {
      setTransitionEnabled(false);
      setPosition(1);
    } else {
      setPosition(0);
    }
  }, [slides.length]);

  useEffect(() => {
    if (transitionEnabled) return;
    const frame = window.requestAnimationFrame(() => setTransitionEnabled(true));
    return () => window.cancelAnimationFrame(frame);
  }, [transitionEnabled]);

  useEffect(() => {
    const mask = maskRef.current;
    if (!mask || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => centerCurrentSlide(false));
    observer.observe(mask);
    return () => observer.disconnect();
  }, [centerCurrentSlide]);

  useEffect(() => {
    if (realCount < 2 || paused) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const timer = window.setInterval(() => {
      if (!document.hidden) setPosition((current) => current + 1);
    }, AUTOPLAY_DELAY_MS);

    return () => window.clearInterval(timer);
  }, [paused, realCount]);

  useEffect(() => {
    const onVisibilityChange = () => setPaused(document.hidden);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []);

  if (!showPromotion || realCount === 0) return null;

  function goTo(realIndex: number) {
    setTransitionEnabled(true);
    setPosition(realCount > 1 ? realIndex + 1 : 0);
  }

  function moveBy(delta: number) {
    if (realCount < 2) return;
    setTransitionEnabled(true);
    setPosition((current) => current + delta);
  }

  function handleTransitionEnd(event: React.TransitionEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget || realCount < 2) return;
    if (positionRef.current === 0) {
      setTransitionEnabled(false);
      setPosition(realCount);
    } else if (positionRef.current === realCount + 1) {
      setTransitionEnabled(false);
      setPosition(1);
    }
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (realCount < 2 || (event.pointerType === 'mouse' && event.button !== 0)) return;
    dragRef.current = { pointerId: event.pointerId, startX: event.clientX, deltaX: 0 };
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setPaused(true);
    setDragging(true);
    centerCurrentSlide(false);
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!dragging || event.pointerId !== drag.pointerId) return;
    drag.deltaX = event.clientX - drag.startX;
    centerCurrentSlide(false, drag.deltaX);
  }

  function finishPointer(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!dragging || event.pointerId !== drag.pointerId) return;

    event.currentTarget.releasePointerCapture?.(event.pointerId);
    const activeSlide = trackRef.current?.children.item(positionRef.current) as HTMLElement | null;
    const threshold = Math.min(110, (activeSlide?.offsetWidth || 710.5) * 0.16);
    const direction = drag.deltaX <= -threshold ? 1 : drag.deltaX >= threshold ? -1 : 0;

    dragRef.current = { pointerId: -1, startX: 0, deltaX: 0 };
    setDragging(false);
    setPaused(false);
    if (direction) moveBy(direction);
    else centerCurrentSlide(true);
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

  return (
    <section
      className="reference-hero-carousel"
      aria-label="โปรโมชั่นแนะนำ"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="reference-hero-mask" ref={maskRef}>
        <div
          ref={trackRef}
          className={`reference-hero-track${dragging ? ' is-dragging' : ''}${transitionEnabled ? '' : ' is-jumping'}`}
          onTransitionEnd={handleTransitionEnd}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishPointer}
          onPointerCancel={finishPointer}
          onDragStart={(event) => event.preventDefault()}
        >
          {loopSlides.map((slide, index) => (
            <a
              key={`${slide.realIndex}-${index}`}
              href={slide.banner.href || '/promotions'}
              className={`reference-hero-slide${index === position ? ' is-active' : ''}`}
              aria-label={slide.banner.title || `โปรโมชั่น ${slide.realIndex + 1}`}
              aria-hidden={index === position ? undefined : true}
              tabIndex={index === position ? 0 : -1}
            >
              <img
                src={slide.imageUrl}
                alt={slide.banner.title || siteName}
                draggable={false}
                onError={hideBrokenImage}
              />
            </a>
          ))}
        </div>
      </div>

      {realCount > 1 ? (
        <div className="reference-hero-pagination" aria-label="เลือกแบนเนอร์">
          {slides.map((slide, index) => (
            <button
              key={`${slide.realIndex}-${slide.imageUrl}`}
              type="button"
              className={index === activeIndex ? 'is-active' : ''}
              onClick={() => goTo(index)}
              aria-label={`แบนเนอร์ ${index + 1}`}
              aria-current={index === activeIndex ? 'true' : undefined}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

function resolveCmsAssetById(content: CmsContent, assetId?: string) {
  return assetId ? content.assets?.find((asset) => asset.enabled && asset.id === assetId)?.url || '' : '';
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
