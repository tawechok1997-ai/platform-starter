'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const DESKTOP_QUERY = '(min-width: 901px)';
const REVEAL_SELECTOR = [
  '.desktop-reference-home .reference-announcement',
  '.desktop-reference-home .reference-promo-row',
  '.desktop-reference-home .reference-tournament-cta',
  '.desktop-reference-home .desktop-home__main > [data-section-kind]',
  '.desktop-reference-home .desktop-home__sidebar > *',
  'main[data-source-game-category] > section > header',
  'main[data-source-game-category] [data-source-game-layout] > *',
].join(',');
const RESCAN_DELAYS = [0, 160, 650, 1600] as const;

export default function MemberDesktopMotionRuntime() {
  const pathname = usePathname();

  useEffect(() => {
    const desktop = window.matchMedia(DESKTOP_QUERY);
    const root = document.documentElement;
    const timers: number[] = [];
    let observer: IntersectionObserver | null = null;

    const revealImmediately = (element: HTMLElement, order: number) => {
      element.style.setProperty('--member-desktop-reveal-order', String(order % 8));
      element.dataset.desktopReveal = 'pending';
      window.requestAnimationFrame(() => {
        element.dataset.desktopReveal = 'visible';
      });
    };

    const bindTargets = () => {
      if (!desktop.matches) return;
      const canvas = document.getElementById('member-desktop-scale-canvas');
      if (!canvas) return;

      const viewportHeight = Math.max(1, window.visualViewport?.height || window.innerHeight);
      const targets = Array.from(canvas.querySelectorAll<HTMLElement>(REVEAL_SELECTOR));

      targets.forEach((element, index) => {
        if (element.dataset.desktopRevealBound === 'true') return;
        element.dataset.desktopRevealBound = 'true';
        element.style.setProperty('--member-desktop-reveal-order', String(index % 8));

        const bounds = element.getBoundingClientRect();
        if (bounds.top < viewportHeight * 0.9 && bounds.bottom > 0) {
          revealImmediately(element, index);
          return;
        }

        element.dataset.desktopReveal = 'pending';
        observer?.observe(element);
      });
    };

    const enableDesktopMotion = () => {
      if (!desktop.matches) {
        root.removeAttribute('data-member-desktop-motion');
        document.querySelectorAll<HTMLElement>('[data-desktop-reveal]').forEach((element) => {
          element.dataset.desktopReveal = 'visible';
        });
        return;
      }

      root.dataset.memberDesktopMotion = 'ready';
      bindTargets();
    };

    observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const element = entry.target as HTMLElement;
        element.dataset.desktopReveal = 'visible';
        observer?.unobserve(element);
      });
    }, {
      root: null,
      rootMargin: '0px 0px -8% 0px',
      threshold: 0.08,
    });

    RESCAN_DELAYS.forEach((delay) => {
      timers.push(window.setTimeout(enableDesktopMotion, delay));
    });
    desktop.addEventListener?.('change', enableDesktopMotion);

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      desktop.removeEventListener?.('change', enableDesktopMotion);
      observer?.disconnect();
      root.removeAttribute('data-member-desktop-motion');
    };
  }, [pathname]);

  return <div className="member-desktop-route-progress" aria-hidden="true" />;
}
