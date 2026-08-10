'use client';

import { Suspense, useLayoutEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { isMemberNavigationActive } from '../member-navigation-active';
import { MemberLegacyThemeNormalizer } from '../member-legacy-theme-normalizer';
import { MemberThemeSettingsRuntime } from '../member-theme-settings-runtime';

const NAVIGATION_LINK_SELECTOR = [
  '.member-desktop-nav a[href]',
  '.member-mobile-runtime-navigation a[href]',
  '.member-bottom-nav a[href]',
].join(',');

export default function MemberNavigationStateController() {
  return (
    <>
      <MemberThemeSettingsRuntime />
      <MemberLegacyThemeNormalizer />
      <Suspense fallback={null}>
        <MemberNavigationStateInner />
      </Suspense>
    </>
  );
}

function MemberNavigationStateInner() {
  const pathname = usePathname() ?? '/';
  const searchParams = useSearchParams();
  const search = searchParams.toString();

  useLayoutEffect(() => {
    let frame = 0;
    const current = new URLSearchParams(search);

    const sync = () => {
      frame = 0;
      document.querySelectorAll<HTMLAnchorElement>(NAVIGATION_LINK_SELECTOR).forEach((link) => {
        const active = isMemberNavigationActive(pathname, current, link.getAttribute('href') ?? '', link.dataset.navigationId);
        link.classList.toggle('active', active);
        link.classList.toggle('is-active', active);
        if (active) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
      });
    };

    const schedule = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(sync);
    };

    sync();
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['href'] });
    return () => {
      observer.disconnect();
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [pathname, search]);

  return null;
}
