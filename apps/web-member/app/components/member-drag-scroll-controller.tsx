'use client';

import { useEffect } from 'react';
import MemberLanguageOverlay from './member-language-overlay';
import MemberSearchOverlay from './member-search-overlay';

type DragState = {
  rail: HTMLElement;
  pointerId: number;
  pointerType: string;
  startX: number;
  startY: number;
  startScrollLeft: number;
  moved: boolean;
};

const DRAG_THRESHOLD_PX = 10;
const CLICK_SUPPRESSION_MS = 120;
const MOUSE_DRAG_MULTIPLIER = 2;
const TOUCH_DRAG_MULTIPLIER = 1;
const MOBILE_ROOT_SELECTOR = '[data-mobile-home-root="true"]';

function isHorizontalRail(element: HTMLElement) {
  const overflowX = window.getComputedStyle(element).overflowX;
  return overflowX === 'auto' || overflowX === 'scroll';
}

export default function MemberDragScrollController() {
  useEffect(() => {
    let drag: DragState | null = null;
    let suppressClickUntil = 0;
    let suppressClickRail: HTMLElement | null = null;
    let mobileRailScanFrame = 0;

    const markMobileRails = () => {
      mobileRailScanFrame = 0;
      const mobileRoot = document.querySelector<HTMLElement>(MOBILE_ROOT_SELECTOR);
      if (!mobileRoot) return;

      mobileRoot.querySelectorAll<HTMLElement>('*').forEach((element) => {
        if (element.hasAttribute('data-drag-scroll')) return;
        if (!isHorizontalRail(element)) return;
        element.dataset.dragScroll = 'auto';
      });
    };

    const scheduleMobileRailScan = () => {
      if (mobileRailScanFrame) return;
      mobileRailScanFrame = window.requestAnimationFrame(markMobileRails);
    };

    scheduleMobileRailScan();

    const mobileRailObserver = new MutationObserver(scheduleMobileRailScan);
    mobileRailObserver.observe(document.body, { childList: true, subtree: true });

    const findRail = (target: EventTarget | null) =>
      target instanceof Element ? target.closest<HTMLElement>('[data-drag-scroll]') : null;

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      const rail = findRail(event.target);
      if (!rail || rail.scrollWidth <= rail.clientWidth + 2) return;

      drag = {
        rail,
        pointerId: event.pointerId,
        pointerType: event.pointerType,
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

      const multiplier = drag.pointerType === 'mouse'
        ? MOUSE_DRAG_MULTIPLIER
        : TOUCH_DRAG_MULTIPLIER;
      drag.rail.scrollLeft = drag.startScrollLeft - deltaX * multiplier;
      event.preventDefault();
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
      const rail = findRail(event.target);
      if (rail !== suppressClickRail) return;

      event.preventDefault();
      event.stopPropagation();
      suppressClickRail = null;
      suppressClickUntil = 0;
    };

    const onNativeDragStart = (event: DragEvent) => {
      if (findRail(event.target)) event.preventDefault();
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('pointermove', onPointerMove, { passive: false });
    document.addEventListener('pointerup', finishDrag);
    document.addEventListener('pointercancel', finishDrag);
    document.addEventListener('dragstart', onNativeDragStart);
    document.addEventListener('click', onClickCapture, true);

    return () => {
      mobileRailObserver.disconnect();
      if (mobileRailScanFrame) window.cancelAnimationFrame(mobileRailScanFrame);
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
