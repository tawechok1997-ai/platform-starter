'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const OPT_OUT_SELECTOR = [
  '[download]',
  '[target]:not([target=""]):not([target="_self"])',
  '[data-no-client-navigation]',
  '[data-public-game-launch="external"]',
].join(',');

export default function MemberClientNavigationController() {
  const router = useRouter();

  useEffect(() => {
    const navigateInsideShell = (event: MouseEvent) => {
      if (
        event.defaultPrevented
        || event.button !== 0
        || event.metaKey
        || event.ctrlKey
        || event.shiftKey
        || event.altKey
      ) return;

      const target = event.target;
      if (!(target instanceof Element)) return;
      const link = target.closest<HTMLAnchorElement>('a[href]');
      if (!link || link.matches(OPT_OUT_SELECTOR)) return;

      const rawHref = link.getAttribute('href')?.trim();
      if (!rawHref || rawHref.startsWith('#')) return;
      if (/^(?:mailto:|tel:|sms:|javascript:|blob:|data:)/i.test(rawHref)) return;

      let destination: URL;
      try {
        destination = new URL(link.href, window.location.href);
      } catch {
        return;
      }

      if (destination.origin !== window.location.origin) return;
      if (destination.pathname === window.location.pathname && destination.search === window.location.search) {
        if (destination.hash) return;
        event.preventDefault();
        return;
      }

      event.preventDefault();
      router.push(`${destination.pathname}${destination.search}${destination.hash}`);
    };

    document.addEventListener('click', navigateInsideShell);
    return () => document.removeEventListener('click', navigateInsideShell);
  }, [router]);

  return null;
}
