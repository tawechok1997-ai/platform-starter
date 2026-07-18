'use client';

import { useEffect } from 'react';

const SWIPE_THRESHOLD = 42;

export default function MemberHeroSwipeController() {
  useEffect(() => {
    let startX = 0;
    let startY = 0;
    let activeHero: HTMLElement | null = null;

    const findHero = (target: EventTarget | null) =>
      target instanceof Element ? target.closest<HTMLElement>('.member-home-hero') : null;

    const moveSlide = (hero: HTMLElement, direction: -1 | 1) => {
      const buttons = Array.from(
        hero.querySelectorAll<HTMLButtonElement>('.member-home-hero__dots button'),
      );
      if (buttons.length < 2) return;

      const current = Math.max(
        buttons.findIndex((button) => button.classList.contains('active')),
        0,
      );
      const next = (current + direction + buttons.length) % buttons.length;
      buttons[next]?.click();
    };

    const onTouchStart = (event: TouchEvent) => {
      const hero = findHero(event.target);
      const touch = event.touches[0];
      if (!hero || !touch) {
        activeHero = null;
        return;
      }

      activeHero = hero;
      startX = touch.clientX;
      startY = touch.clientY;
    };

    const onTouchEnd = (event: TouchEvent) => {
      const hero = activeHero;
      activeHero = null;
      if (!hero) return;

      const touch = event.changedTouches[0];
      if (!touch) return;

      const deltaX = touch.clientX - startX;
      const deltaY = touch.clientY - startY;
      if (Math.abs(deltaX) < SWIPE_THRESHOLD || Math.abs(deltaX) <= Math.abs(deltaY)) return;

      moveSlide(hero, deltaX < 0 ? 1 : -1);
    };

    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  return null;
}
