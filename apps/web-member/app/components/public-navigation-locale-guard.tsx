'use client';

import { useLayoutEffect } from 'react';

const NAVIGATION_SELECTOR = '.public-home-topbar .member-desktop-nav--guest';
const GUARD_ATTRIBUTE = 'data-navigation-label-guard';

export default function PublicNavigationLocaleGuard() {
  useLayoutEffect(() => {
    const protectLocalizedLabel = () => {
      const firstLink = document.querySelector<HTMLAnchorElement>(`${NAVIGATION_SELECTOR} > a:first-child`);
      if (!firstLink || firstLink.querySelector(`:scope > span[${GUARD_ATTRIBUTE}]`)) return;

      const guard = document.createElement('span');
      guard.hidden = true;
      guard.setAttribute(GUARD_ATTRIBUTE, 'true');
      guard.setAttribute('aria-hidden', 'true');
      firstLink.append(guard);
    };

    protectLocalizedLabel();
    const observer = new MutationObserver(protectLocalizedLabel);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
