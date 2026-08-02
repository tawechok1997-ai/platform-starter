'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent as ReactFocusEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { useMemberLocale, type MemberLocale } from '../../member-locale-provider';
import { cmsResponsiveMediaUrls, type CmsContent } from '../../site-settings';

type CmsBanner = CmsContent['banners'][number];

type HeroSlide = {
  banner: CmsBanner;
  desktopImageUrl: string;
  mobileImageUrl: string;
  fallbackImageUrl: string;
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
  '--hero-drag-x': string;
  '--hero-transition': string;
};

const AUTOPLAY_DELAY_MS = 5000;
const TRANSITION_MS = 480;
const SWIPE_THRESHOLD_PX = 48;
const DRAG_START_THRESHOLD_PX = 4;
const SLIDE_WIDTH_PX = 710.5;
const SLIDE_GAP_PX = 10;
const SLIDE_STEP_PX = SLIDE_WIDTH_PX + SLIDE_GAP_PX;
const SOURCE_RAIL_WIDTH_PX = 2180;
const SOURCE_INITIAL_SLIDE_INDEX = 4;
const IMAGE_RETRY_LIMIT = 1;

const HERO_COPY: Record<MemberLocale, {
  region: string;
  pagination: string;
  banner: string;
  previous: string;
  next: string;
  missingTitle: string;
  missingHint: string;
}> = {
  th: {
    region: 'โปรโมชั่นแนะนำ',
    pagination: 'เลือกแบนเนอร์',
    banner: 'แบนเนอร์',
    previous: 'แบนเนอร์ก่อนหน้า',
    next: 'แบนเนอร์ถัดไป',
    missingTitle: 'ไม่พบรูปโปรโมชั่น',
    missingHint: 'ตรวจรูปในศูนย์เนื้อหา',
  },
  en: {
    region: 'Featured promotions',
    pagination: 'Choose a banner',
    banner: 'Banner',
    previous: 'Previous banner',
    next: 'Next banner',
    missingTitle: 'Promotion image unavailable',
    missingHint: 'Check the image in Content Center',
  },
};

const SOURCE_IMAGE_URLS = [
  '/assets/asset-pc/images/FEZX/imageslides/1778979600098-3be41f05-c93f-4c12-b278-54cfe390de4c.jpg',
  '/assets/asset-pc/images/FEZX/imageslides/1780250534847-0b47bd80-15a3-4117-bdd3-f383308509bc.jpg',
  '/assets/asset-pc/images/FEZX/imageslides/1782630857612-4098241f-e70d-4a32-b41b-623d74b974b6.jpg',
  '/assets/asset-pc/images/FEZX/imageslides/1782914061717-d7de2072-63f1-4dd5-95f6-8628990ba631.jpg',
  '/assets/asset-pc/images/FEZX/imageslides/1782990586367-b41e5c36-0d4d-4e7c-80ed-bb145a2e3a77.jpg',
  '/assets/asset-pc/images/FEZX/imageslides/1783665647358-f637b660-a3e9-46e3-989d-a62654566985.jpg',
  '/assets/asset-pc/images/FEZX/imageslides/1784196704798-2fc7e5da-8d52-42a1-8a40-4f0f0465a264.jpg',
] as const;

const SOURCE_BANNERS: CmsBanner[] = SOURCE_IMAGE_URLS.map((imageUrl, index) => ({
  id: `fallback-banner-${index + 1}`,
  title: `NOAH345 Banner ${String(index + 1).padStart(2, '0')}`,
  subtitle: 'NOAH345',
  imageUrl,
  desktopImageUrl: imageUrl,
  mobileImageUrl: imageUrl,
  href: index === SOURCE_IMAGE_URLS.length - 1 ? '/browse/promotions' : '/',
  enabled: true,
  lifecycle: 'published',
}));

const MISSING_ASSET_STYLE: CSSProperties = {
  display: 'grid',
  placeItems: 'center',
  width: '100%',
  height: '100%',
  border: '1px dashed rgba(224, 92, 255, .72)',
  borderRadius: 10,
  color: '#efc9ff',
  background: 'linear-gradient(135deg, #211428, #110d17)',
  fontSize: 14,
  fontWeight: 800,
  letterSpacing: '.03em',
  lineHeight: 1.5,
  textAlign: 'center',
};

export function DesktopHeroCarousel({ content, siteName, showPromotion }: DesktopHeroCarouselProps) {
  const { locale } = useMemberLocale();
  const copy = HERO_COPY[locale];
  const slides = useMemo<HeroSlide[]>(() => {
    const cmsBanners = Array.isArray(content?.banners)
      ? content.banners.filter((banner) => {
        if (banner?.enabled === false || banner?.lifecycle === 'draft' || banner?.lifecycle === 'archived') return false;
        const urls = cmsResponsiveMediaUrls(content, banner);
        return Boolean(urls.desktop || urls.mobile || urls.legacy);
      })
      : [];
    const banners = cmsBanners.length ? cmsBanners : SOURCE_BANNERS;
    return banners.map((banner, realIndex) => {
      const urls = cmsResponsiveMediaUrls(content, banner);
      const fallbackImageUrl = SOURCE_IMAGE_URLS[realIndex % SOURCE_IMAGE_URLS.length] ?? SOURCE_IMAGE_URLS[0];
      return {
        banner,
        desktopImageUrl: urls.desktop || fallbackImageUrl,
        mobileImageUrl: urls.mobile || urls.desktop || fallbackImageUrl,
        fallbackImageUrl,
        realIndex,
      };
    });
  }, [content]);
  const realCount = slides.length;
  const loopSlides = useMemo(() => [...slides, ...slides, ...slides], [slides]);
  const [virtualIndex, setVirtualIndex] = useState(realCount + SOURCE_INITIAL_SLIDE_INDEX);
  const [transitionEnabled, setTransitionEnabled] = useState(true);
  const [dragX, setDragX] = useState(0);
  const [hasFocus, setHasFocus] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const pointerState = useRef<PointerState | null>(null);
  const suppressClickUntil = useRef(0);
  const normalizedActiveIndex = realCount ? modulo(virtualIndex, realCount) : 0;
  const autoplayPaused = hasFocus || isDragging || reducedMotion;

  useEffect(() => {
    if (!realCount) return;
    setTransitionEnabled(false);
    setVirtualIndex(realCount + Math.min(SOURCE_INITIAL_SLIDE_INDEX, realCount - 1));
    window.requestAnimationFrame(() => setTransitionEnabled(true));
  }, [realCount]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReducedMotion(media.matches);
    sync();
    media.addEventListener?.('change', sync);
    return () => media.removeEventListener?.('change', sync);
  }, []);

  const offsetPx = SOURCE_RAIL_WIDTH_PX / 2 - (virtualIndex * SLIDE_STEP_PX + SLIDE_WIDTH_PX / 2);
  const trackStyle: HeroTrackStyle = {
    '--hero-track-x': `${offsetPx}px`,
    '--hero-drag-x': `${dragX}px`,
    '--hero-transition': transitionEnabled && !reducedMotion
      ? `transform ${TRANSITION_MS}ms cubic-bezier(.22,.61,.36,1)`
      : 'none',
  };

  const moveBy = useCallback((delta: number) => {
    if (realCount < 2) return;
    setTransitionEnabled(true);
    setVirtualIndex((current) => current + delta);
  }, [realCount]);

  const jumpTo = useCallback((realIndex: number) => {
    setTransitionEnabled(true);
    setVirtualIndex(realCount + realIndex);
  }, [realCount]);

  useEffect(() => {
    if (realCount < 2 || autoplayPaused) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) moveBy(1);
    }, AUTOPLAY_DELAY_MS);
    return () => window.clearInterval(timer);
  }, [autoplayPaused, moveBy, realCount]);

  const normalizeLoopPosition = useCallback(() => {
    if (virtualIndex >= realCount * 2) {
      setTransitionEnabled(false);
      setVirtualIndex((current) => current - realCount);
      window.requestAnimationFrame(() => window.requestAnimationFrame(() => setTransitionEnabled(true)));
    } else if (virtualIndex < realCount) {
      setTransitionEnabled(false);
      setVirtualIndex((current) => current + realCount);
      window.requestAnimationFrame(() => window.requestAnimationFrame(() => setTransitionEnabled(true)));
    }
  }, [realCount, virtualIndex]);

  useEffect(() => {
    if (realCount < 2 || (virtualIndex >= realCount && virtualIndex < realCount * 2)) return;
    const timer = window.setTimeout(normalizeLoopPosition, reducedMotion ? 0 : TRANSITION_MS + 80);
    return () => window.clearTimeout(timer);
  }, [normalizeLoopPosition, realCount, reducedMotion, virtualIndex]);

  const onPointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    if (event.target instanceof Element && event.target.closest('button')) return;
    pointerState.current = { pointerId: event.pointerId, startX: event.clientX, deltaX: 0, moved: false };
    setIsDragging(true);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    const pointer = pointerState.current;
    if (!pointer || pointer.pointerId !== event.pointerId) return;
    pointer.deltaX = event.clientX - pointer.startX;
    if (!pointer.moved && Math.abs(pointer.deltaX) < DRAG_START_THRESHOLD_PX) return;
    pointer.moved = true;
    setTransitionEnabled(false);
    setDragX(Math.max(-260, Math.min(260, pointer.deltaX)));
    event.preventDefault();
  };

  const finishPointer = (event: ReactPointerEvent<HTMLElement>) => {
    const pointer = pointerState.current;
    if (!pointer || pointer.pointerId !== event.pointerId) return;
    pointerState.current = null;
    setIsDragging(false);
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    setDragX(0);
    setTransitionEnabled(true);
    if (pointer.moved) suppressClickUntil.current = performance.now() + 350;
    if (pointer.deltaX <= -SWIPE_THRESHOLD_PX) moveBy(1);
    else if (pointer.deltaX >= SWIPE_THRESHOLD_PX) moveBy(-1);
  };

  const cancelPointer = () => {
    pointerState.current = null;
    setIsDragging(false);
    setDragX(0);
    setTransitionEnabled(true);
  };

  const suppressDraggedClick = (event: ReactMouseEvent<HTMLElement>) => {
    if (performance.now() >= suppressClickUntil.current) return;
    event.preventDefault();
    event.stopPropagation();
    suppressClickUntil.current = 0;
  };

  const onBlurCapture = (event: ReactFocusEvent<HTMLElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setHasFocus(false);
  };

  if (!showPromotion || realCount === 0) return null;

  return <section
    className="reference-hero-carousel"
    aria-label={copy.region}
    aria-roledescription="carousel"
    onFocusCapture={() => setHasFocus(true)}
    onBlurCapture={onBlurCapture}
    onPointerDown={onPointerDown}
    onPointerMove={onPointerMove}
    onPointerUp={finishPointer}
    onPointerCancel={cancelPointer}
    onLostPointerCapture={cancelPointer}
    onClickCapture={suppressDraggedClick}
  >
    <div className="reference-hero-mask"><div className="reference-hero-rail"><div className="reference-hero-track" style={trackStyle} onTransitionEnd={normalizeLoopPosition}>
      {loopSlides.map((slide, index) => {
        const distance = index - virtualIndex;
        const role = distance === 0 ? 'active' : distance === -1 ? 'previous' : distance === 1 ? 'next' : 'offscreen';
        return <HeroSlideCard key={`${index}-${slide.realIndex}-${slide.desktopImageUrl}-${slide.mobileImageUrl}`} role={role} slide={slide} siteName={siteName} copy={copy} />;
      })}
    </div></div></div>

    {realCount > 1 ? (
      <>
        <button type="button" className="reference-hero-arrow reference-hero-arrow--previous" onClick={() => moveBy(-1)} aria-label={copy.previous}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <button type="button" className="reference-hero-arrow reference-hero-arrow--next" onClick={() => moveBy(1)} aria-label={copy.next}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="9 18 15 12 9 6" /></svg>
        </button>
      </>
    ) : null}

    <div className="reference-hero-pagination" aria-label={copy.pagination}>
      {slides.map((slide, index) => <button key={`${slide.realIndex}-${slide.desktopImageUrl}`} type="button" className={index === normalizedActiveIndex ? 'is-active' : ''} onClick={() => jumpTo(index)} aria-label={`${copy.banner} ${index + 1}`} aria-current={index === normalizedActiveIndex ? 'true' : undefined} />)}
    </div>
  </section>;
}

function HeroSlideCard({
  role,
  slide,
  siteName,
  copy,
}: {
  role: 'previous' | 'active' | 'next' | 'offscreen';
  slide: HeroSlide;
  siteName: string;
  copy: typeof HERO_COPY[MemberLocale];
}) {
  const [attempt, setAttempt] = useState(0);
  const [usingFallback, setUsingFallback] = useState(false);
  const [missing, setMissing] = useState(false);
  const isActive = role === 'active';
  const isAdjacent = role === 'previous' || role === 'next';

  useEffect(() => {
    setAttempt(0);
    setUsingFallback(false);
    setMissing(false);
  }, [slide.desktopImageUrl, slide.mobileImageUrl]);

  const sourceDesktop = usingFallback ? slide.fallbackImageUrl : slide.desktopImageUrl;
  const sourceMobile = usingFallback ? slide.fallbackImageUrl : slide.mobileImageUrl;
  const retrySuffix = attempt > 0 ? `${sourceDesktop.includes('?') ? '&' : '?'}hero_retry=${attempt}` : '';
  const desktopImageUrl = `${sourceDesktop}${retrySuffix}`;
  const mobileRetrySuffix = attempt > 0 ? `${sourceMobile.includes('?') ? '&' : '?'}hero_retry=${attempt}` : '';
  const mobileImageUrl = `${sourceMobile}${mobileRetrySuffix}`;

  const handleImageError = () => {
    if (attempt < IMAGE_RETRY_LIMIT) {
      window.setTimeout(() => setAttempt((current) => current + 1), 500 * (attempt + 1));
      return;
    }
    if (!usingFallback && sourceDesktop !== slide.fallbackImageUrl) {
      setAttempt(0);
      setUsingFallback(true);
      return;
    }
    setMissing(true);
  };

  return <a
    href={slide.banner.href || '/browse/promotions'}
    className={`reference-hero-slide reference-hero-slide--${role}${isActive ? ' is-active' : ''}`}
    aria-label={slide.banner.title || `${copy.banner} ${slide.realIndex + 1}`}
    inert={isActive ? undefined : true}
    tabIndex={isActive ? 0 : -1}
  >
    {missing ? <span style={MISSING_ASSET_STYLE}>{copy.missingTitle}<br />{copy.missingHint}</span> : <picture>
      <source media="(max-width: 640px)" srcSet={mobileImageUrl} />
      <img
        src={desktopImageUrl}
        alt={slide.banner.title || siteName}
        draggable={false}
        loading={isActive || isAdjacent ? 'eager' : 'lazy'}
        fetchPriority={isActive ? 'high' : 'low'}
        decoding="async"
        onError={handleImageError}
      />
    </picture>}
  </a>;
}

function modulo(value: number, divisor: number) {
  return ((value % divisor) + divisor) % divisor;
}