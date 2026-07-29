'use client';

import { useEffect } from 'react';
import MemberLanguageOverlay from './member-language-overlay';
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
const PUBLIC_NAV_SELECTOR = '.public-home-topbar .member-desktop-nav--guest';
const PUBLIC_GAME_KEYS = new Set(['casino', 'slot', 'fishing', 'sport', 'card', 'lottery']);

export default function MemberDragScrollController() {
  useEffect(() => {
    let drag: DragState | null = null;
    let suppressClickUntil = 0;
    let suppressClickRail: HTMLElement | null = null;

    const findRail = (target: EventTarget | null) =>
      target instanceof Element ? target.closest<HTMLElement>('[data-drag-scroll]') : null;

    const navigationKeyForUrl = (url: URL) => {
      if ((url.pathname === '/' || url.pathname === '/home') && url.hash === '#live') return 'live';
      if (url.pathname === '/' || url.pathname === '/home') return 'home';

      if (url.pathname.startsWith('/browse/games')) {
        const category = url.searchParams.get('category') || '';
        return PUBLIC_GAME_KEYS.has(category) ? category : '';
      }

      const legacyMatch = url.pathname.match(/^\/home\/(casino|slot|fishing|sport|card|lottery|live)\/?$/);
      return legacyMatch?.[1] || '';
    };

    const navigationKeyForLink = (link: HTMLAnchorElement) => {
      const href = link.getAttribute('href');
      if (!href) return '';
      try {
        return navigationKeyForUrl(new URL(href, window.location.origin));
      } catch {
        return '';
      }
    };

    const syncPublicNavigation = () => {
      const navigation = document.querySelector<HTMLElement>(PUBLIC_NAV_SELECTOR);
      if (!navigation) return;

      const activeKey = navigationKeyForUrl(new URL(window.location.href));
      navigation.querySelectorAll<HTMLAnchorElement>(':scope > a').forEach((link, index) => {
        if (index === 0) {
          const label = link.querySelector<HTMLElement>(':scope > span:last-child');
          if (label && label.textContent !== 'หน้าแรก') label.textContent = 'หน้าแรก';
        }

        if (link.getAttribute('href') === '#live') link.setAttribute('href', '/#live');

        const linkKey = navigationKeyForLink(link);
        const isActive = Boolean(activeKey && linkKey === activeKey);
        link.classList.toggle('active', isActive);
        link.toggleAttribute('data-active', isActive);
        if (isActive) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
      });
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
      const publicNavigationLink =
        event.target instanceof Element ? event.target.closest<HTMLAnchorElement>(`${PUBLIC_NAV_SELECTOR} a`) : null;
      if (publicNavigationLink) {
        const clickedKey = navigationKeyForLink(publicNavigationLink);
        const navigation = publicNavigationLink.closest<HTMLElement>(PUBLIC_NAV_SELECTOR);
        navigation?.querySelectorAll<HTMLAnchorElement>(':scope > a').forEach((link) => {
          const isActive = navigationKeyForLink(link) === clickedKey;
          link.classList.toggle('active', isActive);
          if (isActive) link.setAttribute('aria-current', 'page');
          else link.removeAttribute('aria-current');
        });
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

    syncPublicNavigation();

    const pageObserver = new MutationObserver(syncPublicNavigation);
    pageObserver.observe(document.body, { childList: true, subtree: true });

    window.addEventListener('popstate', syncPublicNavigation);
    window.addEventListener('hashchange', syncPublicNavigation);
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('pointermove', onPointerMove, { passive: false });
    document.addEventListener('pointerup', finishDrag);
    document.addEventListener('pointercancel', finishDrag);
    document.addEventListener('dragstart', onNativeDragStart);
    document.addEventListener('click', onClickCapture, true);

    return () => {
      pageObserver.disconnect();
      window.removeEventListener('popstate', syncPublicNavigation);
      window.removeEventListener('hashchange', syncPublicNavigation);
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
