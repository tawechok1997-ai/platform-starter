'use client';

import { useEffect } from 'react';
import MemberLanguageOverlay from './member-language-overlay';
import MemberSearchOverlay from './member-search-overlay';

type DragState = {
  rail: HTMLElement;
  pointerId: number;
  startX: number;
  startY: number;
  startScrollLeft: number;
  moved: boolean;
};

const DRAG_THRESHOLD_PX = 10;
const CLICK_SUPPRESSION_MS = 120;
const MOUSE_DRAG_MULTIPLIER = 2;
const FINE_POINTER_QUERY = '(hover: hover) and (pointer: fine)';
const DESKTOP_CANVAS_SELECTOR = '#member-desktop-scale-canvas';

function isHorizontalRail(element: HTMLElement) {
  const overflowX = window.getComputedStyle(element).overflowX;
  return (overflowX === 'auto' || overflowX === 'scroll')
    && element.scrollWidth > element.clientWidth + 2;
}

function findHorizontalRail(target: EventTarget | null) {
  if (!(target instanceof Element)) return null;

  const explicitRail = target.closest<HTMLElement>('[data-drag-scroll]');
  if (explicitRail) return explicitRail;

  const desktopCanvas = target.closest<HTMLElement>(DESKTOP_CANVAS_SELECTOR);
  if (!desktopCanvas) return null;

  let element: HTMLElement | null = target instanceof HTMLElement ? target : target.parentElement;
  while (element && element !== desktopCanvas) {
    if (isHorizontalRail(element)) {
      element.dataset.dragScroll = 'auto';
      return element;
    }
    element = element.parentElement;
  }

  return null;
}

export default function MemberDragScrollController() {
  useEffect(() => {
    const finePointer = window.matchMedia(FINE_POINTER_QUERY);
    if (!finePointer.matches) return;

    let drag: DragState | null = null;
    let suppressClickUntil = 0;
    let suppressClickRail: HTMLElement | null = null;

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' || event.button !== 0) return;
      const rail = findHorizontalRail(event.target);
      if (!rail || rail.scrollWidth <= rail.clientWidth + 2) return;

      drag = {
        rail,
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        startScrollLeft: rail.scrollLeft,
        moved: false,
      };
      rail.classList.add('is-drag-ready');
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!drag || drag.pointerId !== event.pointerId) return;
      const deltaX = event.clientX - drag.startX;
      const deltaY = event.clientY - drag.startY;

      if (!drag.moved) {
        if (Math.abs(deltaX) < DRAG_THRESHOLD_PX) return;
        if (Math.abs(deltaX) <= Math.abs(deltaY)) {
          drag.rail.classList.remove('is-drag-ready');
          drag = null;
          return;
        }

        drag.moved = true;
        drag.rail.setPointerCapture?.(event.pointerId);
        drag.rail.classList.remove('is-drag-ready');
        drag.rail.classList.add('is-dragging');
      }

      drag.rail.scrollLeft = drag.startScrollLeft - deltaX * MOUSE_DRAG_MULTIPLIER;
    };

    const finishDrag = (event: PointerEvent) => {
      if (!drag || drag.pointerId !== event.pointerId) return;
      const { rail, moved, pointerId } = drag;
      if (rail.hasPointerCapture?.(pointerId)) rail.releasePointerCapture(pointerId);
      rail.classList.remove('is-drag-ready', 'is-dragging');
      drag = null;

      if (moved) {
        suppressClickRail = rail;
        suppressClickUntil = performance.now() + CLICK_SUPPRESSION_MS;
      }
    };

    const onClickCapture = (event: MouseEvent) => {
      if (!suppressClickRail || performance.now() > suppressClickUntil) return;
      const rail = findHorizontalRail(event.target);
      if (rail !== suppressClickRail) return;

      event.preventDefault();
      event.stopPropagation();
      suppressClickRail = null;
      suppressClickUntil = 0;
    };

    const onNativeDragStart = (event: DragEvent) => {
      if (findHorizontalRail(event.target)) event.preventDefault();
    };

    document.addEventListener('pointerdown', onPointerDown, { passive: true });
    document.addEventListener('pointermove', onPointerMove, { passive: true });
    document.addEventListener('pointerup', finishDrag, { passive: true });
    document.addEventListener('pointercancel', finishDrag, { passive: true });
    document.addEventListener('dragstart', onNativeDragStart);
    document.addEventListener('click', onClickCapture, true);

    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', finishDrag);
      document.removeEventListener('pointercancel', finishDrag);
      document.removeEventListener('dragstart', onNativeDragStart);
      document.removeEventListener('click', onClickCapture, true);
    };
  }, []);

  return (
    <>
      <MemberSearchOverlay />
      <MemberLanguageOverlay />
    </>
  );
}
