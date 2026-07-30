'use client';

import { startTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const OPT_OUT_SELECTOR = [
  '[download]',
  '[target]:not([target=""]):not([target="_self"])',
  '[data-no-client-navigation]',
  '[data-public-game-launch="external"]',
].join(',');

const prefetchedRoutes = new Set<string>();

type InternalDestination = {
  href: string;
  url: URL;
};

export default function MemberClientNavigationController() {
  const router = useRouter();

  useEffect(() => {
    const prefetchLink = (event: Event) => {
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

    document.addEventListener('pointerover', prefetchLink, { passive: true });
    document.addEventListener('focusin', prefetchLink);
    document.addEventListener('click', navigatePlainInternalLink);

    return () => {
      document.removeEventListener('pointerover', prefetchLink);
      document.removeEventListener('focusin', prefetchLink);
      document.removeEventListener('click', navigatePlainInternalLink);
    };
  }, [router]);

  return null;
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
