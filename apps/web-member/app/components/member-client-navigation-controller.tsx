'use client';

import { startTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const OPT_OUT_SELECTOR = [
  '[download]',
  '[target]:not([target=""]):not([target="_self"])',
  '[data-no-client-navigation]',
  '[data-public-game-launch="external"]',
].join(',');

const TOURNAMENT_TRIGGER_SELECTOR = '.reference-tournament-cta';
const TOURNAMENT_DESTINATION = '/browse/tournaments';
const prefetchedRoutes = new Set<string>();

type InternalDestination = {
  href: string;
  url: URL;
};

export default function MemberClientNavigationController() {
  const router = useRouter();

  useEffect(() => {
    const prefetchFocusedLink = (event: FocusEvent) => {
      if (!(event.target instanceof Element)) return;
      const link = event.target.closest<HTMLAnchorElement>('a[href]');
      const destination = internalDestinationFor(link);
      if (!destination || destination.href === currentRouteHref()) return;
      if (prefetchedRoutes.has(destination.href)) return;

      prefetchedRoutes.add(destination.href);
      router.prefetch(destination.href);
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
        return;
      }

      // Next.js <Link> prevents the native event itself. This fallback only
      // handles legacy same-origin anchors that still exist in older screens.
      event.preventDefault();
      startTransition(() => router.push(destination.href));
    };

    // Avoid global pointerover prefetching. Moving across a large game catalog
    // otherwise queues hundreds of unique route requests before the user clicks.
    document.addEventListener('focusin', prefetchFocusedLink);
    document.addEventListener('click', navigatePlainInternalLink);

    return () => {
      document.removeEventListener('focusin', prefetchFocusedLink);
      document.removeEventListener('click', navigatePlainInternalLink);
    };
  }, [router]);

  return null;
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
