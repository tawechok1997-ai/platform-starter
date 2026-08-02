'use client';

import { useEffect } from 'react';

type GestureAxis = 'pending' | 'horizontal' | 'vertical';

const HERO_SELECTOR = '[data-mobile-section-owner="hero"]';
const AXIS_LOCK_DISTANCE = 8;
const HORIZONTAL_INTENT_RATIO = 1.15;

export default function MobileScrollComfortGuard() {
  useEffect(() => {
    let activePointerId: number | null = null;
    let startX = 0;
    let startY = 0;
    let axis: GestureAxis = 'pending';

    const resetGesture = () => {
      activePointerId = null;
      axis = 'pending';
      document.documentElement.removeAttribute('data-mobile-vertical-scroll');
    };

    const onPointerDown = (event: PointerEvent) => {
      if (!event.isPrimary || event.button !== 0) return;
      if (!(event.target instanceof Element)) return;
      if (!event.target.closest(HERO_SELECTOR)) return;

      activePointerId = event.pointerId;
      startX = event.clientX;
      startY = event.clientY;
      axis = 'pending';
    };

    const onPointerMove = (event: PointerEvent) => {
      if (activePointerId !== event.pointerId) return;

      const deltaX = event.clientX - startX;
      const deltaY = event.clientY - startY;
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      if (axis === 'pending') {
        if (Math.max(absX, absY) < AXIS_LOCK_DISTANCE) return;
        axis = absX > absY * HORIZONTAL_INTENT_RATIO ? 'horizontal' : 'vertical';
      }

      if (axis !== 'vertical') return;

      document.documentElement.dataset.mobileVerticalScroll = 'true';
      event.stopPropagation();
    };

    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('pointermove', onPointerMove, true);
    document.addEventListener('pointerup', resetGesture, true);
    document.addEventListener('pointercancel', resetGesture, true);

    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('pointermove', onPointerMove, true);
      document.removeEventListener('pointerup', resetGesture, true);
      document.removeEventListener('pointercancel', resetGesture, true);
      resetGesture();
    };
  }, []);

  return null;
}
