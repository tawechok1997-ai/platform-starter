'use client';

import { startTransition, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import MemberBodySkeleton from './member-body-skeleton';
import styles from './member-client-navigation-controller.module.css';

const OPT_OUT_SELECTOR = [
  '[download]',
  '[target]:not([target=""]):not([target="_self"])',
  '[data-no-client-navigation]',
  '[data-public-game-launch="external"]',
].join(',');

const SKELETON_DELAY_MS = 120;
const NAVIGATION_TIMEOUT_MS = 6000;
const MAX_LOCATION_CHECK_FRAMES = 180;
const prefetchedRoutes = new Set<string>();

type InternalDestination = {
  href: string;
  url: URL;
};

export default function MemberClientNavigationController() {
  const router = useRouter();
  const [overlayTarget, setOverlayTarget] = useState<HTMLElement | null>(null);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const skeletonDelayRef = useRef<number | null>(null);
  const navigationTimeoutRef = useRef<number | null>(null);
  const locationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const syncTarget = () => {
      setOverlayTarget(document.querySelector<HTMLElement>('.member-persistent-shell__body'));
    };

    syncTarget();
    const frame = window.requestAnimationFrame(syncTarget);
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const clearTimers = () => {
      if (skeletonDelayRef.current !== null) {
        window.clearTimeout(skeletonDelayRef.current);
        skeletonDelayRef.current = null;
      }
      if (navigationTimeoutRef.current !== null) {
        window.clearTimeout(navigationTimeoutRef.current);
        navigationTimeoutRef.current = null;
      }
      if (locationFrameRef.current !== null) {
        window.cancelAnimationFrame(locationFrameRef.current);
        locationFrameRef.current = null;
      }
    };

    const finishNavigation = () => {
      clearTimers();
      setShowSkeleton(false);
    };

    const beginNavigation = (fromHref: string) => {
      clearTimers();
      skeletonDelayRef.current = window.setTimeout(() => {
        skeletonDelayRef.current = null;
        setShowSkeleton(true);
      }, SKELETON_DELAY_MS);

      navigationTimeoutRef.current = window.setTimeout(
        finishNavigation,
        NAVIGATION_TIMEOUT_MS,
      );

      let frameCount = 0;
      const waitForLocationChange = () => {
        if (window.location.href !== fromHref) {
          locationFrameRef.current = window.requestAnimationFrame(() => {
            locationFrameRef.current = window.requestAnimationFrame(finishNavigation);
          });
          return;
        }

        frameCount += 1;
        if (frameCount >= MAX_LOCATION_CHECK_FRAMES) {
          finishNavigation();
          return;
        }

        locationFrameRef.current = window.requestAnimationFrame(waitForLocationChange);
      };

      locationFrameRef.current = window.requestAnimationFrame(waitForLocationChange);
    };

    const prefetchLink = (event: Event) => {
      if (!(event.target instanceof Element)) return;
      const link = event.target.closest<HTMLAnchorElement>('a[href]');
      const destination = internalDestinationFor(link);
      if (!destination || destination.href === currentRouteHref()) return;
      if (prefetchedRoutes.has(destination.href)) return;

      prefetchedRoutes.add(destination.href);
      router.prefetch(destination.href);
    };

    const navigateInsideShell = (event: MouseEvent) => {
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
        return;
      }

      event.preventDefault();
      beginNavigation(window.location.href);
      startTransition(() => router.push(destination.href));
    };

    document.addEventListener('pointerover', prefetchLink, { passive: true });
    document.addEventListener('focusin', prefetchLink);
    document.addEventListener('click', navigateInsideShell);

    return () => {
      clearTimers();
      document.removeEventListener('pointerover', prefetchLink);
      document.removeEventListener('focusin', prefetchLink);
      document.removeEventListener('click', navigateInsideShell);
    };
  }, [router]);

  if (!overlayTarget || !showSkeleton) return null;

  return createPortal(
    <div className={styles.routeOverlay} role="status" aria-live="polite">
      <MemberBodySkeleton label="กำลังโหลดหน้า" />
    </div>,
    overlayTarget,
  );
}

function internalDestinationFor(link: HTMLAnchorElement | null): InternalDestination | null {
  if (!link || link.matches(OPT_OUT_SELECTOR)) return null;

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
