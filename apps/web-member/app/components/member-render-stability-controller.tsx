'use client';

import { useLayoutEffect } from 'react';

const REVEAL_FALLBACK_MS = 1200;
const POPUP_PREFERENCE_SETTLE_MS = 120;
const POPUP_GUARD_STYLE_ID = 'member-popup-preference-guard';
const OVERLAY_CONTRACT_STYLE_ID = 'member-overlay-contract-final';
const ACTIVE_OVERLAY_ATTRIBUTE = 'data-member-active-overlay';
const MEMBER_POPOVER_SELECTOR = [
  '.public-member-profile-popover',
  '.public-member-notification-popover',
  '.public-member-profile-popover--portal',
].join(',');
const MEMBER_HEADER_LAYER_SELECTOR = [
  '.public-member-actions',
  '.public-member-profile-trigger',
  '.public-member-icon-button',
  MEMBER_POPOVER_SELECTOR,
].join(',');

const OVERLAY_CONTRACT_CSS = `
@media (min-width: 901px) {
  .sticky.top-0:has(.public-member-actions) {
    z-index: 120 !important;
    overflow: visible !important;
  }

  .public-member-actions,
  .public-member-notification-anchor,
  .public-member-profile-anchor {
    z-index: 130 !important;
  }

  .public-member-notification-popover,
  .public-member-profile-popover,
  .public-member-profile-popover--portal {
    z-index: 140 !important;
  }
}

html[data-member-overlay-open='true'],
html[data-member-overlay-open='true'] body {
  overflow: hidden !important;
  overscroll-behavior: none !important;
}

html[data-member-overlay-open='true'] #member-desktop-scale-shell,
html[data-member-overlay-open='true'] #member-desktop-scale-canvas {
  max-height: 100dvh !important;
  overflow: hidden !important;
}

html[data-member-overlay-open='true'] .sticky.top-0:has(.public-member-actions),
html[data-member-overlay-open='true'] .public-member-actions,
html[data-member-overlay-open='true'] .public-member-notification-anchor,
html[data-member-overlay-open='true'] .public-member-profile-anchor {
  z-index: 10 !important;
  pointer-events: none !important;
}

html[data-member-overlay-open='true'] .public-member-notification-popover,
html[data-member-overlay-open='true'] .public-member-profile-popover,
html[data-member-overlay-open='true'] .public-member-profile-popover--portal {
  display: none !important;
  visibility: hidden !important;
  pointer-events: none !important;
}

html[data-member-overlay-open='true'] body > [${ACTIVE_OVERLAY_ATTRIBUTE}='true'] {
  position: fixed !important;
  inset: 0 !important;
  z-index: 2147483600 !important;
  width: 100vw !important;
  height: 100dvh !important;
  max-width: none !important;
  max-height: none !important;
  background-color: rgb(0 0 0 / 78%) !important;
  backdrop-filter: blur(4px) !important;
  overscroll-behavior: contain !important;
}

html[data-member-overlay-open='true'] body > [${ACTIVE_OVERLAY_ATTRIBUTE}='true'] [role='dialog'][aria-modal='true'] {
  min-width: 0 !important;
  max-width: min(1120px, calc(100vw - 32px)) !important;
  max-height: calc(100dvh - 32px) !important;
}

html[data-member-overlay-open='true'] body > [${ACTIVE_OVERLAY_ATTRIBUTE}='true'] [role='dialog'][aria-modal='true'] button[aria-label='ปิด'],
html[data-member-overlay-open='true'] body > [${ACTIVE_OVERLAY_ATTRIBUTE}='true'] [role='dialog'][aria-modal='true'] button[aria-label='Close'],
html[data-member-overlay-open='true'] body > [${ACTIVE_OVERLAY_ATTRIBUTE}='true'] [role='dialog'][aria-modal='true'] button[class*='close'],
html[data-member-overlay-open='true'] body > [${ACTIVE_OVERLAY_ATTRIBUTE}='true'] button[class*='popup__close'],
html[data-member-overlay-open='true'] body > [${ACTIVE_OVERLAY_ATTRIBUTE}='true'] button[class*='modal__close'] {
  box-sizing: border-box !important;
  min-width: 40px !important;
  min-height: 40px !important;
  display: inline-grid !important;
  place-items: center !important;
  padding: 8px !important;
  cursor: pointer !important;
}

html[data-member-overlay-open='true'] body > [${ACTIVE_OVERLAY_ATTRIBUTE}='true'] button[aria-label='ปิด'] img,
html[data-member-overlay-open='true'] body > [${ACTIVE_OVERLAY_ATTRIBUTE}='true'] button[aria-label='Close'] img,
html[data-member-overlay-open='true'] body > [${ACTIVE_OVERLAY_ATTRIBUTE}='true'] button[class*='close'] img,
html[data-member-overlay-open='true'] body > [${ACTIVE_OVERLAY_ATTRIBUTE}='true'] button[class*='close'] svg {
  width: 20px !important;
  height: 20px !important;
}

@media (max-width: 900px) {
  html[data-member-overlay-open='true'] body > [${ACTIVE_OVERLAY_ATTRIBUTE}='true'] [role='dialog'][aria-modal='true'] {
    max-width: calc(100vw - 20px) !important;
    max-height: calc(100dvh - 20px) !important;
  }
}
`;

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

  useLayoutEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    let activeOverlay: HTMLElement | null = null;
    let syncFrame = 0;
    let createdStyle = false;

    if (!document.getElementById(OVERLAY_CONTRACT_STYLE_ID)) {
      const style = document.createElement('style');
      style.id = OVERLAY_CONTRACT_STYLE_ID;
      style.textContent = OVERLAY_CONTRACT_CSS;
      document.head.appendChild(style);
      createdStyle = true;
    }

    const findOverlay = () => {
      const children = Array.from(body.children).reverse();
      return children.find((element): element is HTMLElement => isBlockingOverlay(element)) ?? null;
    };

    const closeMemberLayers = () => {
      const expanded = document.querySelectorAll<HTMLElement>(
        '.public-member-profile-trigger[aria-expanded="true"], .public-member-icon-button[aria-expanded="true"]',
      );
      expanded.forEach((trigger) => trigger.click());
    };

    const syncOverlay = () => {
      syncFrame = 0;
      const nextOverlay = findOverlay();
      if (nextOverlay === activeOverlay) return;

      activeOverlay?.removeAttribute(ACTIVE_OVERLAY_ATTRIBUTE);

      if (nextOverlay) {
        closeMemberLayers();
        nextOverlay.setAttribute(ACTIVE_OVERLAY_ATTRIBUTE, 'true');
        root.dataset.memberOverlayOpen = 'true';
      } else {
        delete root.dataset.memberOverlayOpen;
      }

      activeOverlay = nextOverlay;
    };

    const scheduleSync = () => {
      if (syncFrame) return;
      syncFrame = window.requestAnimationFrame(syncOverlay);
    };

    const blockMemberLayerWhileModalOpen = (event: Event) => {
      if (!activeOverlay) return;
      const target = event.target;
      if (!(target instanceof Element) || !target.closest(MEMBER_HEADER_LAYER_SELECTOR)) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    };

    const preventBackgroundScroll = (event: Event) => {
      if (!activeOverlay) return;
      const target = event.target;
      if (target instanceof Node && activeOverlay.contains(target)) return;
      event.preventDefault();
    };

    const observer = new MutationObserver(scheduleSync);
    observer.observe(body, { childList: true });
    document.addEventListener('pointerdown', blockMemberLayerWhileModalOpen, true);
    document.addEventListener('click', blockMemberLayerWhileModalOpen, true);
    document.addEventListener('wheel', preventBackgroundScroll, { capture: true, passive: false });
    document.addEventListener('touchmove', preventBackgroundScroll, { capture: true, passive: false });

    syncOverlay();

    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(syncFrame);
      activeOverlay?.removeAttribute(ACTIVE_OVERLAY_ATTRIBUTE);
      delete root.dataset.memberOverlayOpen;
      document.removeEventListener('pointerdown', blockMemberLayerWhileModalOpen, true);
      document.removeEventListener('click', blockMemberLayerWhileModalOpen, true);
      document.removeEventListener('wheel', preventBackgroundScroll, true);
      document.removeEventListener('touchmove', preventBackgroundScroll, true);
      if (createdStyle) document.getElementById(OVERLAY_CONTRACT_STYLE_ID)?.remove();
    };
  }, []);

  return null;
}

function isBlockingOverlay(element: Element): element is HTMLElement {
  if (!(element instanceof HTMLElement)) return false;
  if (element.matches(MEMBER_POPOVER_SELECTOR)) return false;
  if (element.matches('.member-floating-contact, [data-member-floating-contact]')) return false;

  const className = typeof element.className === 'string' ? element.className : '';
  if (element.matches('.home-promotion-popup, [data-member-layer-keeps-profile-open="true"], [data-member-shared-popup="true"]')) return true;
  if (/(?:^|\s)[^\s]*(?:backdrop|modal-overlay|popup-overlay)(?:\s|$)/i.test(className)) return true;
  return Boolean(element.querySelector(':scope > [role="dialog"][aria-modal="true"]'));
}
