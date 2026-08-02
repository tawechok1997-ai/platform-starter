'use client';

import { startTransition, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const OPT_OUT_SELECTOR = [
  '[download]',
  '[target]:not([target=""]):not([target="_self"])',
  '[data-no-client-navigation]',
  '[data-no-route-motion]',
  '[data-public-game-launch="external"]',
].join(',');

const POPUP_TRIGGER_SELECTOR = [
  '[data-member-auth-mode]',
  '[data-mobile-member-popup]',
  '[data-member-search-trigger]',
  '[aria-haspopup="dialog"]',
].join(',');

const TOURNAMENT_TRIGGER_SELECTOR = '.reference-tournament-cta';
const TOURNAMENT_DESTINATION = '/browse/tournaments';
const ROUTE_ENTER_DURATION_MS = 240;
const ROUTE_LEAVE_SAFETY_MS = 900;
const prefetchedRoutes = new Set<string>();

type InternalDestination = {
  href: string;
  url: URL;
};

type RouteMotionState = 'idle' | 'leaving' | 'entering';

export default function MemberClientNavigationController() {
  const router = useRouter();
  const pathname = usePathname();
  const resetTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    clearMotionTimer(resetTimerRef);
    setRouteMotion(root, 'entering');
    resetTimerRef.current = window.setTimeout(() => {
      resetTimerRef.current = null;
      setRouteMotion(root, 'idle');
    }, ROUTE_ENTER_DURATION_MS);

    return () => clearMotionTimer(resetTimerRef);
  }, [pathname]);

  useEffect(() => {
    const root = document.documentElement;

    const prefetchFocusedLink = (event: FocusEvent) => {
      if (!(event.target instanceof Element)) return;
      const link = event.target.closest<HTMLAnchorElement>('a[href]');
      const destination = internalDestinationFor(link);
      if (!destination || destination.href === currentRouteHref()) return;
      if (prefetchedRoutes.has(destination.href)) return;

      prefetchedRoutes.add(destination.href);
      router.prefetch(destination.href);
    };

    const markRouteLeaving = (event: PointerEvent) => {
      if (
        event.button !== 0
        || event.metaKey
        || event.ctrlKey
        || event.shiftKey
        || event.altKey
        || !(event.target instanceof Element)
      ) return;

      const link = event.target.closest<HTMLAnchorElement>('a[href]');
      const destination = internalDestinationFor(link);
      if (!destination || !shouldAnimateRouteLink(link, destination)) return;
      if (destination.href === currentRouteHref()) return;

      clearMotionTimer(resetTimerRef);
      setRouteMotion(root, 'leaving');
      resetTimerRef.current = window.setTimeout(() => {
        resetTimerRef.current = null;
        if (root.dataset.memberRouteMotion === 'leaving') setRouteMotion(root, 'idle');
      }, ROUTE_LEAVE_SAFETY_MS);
    };

    const navigatePlainInternalLink = (event: MouseEvent) => {
      if (
        event.defaultPrevented
        || event.button !== 0
        || event.metaKey
        || event.ctrlKey
        || event.shiftKey
        || event.altKey
        || !(event.target instanceof Element)
      ) return;

      const link = event.target.closest<HTMLAnchorElement>('a[href]');
      const destination = internalDestinationFor(link);
      if (!destination) return;

      const currentHref = currentRouteHref();
      if (destination.href === currentHref) {
        if (destination.url.hash) return;
        event.preventDefault();
        setRouteMotion(root, 'idle');
        return;
      }

      // Next.js <Link> prevents the native event itself. This fallback only
      // handles legacy same-origin anchors that still exist in older screens.
      event.preventDefault();
      setRouteMotion(root, 'leaving');
      startTransition(() => router.push(destination.href));
    };

    // Pointer-down gives the current page one paint to soften before the new
    // route commits. Navigation itself is never delayed.
    window.addEventListener('pointerdown', markRouteLeaving, true);
    document.addEventListener('focusin', prefetchFocusedLink);
    document.addEventListener('click', navigatePlainInternalLink);

    return () => {
      clearMotionTimer(resetTimerRef);
      window.removeEventListener('pointerdown', markRouteLeaving, true);
      document.removeEventListener('focusin', prefetchFocusedLink);
      document.removeEventListener('click', navigatePlainInternalLink);
      setRouteMotion(root, 'idle');
    };
  }, [router]);

  return null;
}

function shouldAnimateRouteLink(link: HTMLAnchorElement, destination: InternalDestination) {
  if (link.closest(POPUP_TRIGGER_SELECTOR)) return false;
  if (destination.url.pathname === '/login' || destination.url.pathname === '/register') return false;
  if (destination.url.pathname === '/promotions' || destination.url.pathname === '/browse/promotions') return false;
  return true;
}

function internalDestinationFor(link: HTMLAnchorElement | null): InternalDestination | null {
  if (!link || link.matches(OPT_OUT_SELECTOR)) return null;

  if (link.matches(TOURNAMENT_TRIGGER_SELECTOR)) {
    return {
      href: TOURNAMENT_DESTINATION,
      url: new URL(TOURNAMENT_DESTINATION, window.location.origin),
    };
  }

  const rawHref = link.getAttribute('href')?.trim();
  if (!rawHref || rawHref.startsWith('#')) return null;
  if (/^(?:mailto:|tel:|sms:|javascript:|blob:|data:)/i.test(rawHref)) return null;

  let url: URL;
  try {
    url = new URL(link.href, window.location.href);
  } catch {
    return null;
  }

  if (url.origin !== window.location.origin) return null;
  return {
    href: `${url.pathname}${url.search}${url.hash}`,
    url,
  };
}

function currentRouteHref() {
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

function setRouteMotion(root: HTMLElement, state: RouteMotionState) {
  root.dataset.memberRouteMotion = state;
}

function clearMotionTimer(ref: { current: number | null }) {
  if (ref.current === null) return;
  window.clearTimeout(ref.current);
  ref.current = null;
}
