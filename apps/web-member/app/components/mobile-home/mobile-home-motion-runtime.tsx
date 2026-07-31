'use client';

import { useEffect } from 'react';

const HERO_SELECTOR = '[data-mobile-section-owner="hero"]';
const ANNOUNCEMENT_VIEWPORT_SELECTOR = '[data-mobile-announcement-viewport="true"]';
const ANNOUNCEMENT_TRACK_SELECTOR = '[data-mobile-announcement-track="true"]';
const ANNOUNCEMENT_SET_SELECTOR = '[data-mobile-announcement-set="true"]';
const ANNOUNCEMENT_SPEED_PX_PER_SECOND = 42;
const REDUCED_MOTION_SPEED_PX_PER_SECOND = 18;

type MobileHomeMotionRuntimeProps = {
  contentVersion: string;
};

export default function MobileHomeMotionRuntime({ contentVersion }: MobileHomeMotionRuntimeProps) {
  useEffect(() => {
    const cleanups: Array<() => void> = [];

    const hero = document.querySelector<HTMLElement>(HERO_SELECTOR);
    if (hero) cleanups.push(bindHeroSwipe(hero));

    const announcementViewport = document.querySelector<HTMLElement>(ANNOUNCEMENT_VIEWPORT_SELECTOR);
    if (announcementViewport) cleanups.push(startAnnouncementTicker(announcementViewport));

    return () => {
      cleanups.reverse().forEach((cleanup) => cleanup());
    };
  }, [contentVersion]);

  return null;
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
