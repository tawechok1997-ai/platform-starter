'use client';

import { useEffect } from 'react';

export default function PublicHomeGameNavigationController() {
  useEffect(() => {
    const openPublicGameBrowser = (event: MouseEvent) => {
      if (
        event.button !== 0
        || event.metaKey
        || event.ctrlKey
        || event.shiftKey
        || event.altKey
      ) return;

      const target = event.target;
      if (!(target instanceof Element)) return;

      const link = target.closest<HTMLAnchorElement>('a[href]');
      if (!link || link.target === '_blank' || link.hasAttribute('download')) return;

      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname !== '/browse/games') return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      window.location.assign(`${url.pathname}${url.search}${url.hash}`);
    };

    // Window capture runs before legacy document-level auth interceptors. This
    // keeps Home category icons and game cards publicly browsable while the
    // actual play controls continue to require an authenticated session.
    window.addEventListener('click', openPublicGameBrowser, true);
    return () => window.removeEventListener('click', openPublicGameBrowser, true);
  }, []);

  return null;
}
