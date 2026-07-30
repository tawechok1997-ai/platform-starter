'use client';

import { useLayoutEffect } from 'react';

const REVEAL_FALLBACK_MS = 1200;
const POPUP_PREFERENCE_SETTLE_MS = 120;
const POPUP_GUARD_STYLE_ID = 'member-popup-preference-guard';

export default function MemberRenderStabilityController() {
  useLayoutEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    let createdPopupGuard = false;

    if (!document.getElementById(POPUP_GUARD_STYLE_ID)) {
      const style = document.createElement('style');
      style.id = POPUP_GUARD_STYLE_ID;
      style.textContent = `html:not([data-member-popup-preference-ready="true"]) .member-home-popup { visibility: hidden !important; pointer-events: none !important; }`;
      document.head.appendChild(style);
      createdPopupGuard = true;
    }

    root.dataset.memberPopupPreferenceReady = 'false';
    const popupPreferenceTimer = window.setTimeout(() => {
      root.dataset.memberPopupPreferenceReady = 'true';
    }, POPUP_PREFERENCE_SETTLE_MS);

    if (root.dataset.memberViewportReady === 'true') {
      return () => {
        window.clearTimeout(popupPreferenceTimer);
        if (createdPopupGuard) document.getElementById(POPUP_GUARD_STYLE_ID)?.remove();
      };
    }

    let fallbackTimer = 0;

    const revealWhenLayoutReady = () => {
      const mobileReady = root.dataset.memberViewportMode === 'mobile';
      const desktopScaleApplied = body.dataset.memberDesktopScaled === 'true';
      const desktopNativeReady = body.dataset.memberDesktopScaled === 'false';
      if (!mobileReady && !desktopScaleApplied && !desktopNativeReady) return false;

      root.dataset.memberViewportReady = 'true';
      return true;
    };

    if (revealWhenLayoutReady()) {
      return () => {
        window.clearTimeout(popupPreferenceTimer);
        if (createdPopupGuard) document.getElementById(POPUP_GUARD_STYLE_ID)?.remove();
      };
    }

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
      window.clearTimeout(popupPreferenceTimer);
      if (createdPopupGuard) document.getElementById(POPUP_GUARD_STYLE_ID)?.remove();
    };
  }, []);

  return null;
}
