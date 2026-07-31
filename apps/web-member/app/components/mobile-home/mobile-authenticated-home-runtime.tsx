'use client';

import { useLayoutEffect } from 'react';
import { useMemberRuntime } from '../../member-runtime-provider';

const AUTH_SELECTORS = [
  '[data-mobile-section-owner="auth-actions"]',
  '[data-mobile-auth-layout="drawer"]',
] as const;

export default function MobileAuthenticatedHomeRuntime() {
  const { summary } = useMemberRuntime();

  useLayoutEffect(() => {
    const root = document.querySelector<HTMLElement>('[data-mobile-home-root="true"]');
    if (!root) return;

    root.dataset.mobileAuthenticated = summary.isLoggedIn ? 'true' : 'false';

    AUTH_SELECTORS.forEach((selector) => {
      root.querySelectorAll<HTMLElement>(selector).forEach((element) => {
        element.hidden = summary.isLoggedIn;
        if (summary.isLoggedIn) element.setAttribute('aria-hidden', 'true');
        else element.removeAttribute('aria-hidden');
      });
    });
  }, [summary.isLoggedIn]);

  return null;
}
