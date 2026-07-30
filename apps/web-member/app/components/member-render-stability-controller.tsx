'use client';

import { useLayoutEffect } from 'react';

const REVEAL_FALLBACK_MS = 1200;

export default function MemberRenderStabilityController() {
  useLayoutEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    if (root.dataset.memberViewportReady === 'true') return;

    let fallbackTimer = 0;

    const revealWhenLayoutReady = () => {
      const mobileReady = root.dataset.memberViewportMode === 'mobile';
      const desktopScaleApplied = body.dataset.memberDesktopScaled === 'true';
      const desktopNativeReady = body.dataset.memberDesktopScaled === 'false';
      if (!mobileReady && !desktopScaleApplied && !desktopNativeReady) return false;

      root.dataset.memberViewportReady = 'true';
      return true;
    };

    if (revealWhenLayoutReady()) return;

    const observer = new MutationObserver(() => {
      if (!revealWhenLayoutReady()) return;
      observer.disconnect();
      window.clearTimeout(fallbackTimer);
    });

    observer.observe(root, {
      attributes: true,
      attributeFilter: ['data-member-viewport-mode'],
    });
    observer.observe(body, {
      attributes: true,
      attributeFilter: ['data-member-desktop-scaled'],
    });

    fallbackTimer = window.setTimeout(() => {
      root.dataset.memberViewportReady = 'true';
      observer.disconnect();
    }, REVEAL_FALLBACK_MS);

    return () => {
      observer.disconnect();
      window.clearTimeout(fallbackTimer);
    };
  }, []);

  return null;
}
