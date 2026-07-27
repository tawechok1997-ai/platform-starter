'use client';

import { useEffect } from 'react';
import MemberSearchOverlay from './member-search-overlay';

type DragState = {
  rail: HTMLElement;
  pointerId: number;
  startX: number;
  startScrollLeft: number;
  moved: boolean;
};

const DRAG_THRESHOLD_PX = 5;
const SOURCE_DRAG_MULTIPLIER = 2;
const GUIDE_SELECTOR = ".reference-guide[data-section-kind='guide']";

export default function MemberDragScrollController() {
  useEffect(() => {
    let drag: DragState | null = null;
    let suppressClickUntil = 0;
    let suppressClickRail: HTMLElement | null = null;

    const findRail = (target: EventTarget | null) =>
      target instanceof Element ? target.closest<HTMLElement>('[data-drag-scroll]') : null;

    const findGuideSummary = (target: EventTarget | null) =>
      target instanceof Element
        ? target.closest<HTMLElement>(`${GUIDE_SELECTOR} > details > summary`)
        : null;

    const syncGuideAria = (guide: Element | Document = document) => {
      guide.querySelectorAll<HTMLDetailsElement>(`${GUIDE_SELECTOR} > details`).forEach((details) => {
        const summary = details.querySelector<HTMLElement>(':scope > summary');
        if (!summary) return;
        summary.setAttribute('role', 'button');
        summary.setAttribute('aria-expanded', String(details.open));
        summary.tabIndex = 0;
      });
    };

    const toggleGuideItem = (summary: HTMLElement) => {
      const details = summary.parentElement;
      if (!(details instanceof HTMLDetailsElement)) return;
      const guide = details.closest(GUIDE_SELECTOR);
      if (!guide) return;

      const shouldOpen = !details.open;
      guide.querySelectorAll<HTMLDetailsElement>(':scope > details').forEach((item) => {
        item.open = false;
        item.querySelector<HTMLElement>(':scope > summary')?.setAttribute('aria-expanded', 'false');
      });

      details.open = shouldOpen;
      summary.setAttribute('aria-expanded', String(shouldOpen));
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      const rail = findRail(event.target);
      if (!rail || rail.scrollWidth <= rail.clientWidth + 2) return;

      drag = {
        rail,
        pointerId: event.pointerId,
        startX: event.clientX,
        startScrollLeft: rail.scrollLeft,
        moved: false,
      };
      rail.setPointerCapture?.(event.pointerId);
      rail.classList.add('is-drag-ready');
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!drag || drag.pointerId !== event.pointerId) return;
      const deltaX = event.clientX - drag.startX;
      if (!drag.moved && Math.abs(deltaX) < DRAG_THRESHOLD_PX) return;

      drag.moved = true;
      drag.rail.classList.remove('is-drag-ready');
      drag.rail.classList.add('is-dragging');
      drag.rail.scrollLeft = drag.startScrollLeft - deltaX * SOURCE_DRAG_MULTIPLIER;
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
        suppressClickUntil = performance.now() + 350;
      }
    };

    const onClickCapture = (event: MouseEvent) => {
      const guideSummary = findGuideSummary(event.target);
      if (guideSummary) {
        event.preventDefault();
        event.stopPropagation();
        toggleGuideItem(guideSummary);
        return;
      }

      if (!suppressClickRail || performance.now() > suppressClickUntil) return;
      const rail = findRail(event.target);
      if (rail !== suppressClickRail) return;
      event.preventDefault();
      event.stopPropagation();
      suppressClickRail = null;
      suppressClickUntil = 0;
    };

    const onNativeDragStart = (event: DragEvent) => {
      const rail = findRail(event.target);
      if (!rail) return;
      event.preventDefault();
    };

    syncGuideAria();

    const guideObserver = new MutationObserver(() => syncGuideAria());
    guideObserver.observe(document.body, { childList: true, subtree: true });

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('pointermove', onPointerMove, { passive: false });
    document.addEventListener('pointerup', finishDrag);
    document.addEventListener('pointercancel', finishDrag);
    document.addEventListener('dragstart', onNativeDragStart);
    document.addEventListener('click', onClickCapture, true);

    return () => {
      guideObserver.disconnect();
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', finishDrag);
      document.removeEventListener('pointercancel', finishDrag);
      document.removeEventListener('dragstart', onNativeDragStart);
      document.removeEventListener('click', onClickCapture, true);
    };
  }, []);

  return <MemberSearchOverlay />;
}
