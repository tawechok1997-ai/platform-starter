'use client';

import { useEffect } from 'react';

const SWIPE_THRESHOLD = 42;
const HERO_SELECTOR = '.reference-hero-carousel, .member-home-hero';

export default function MemberHeroSwipeController() {
  useEffect(() => {
    let startX = 0;
    let startY = 0;
    let activeHero: HTMLElement | null = null;

    const findHero = (target: EventTarget | null) =>
      target instanceof Element ? target.closest<HTMLElement>(HERO_SELECTOR) : null;

    const disableNativeDrag = (hero: HTMLElement) => {
      hero.querySelectorAll<HTMLElement>('a, img').forEach((element) => {
        element.setAttribute('draggable', 'false');
        element.style.setProperty('-webkit-user-drag', 'none');
        element.style.userSelect = 'none';
      });
    };

    const applyGuards = () => {
      document.querySelectorAll<HTMLElement>(HERO_SELECTOR).forEach(disableNativeDrag);
    };

    const preventHeroDragStart = (event: DragEvent) => {
      if (!findHero(event.target)) return;
      event.preventDefault();
    };

    const preparePointerGesture = (event: PointerEvent) => {
      const hero = findHero(event.target);
      if (!hero) return;
      disableNativeDrag(hero);
    };

    const moveSlide = (hero: HTMLElement, direction: -1 | 1) => {
      const referenceButtons = Array.from(
        hero.querySelectorAll<HTMLButtonElement>('.reference-hero-pagination button'),
      );
      const legacyButtons = Array.from(
        hero.querySelectorAll<HTMLButtonElement>('.member-home-hero__dots button'),
      );
      const buttons = referenceButtons.length ? referenceButtons : legacyButtons;
      if (buttons.length < 2) return;

      const current = Math.max(
        buttons.findIndex((button) =>
          button.classList.contains('is-active') || button.classList.contains('active'),
        ),
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

      // The reference carousel owns its pointer/swipe state internally. The legacy
      // fallback only clicks dots for the old member-home hero to avoid double movement.
      if (hero.matches('.member-home-hero')) {
        moveSlide(hero, deltaX < 0 ? 1 : -1);
      }
    };

    applyGuards();

    const observer = new MutationObserver(applyGuards);
    observer.observe(document.body, { childList: true, subtree: true });

    document.addEventListener('dragstart', preventHeroDragStart, true);
    document.addEventListener('pointerdown', preparePointerGesture, true);
    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      observer.disconnect();
      document.removeEventListener('dragstart', preventHeroDragStart, true);
      document.removeEventListener('pointerdown', preparePointerGesture, true);
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  return null;
}
