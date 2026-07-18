'use client';

import { useEffect } from 'react';

const SWIPE_THRESHOLD = 42;

export default function MemberHeroSwipeController() {
  useEffect(() => {
    const hero = document.querySelector<HTMLElement>('.member-home-hero');
    if (!hero) return;

    let startX = 0;
    let startY = 0;
    let tracking = false;

    const dots = () => Array.from(hero.querySelectorAll<HTMLButtonElement>('.member-home-hero__dots button'));

    const moveSlide = (direction: -1 | 1) => {
      const buttons = dots();
      if (buttons.length < 2) return;
      const current = Math.max(buttons.findIndex((button) => button.classList.contains('active')), 0);
      const next = (current + direction + buttons.length) % buttons.length;
      buttons[next]?.click();
    };

    const onTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch) return;
      startX = touch.clientX;
      startY = touch.clientY;
      tracking = true;
    };

    const onTouchEnd = (event: TouchEvent) => {
      if (!tracking) return;
      tracking = false;
      const touch = event.changedTouches[0];
      if (!touch) return;

      const deltaX = touch.clientX - startX;
      const deltaY = touch.clientY - startY;
      if (Math.abs(deltaX) < SWIPE_THRESHOLD || Math.abs(deltaX) <= Math.abs(deltaY)) return;

      moveSlide(deltaX < 0 ? 1 : -1);
    };

    hero.addEventListener('touchstart', onTouchStart, { passive: true });
    hero.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      hero.removeEventListener('touchstart', onTouchStart);
      hero.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  return null;
}
