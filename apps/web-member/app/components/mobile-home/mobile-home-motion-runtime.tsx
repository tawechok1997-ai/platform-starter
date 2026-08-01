'use client';

import { useEffect } from 'react';

const HERO_SELECTOR = '[data-mobile-section-owner="hero"]';
const ANNOUNCEMENT_ICON_SELECTOR = '[data-mobile-section-owner="announcement"] > span:first-child';
const ANNOUNCEMENT_VIEWPORT_SELECTOR = '[data-mobile-announcement-viewport="true"]';
const ANNOUNCEMENT_TRACK_SELECTOR = '[data-mobile-announcement-track="true"]';
const ANNOUNCEMENT_SET_SELECTOR = '[data-mobile-announcement-set="true"]';
const ANNOUNCEMENT_SPEED_PX_PER_SECOND = 42;
const REDUCED_MOTION_SPEED_PX_PER_SECOND = 18;
const ANNOUNCEMENT_CANVAS_SIZE = 160;
const ANNOUNCEMENT_CANVAS_CSS_SIZE = 24;

const MEGAPHONE_BODY_PATH = 'M667.024 443.071C661.598 421.127 645.306 404.748 625.292 398.256C598.912 315.82 563.121 259.1 538.219 265.078C535.349 265.767 532.718 267.271 530.349 269.514L344.925 430.313L197.522 466.744C172.747 472.86 156.668 496.044 158.711 520.682C134.95 527.725 120.713 552.288 126.716 576.6C131.967 597.855 151.028 612.078 171.982 612.078C174.99 612.078 178.035 611.778 181.08 611.164C190.743 633.922 215.769 646.943 240.545 640.827L249.844 638.534L322.016 768.942C322.016 768.942 341.391 806.438 377.734 794.307C398.625 787.34 404.026 770.885 404.828 758.152C405.292 750.921 404.252 743.665 402.058 736.747L362.144 610.775L391.494 603.519L625.142 659.75C627.886 660.415 630.543 660.465 633.087 659.851C657.876 653.898 664.041 587.704 650.331 502.849C665.457 487.76 672.526 465.341 667.024 443.071Z';
const MEGAPHONE_TOP_RAY_PATH = 'M752.993 210.226C746.05 202.506 734.157 201.892 726.45 208.834L649.002 278.588C641.282 285.531 640.668 297.424 647.611 305.131C651.32 309.254 656.446 311.347 661.584 311.347C666.071 311.347 670.57 309.755 674.154 306.522L751.602 236.768C759.322 229.826 759.936 217.933 752.993 210.226Z';
const MEGAPHONE_MIDDLE_RAY_PATH = 'M855.492 402.872C853.136 392.759 843.035 386.467 832.921 388.824L734.382 411.72C724.268 414.076 717.977 424.176 720.321 434.29C722.339 442.975 730.071 448.84 738.618 448.84C740.021 448.84 741.462 448.677 742.891 448.351L841.431 425.455C851.544 423.099 857.835 412.998 855.492 402.884V402.872Z';
const MEGAPHONE_BOTTOM_RAY_PATH = 'M832.12 596.391L739.145 569.735C729.169 566.878 718.755 572.643 715.898 582.631C713.04 592.606 718.805 603.021 728.793 605.878L821.769 632.534C823.498 633.035 825.24 633.261 826.957 633.261C835.128 633.261 842.647 627.884 845.016 619.638C847.873 609.663 842.108 599.248 832.12 596.391Z';
const MEGAPHONE_BACK_PATH = 'M181.08 611.163C178.035 611.777 174.99 612.078 171.982 612.078C151.028 612.078 131.967 597.854 126.716 576.6C120.713 552.288 134.95 527.725 158.711 520.682C158.936 523.389 159.375 526.108 160.039 528.827L178.461 603.343C179.138 606.063 180.015 608.669 181.08 611.163Z';
const MEGAPHONE_HANDLE_PATH = 'M404.824 758.153C404.022 770.885 398.621 787.34 377.73 794.308C341.387 806.439 322.012 768.943 322.012 768.943L249.84 638.534L362.14 610.775L402.054 736.748C404.247 743.665 405.288 750.922 404.824 758.153Z';

type MobileHomeMotionRuntimeProps = {
  contentVersion: string;
};

export default function MobileHomeMotionRuntime({ contentVersion }: MobileHomeMotionRuntimeProps) {
  useEffect(() => {
    const cleanups: Array<() => void> = [];

    const hero = document.querySelector<HTMLElement>(HERO_SELECTOR);
    if (hero) cleanups.push(bindHeroSwipe(hero));

    const announcementIcon = document.querySelector<HTMLElement>(ANNOUNCEMENT_ICON_SELECTOR);
    if (announcementIcon) cleanups.push(installAnnouncementCanvas(announcementIcon));

    const announcementViewport = document.querySelector<HTMLElement>(ANNOUNCEMENT_VIEWPORT_SELECTOR);
    if (announcementViewport) cleanups.push(startAnnouncementTicker(announcementViewport));

    return () => {
      cleanups.reverse().forEach((cleanup) => cleanup());
    };
  }, [contentVersion]);

  return null;
}

function installAnnouncementCanvas(host: HTMLElement) {
  const sourceImage = host.querySelector<HTMLImageElement>('img');
  const existingCanvas = host.querySelector<HTMLCanvasElement>('canvas[data-source-announcement-canvas="true"]');
  if (existingCanvas) return () => undefined;
  if (typeof Path2D === 'undefined') return () => undefined;

  const canvas = document.createElement('canvas');
  canvas.width = ANNOUNCEMENT_CANVAS_SIZE;
  canvas.height = ANNOUNCEMENT_CANVAS_SIZE;
  canvas.dataset.sourceAnnouncementCanvas = 'true';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.display = 'block';
  canvas.style.width = `${ANNOUNCEMENT_CANVAS_CSS_SIZE}px`;
  canvas.style.height = `${ANNOUNCEMENT_CANVAS_CSS_SIZE}px`;

  const context = canvas.getContext('2d');
  if (!context) return () => undefined;

  try {
    drawAnnouncementMegaphone(context);
  } catch {
    return () => undefined;
  }

  const previousImageDisplay = sourceImage?.style.display ?? '';
  if (sourceImage) sourceImage.style.display = 'none';
  host.append(canvas);

  return () => {
    canvas.remove();
    if (sourceImage) sourceImage.style.display = previousImageDisplay;
  };
}

function drawAnnouncementMegaphone(context: CanvasRenderingContext2D) {
  const scale = ANNOUNCEMENT_CANVAS_SIZE / 1000;
  const body = new Path2D(MEGAPHONE_BODY_PATH);
  const topRay = new Path2D(MEGAPHONE_TOP_RAY_PATH);
  const middleRay = new Path2D(MEGAPHONE_MIDDLE_RAY_PATH);
  const bottomRay = new Path2D(MEGAPHONE_BOTTOM_RAY_PATH);
  const back = new Path2D(MEGAPHONE_BACK_PATH);
  const handle = new Path2D(MEGAPHONE_HANDLE_PATH);

  context.save();
  context.clearRect(0, 0, ANNOUNCEMENT_CANVAS_SIZE, ANNOUNCEMENT_CANVAS_SIZE);
  context.scale(scale, scale);
  context.shadowColor = 'rgba(220, 168, 243, 0.28)';
  context.shadowBlur = 22;

  const bodyGradient = context.createLinearGradient(140, 250, 680, 760);
  bodyGradient.addColorStop(0, '#efd3fb');
  bodyGradient.addColorStop(0.52, '#dca8f3');
  bodyGradient.addColorStop(1, '#9a00c3');
  context.fillStyle = bodyGradient;
  context.fill(body);

  context.shadowBlur = 0;
  context.fillStyle = '#9a00c3';
  context.fill(back);
  context.fill(handle);

  const rayGradient = context.createLinearGradient(640, 210, 860, 635);
  rayGradient.addColorStop(0, '#efd3fb');
  rayGradient.addColorStop(0.56, '#dca8f3');
  rayGradient.addColorStop(1, '#9a00c3');
  context.fillStyle = rayGradient;
  context.fill(topRay);
  context.fill(middleRay);
  context.fill(bottomRay);

  context.globalAlpha = 0.48;
  context.fillStyle = '#ffffff';
  context.fill(topRay);
  context.fill(middleRay);
  context.fill(bottomRay);
  context.globalAlpha = 1;
  context.restore();
}

function bindHeroSwipe(hero: HTMLElement) {
  const viewport = hero.querySelector<HTMLElement>('div');
  const track = viewport?.firstElementChild instanceof HTMLElement
    ? viewport.firstElementChild
    : null;
  const dots = Array.from(hero.querySelectorAll<HTMLButtonElement>('button'));

  if (!viewport || !track || dots.length <= 1) return () => undefined;

  const previousTouchAction = viewport.style.touchAction;
  const previousUserSelect = viewport.style.userSelect;
  const previousCursor = viewport.style.cursor;
  let activePointerId: number | null = null;
  let startX = 0;
  let dragged = false;
  let suppressClickUntil = 0;
  let originalTransform = '';
  let originalTransition = '';

  viewport.style.touchAction = 'pan-y';
  viewport.style.userSelect = 'none';

  const activeIndex = () => {
    const index = dots.findIndex((dot) => dot.getAttribute('aria-current') === 'true');
    return index >= 0 ? index : 0;
  };

  const restoreTrack = () => {
    track.style.transform = originalTransform;
    track.style.transition = originalTransition;
    viewport.style.cursor = previousCursor;
  };

  const finishPointer = (event: PointerEvent, cancelled = false) => {
    if (activePointerId !== event.pointerId) return;

    const deltaX = event.clientX - startX;
    const threshold = Math.min(60, Math.max(36, viewport.clientWidth * 0.14));
    const shouldChange = !cancelled && Math.abs(deltaX) >= threshold;
    const currentIndex = activeIndex();

    try {
      if (viewport.hasPointerCapture(event.pointerId)) {
        viewport.releasePointerCapture(event.pointerId);
      }
    } catch {
      // Pointer capture may already be released by the browser.
    }

    restoreTrack();
    activePointerId = null;

    if (dragged) suppressClickUntil = Date.now() + 450;
    if (!shouldChange) return;

    const nextIndex = deltaX < 0
      ? (currentIndex + 1) % dots.length
      : (currentIndex - 1 + dots.length) % dots.length;
    dots[nextIndex]?.click();
  };

  const onPointerDown = (event: PointerEvent) => {
    if (!event.isPrimary || event.button !== 0) return;

    activePointerId = event.pointerId;
    startX = event.clientX;
    dragged = false;
    originalTransform = track.style.transform;
    originalTransition = track.style.transition;
    track.style.transition = 'none';
    viewport.style.cursor = 'grabbing';

    try {
      viewport.setPointerCapture(event.pointerId);
    } catch {
      // Some embedded browsers do not expose pointer capture.
    }
  };

  const onPointerMove = (event: PointerEvent) => {
    if (activePointerId !== event.pointerId) return;

    const deltaX = event.clientX - startX;
    if (Math.abs(deltaX) > 6) dragged = true;
    if (Math.abs(deltaX) > 10) event.preventDefault();

    const currentIndex = activeIndex();
    const limitedDelta = Math.max(-viewport.clientWidth * 0.38, Math.min(viewport.clientWidth * 0.38, deltaX));
    track.style.transform = `translate3d(calc(-${currentIndex * 100}% + ${limitedDelta}px), 0, 0)`;
  };

  const onPointerUp = (event: PointerEvent) => finishPointer(event);
  const onPointerCancel = (event: PointerEvent) => finishPointer(event, true);
  const onClickCapture = (event: MouseEvent) => {
    if (Date.now() >= suppressClickUntil) return;
    event.preventDefault();
    event.stopPropagation();
  };

  viewport.addEventListener('pointerdown', onPointerDown);
  viewport.addEventListener('pointermove', onPointerMove, { passive: false });
  viewport.addEventListener('pointerup', onPointerUp);
  viewport.addEventListener('pointercancel', onPointerCancel);
  viewport.addEventListener('click', onClickCapture, true);

  return () => {
    viewport.removeEventListener('pointerdown', onPointerDown);
    viewport.removeEventListener('pointermove', onPointerMove);
    viewport.removeEventListener('pointerup', onPointerUp);
    viewport.removeEventListener('pointercancel', onPointerCancel);
    viewport.removeEventListener('click', onClickCapture, true);
    restoreTrack();
    viewport.style.touchAction = previousTouchAction;
    viewport.style.userSelect = previousUserSelect;
  };
}

function startAnnouncementTicker(viewport: HTMLElement) {
  const track = viewport.querySelector<HTMLElement>(ANNOUNCEMENT_TRACK_SELECTOR);
  const sets = track
    ? Array.from(track.querySelectorAll<HTMLElement>(ANNOUNCEMENT_SET_SELECTOR))
    : [];

  if (!track || sets.length < 2) return () => undefined;

  const previousAnimation = track.style.animation;
  const previousTransform = track.style.transform;
  const previousWillChange = track.style.willChange;
  const previousOverflowX = viewport.style.overflowX;
  const previousScrollBehavior = viewport.style.scrollBehavior;
  const previousMinWidths = sets.map((set) => set.style.minWidth);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const speed = reducedMotion
    ? REDUCED_MOTION_SPEED_PX_PER_SECOND
    : ANNOUNCEMENT_SPEED_PX_PER_SECOND;
  let animationFrame = 0;
  let previousTime = performance.now();
  let paused = document.hidden;
  let loopWidth = 0;
  let offset = 0;
  let active = true;

  track.style.animation = 'none';
  track.style.transform = 'translate3d(0, 0, 0)';
  track.style.willChange = 'transform';
  viewport.style.overflowX = 'hidden';
  viewport.style.scrollBehavior = 'auto';
  viewport.scrollLeft = 0;

  const paint = () => {
    track.style.transform = `translate3d(-${offset.toFixed(3)}px, 0, 0)`;
  };

  const syncSetWidths = () => {
    if (!active) return;

    const viewportWidth = Math.max(1, viewport.clientWidth);
    sets.forEach((set) => {
      set.style.minWidth = `${viewportWidth}px`;
    });

    loopWidth = Math.max(viewportWidth, sets[0]?.getBoundingClientRect().width ?? 0);
    if (loopWidth > 0 && offset >= loopWidth) offset %= loopWidth;
    paint();
  };

  syncSetWidths();
  window.requestAnimationFrame(syncSetWidths);
  void document.fonts?.ready.then(syncSetWidths);

  const resizeObserver = typeof ResizeObserver === 'undefined'
    ? null
    : new ResizeObserver(syncSetWidths);
  resizeObserver?.observe(viewport);

  const onVisibilityChange = () => {
    paused = document.hidden;
    previousTime = performance.now();
  };

  const tick = (time: number) => {
    const elapsed = Math.min(64, Math.max(0, time - previousTime));
    previousTime = time;

    if (!paused && loopWidth > 0) {
      offset = (offset + (speed * elapsed) / 1000) % loopWidth;
      paint();
    }

    animationFrame = window.requestAnimationFrame(tick);
  };

  document.addEventListener('visibilitychange', onVisibilityChange);
  animationFrame = window.requestAnimationFrame(tick);

  return () => {
    active = false;
    window.cancelAnimationFrame(animationFrame);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    resizeObserver?.disconnect();
    track.style.animation = previousAnimation;
    track.style.transform = previousTransform;
    track.style.willChange = previousWillChange;
    viewport.style.overflowX = previousOverflowX;
    viewport.style.scrollBehavior = previousScrollBehavior;
    viewport.scrollLeft = 0;
    sets.forEach((set, index) => {
      set.style.minWidth = previousMinWidths[index] ?? '';
    });
  };
}
