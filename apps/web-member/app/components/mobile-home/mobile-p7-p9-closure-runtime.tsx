'use client';

import { useLayoutEffect } from 'react';

type MobileClosurePhase = 'p7' | 'p8' | 'p9';

type MobileP7P9ClosureRuntimeProps = {
  phase?: MobileClosurePhase;
  route?: string;
};

const AUTH_OVERLAY_SELECTOR = '.member-auth-overlay[data-state="open"]';
const DIALOG_SELECTOR = [
  '[data-ui-owner="mobile-popup"] [role="dialog"]',
  '[data-mobile-popup-owner][role="dialog"]',
  '[data-mobile-member-page] [role="dialog"][aria-modal="true"]',
].join(',');
const CLOSE_SELECTOR = [
  'button[aria-label="ปิด"]',
  'button[aria-label="Close"]',
  'button[aria-label*="ปิด"]',
  '[data-mobile-popup-close="true"]',
].join(',');
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'iframe',
  '[tabindex]:not([tabindex="-1"])',
].join(',');
const P7_ROUTES = new Set(['/', '/home', '/member/home', '/mobile/member/home']);
const P8_ROUTES = new Set([
  '/guide',
  '/promotions',
  '/news',
  '/activity',
  '/mobile/member/promotions',
  '/mobile/member/news',
  '/mobile/member/activity',
  '/mobile/member/guide',
]);
const P9_ROUTES = new Set([
  '/deposit',
  '/withdraw',
  '/bank-accounts',
  '/transactions',
  '/mobile/member/deposit',
  '/mobile/member/withdraw',
  '/mobile/member/bank-accounts',
  '/mobile/member/history',
]);

export default function MobileP7P9ClosureRuntime({
  phase,
  route,
}: MobileP7P9ClosureRuntimeProps = {}) {
  useLayoutEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const normalizedRoute = normalizePath(route ?? window.location.pathname);
    const resolvedPhase = phase ?? phaseForRoute(normalizedRoute);
    if (!resolvedPhase) return;

    let activeOverlay: HTMLElement | null = null;
    let returnFocus: HTMLElement | null = null;
    let authOverlayWasOpen = false;
    let previousBodyOverflow = '';
    let previousBodyOverscroll = '';
    let previousHtmlOverflow = '';
    let scheduled = false;

    html.dataset.mobileP7P9Phase = resolvedPhase;
    html.dataset.mobileP7P9Route = normalizedRoute;
    html.dataset.mobileP7P9Ready = 'true';

    const scheduleSync = () => {
      if (scheduled) return;
      scheduled = true;
      queueMicrotask(() => {
        scheduled = false;
        syncOverlay();
      });
    };

    const syncOverlay = () => {
      const authOverlay = document.querySelector<HTMLElement>(AUTH_OVERLAY_SELECTOR);
      const dialog = lastVisible(document.querySelectorAll<HTMLElement>(DIALOG_SELECTOR));
      const nextOverlay = authOverlay ?? dialog;

      if (nextOverlay && nextOverlay !== activeOverlay) {
        if (!activeOverlay) {
          returnFocus = document.activeElement instanceof HTMLElement
            ? document.activeElement
            : null;
          previousBodyOverflow = body.style.overflow;
          previousBodyOverscroll = body.style.overscrollBehavior;
          previousHtmlOverflow = html.style.overflow;
        }

        activeOverlay = nextOverlay;
        authOverlayWasOpen ||= Boolean(authOverlay);
        html.dataset.mobileOverlayOpen = 'true';
        html.dataset.mobileOverlayOwner = authOverlay ? 'auth' : 'popup';
        body.style.overflow = 'hidden';
        body.style.overscrollBehavior = 'none';
        html.style.overflow = 'hidden';

        window.requestAnimationFrame(() => {
          firstFocusable(nextOverlay)?.focus({ preventScroll: true });
        });
        return;
      }

      if (nextOverlay) return;
      if (!activeOverlay) {
        html.dataset.mobileOverlayOpen = 'false';
        return;
      }

      activeOverlay = null;
      html.dataset.mobileOverlayOpen = 'false';
      delete html.dataset.mobileOverlayOwner;
      body.style.overflow = previousBodyOverflow;
      body.style.overscrollBehavior = previousBodyOverscroll;
      html.style.overflow = previousHtmlOverflow;

      if (authOverlayWasOpen) {
        cleanupAuthQuery();
        authOverlayWasOpen = false;
      }

      const focusTarget = returnFocus;
      returnFocus = null;
      window.requestAnimationFrame(() => {
        if (focusTarget?.isConnected) focusTarget.focus({ preventScroll: true });
      });
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!activeOverlay) return;

      if (event.key === 'Escape') {
        const closeButton = activeOverlay.querySelector<HTMLButtonElement>(CLOSE_SELECTOR);
        if (closeButton) {
          event.preventDefault();
          closeButton.click();
          scheduleSync();
        }
        return;
      }

      if (event.key !== 'Tab') return;
      const focusable = getFocusable(activeOverlay);
      if (focusable.length === 0) {
        event.preventDefault();
        activeOverlay.setAttribute('tabindex', '-1');
        activeOverlay.focus({ preventScroll: true });
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus({ preventScroll: true });
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus({ preventScroll: true });
      }
    };

    const observer = new MutationObserver(scheduleSync);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-state', 'aria-hidden', 'hidden', 'class'],
      childList: true,
      subtree: true,
    });
    window.addEventListener('keydown', handleKeyDown, true);
    syncOverlay();

    return () => {
      observer.disconnect();
      window.removeEventListener('keydown', handleKeyDown, true);
      body.style.overflow = previousBodyOverflow;
      body.style.overscrollBehavior = previousBodyOverscroll;
      html.style.overflow = previousHtmlOverflow;
      delete html.dataset.mobileP7P9Phase;
      delete html.dataset.mobileP7P9Route;
      delete html.dataset.mobileP7P9Ready;
      delete html.dataset.mobileOverlayOpen;
      delete html.dataset.mobileOverlayOwner;
    };
  }, [phase, route]);

  return (
    <style jsx global>{`
      @media (max-width: 900px) {
        html[data-mobile-p7-p9-phase] {
          width: 100% !important;
          max-width: 100% !important;
          overflow-x: hidden !important;
        }

        html[data-mobile-p7-p9-phase] body,
        html[data-mobile-p7-p9-phase] #member-desktop-scale-shell,
        html[data-mobile-p7-p9-phase] #member-desktop-scale-canvas {
          box-sizing: border-box !important;
          width: 100% !important;
          min-width: 0 !important;
          max-width: 100% !important;
          overflow-x: clip !important;
        }

        html[data-mobile-p7-p9-phase] [data-mobile-member-page],
        html[data-mobile-p7-p9-phase] .member-finance-page,
        html[data-mobile-p7-p9-phase] main:has(> a[href='/']) {
          box-sizing: border-box !important;
          width: 100% !important;
          min-width: 0 !important;
          max-width: 100vw !important;
          margin-inline: auto !important;
          overflow-x: clip !important;
        }

        html[data-mobile-p7-p9-phase] [data-mobile-member-page] *,
        html[data-mobile-p7-p9-phase] .member-finance-page *,
        html[data-mobile-p7-p9-phase] main:has(> a[href='/']) * {
          box-sizing: border-box;
          min-width: 0;
        }

        html[data-mobile-p7-p9-phase] .member-finance-page input,
        html[data-mobile-p7-p9-phase] .member-finance-page select,
        html[data-mobile-p7-p9-phase] .member-finance-page textarea,
        html[data-mobile-p7-p9-phase] main:has(> a[href='/']) input,
        html[data-mobile-p7-p9-phase] main:has(> a[href='/']) select,
        html[data-mobile-p7-p9-phase] main:has(> a[href='/']) textarea {
          width: 100% !important;
          max-width: 100% !important;
        }

        html[data-mobile-p7-p9-phase] .member-finance-summary,
        html[data-mobile-p7-p9-phase] .member-transaction-card__balance,
        html[data-mobile-p7-p9-phase] .member-bank-layout,
        html[data-mobile-p7-p9-phase] .member-bank-card__row {
          grid-template-columns: minmax(0, 1fr) !important;
        }

        html[data-mobile-p7-p9-phase] .member-auth-overlay,
        html[data-mobile-p7-p9-phase] [data-ui-owner='mobile-popup'] {
          box-sizing: border-box !important;
          width: 100vw !important;
          max-width: 100vw !important;
          height: 100dvh !important;
          max-height: 100dvh !important;
          padding-top: env(safe-area-inset-top, 0px) !important;
          padding-right: env(safe-area-inset-right, 0px) !important;
          padding-bottom: env(safe-area-inset-bottom, 0px) !important;
          padding-left: env(safe-area-inset-left, 0px) !important;
          overflow: hidden !important;
          overscroll-behavior: contain !important;
        }

        html[data-mobile-p7-p9-phase] [data-mobile-popup-owner][role='dialog'],
        html[data-mobile-p7-p9-phase] [data-mobile-member-page] [role='dialog'][aria-modal='true'] {
          box-sizing: border-box !important;
          width: min(100%, 480px) !important;
          min-width: 0 !important;
          max-width: calc(100vw - 24px) !important;
          max-height: calc(100dvh - 24px - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px)) !important;
          overflow-x: clip !important;
          overflow-y: auto !important;
          overscroll-behavior: contain !important;
          -webkit-overflow-scrolling: touch;
        }

        html[data-mobile-p7-p9-phase] :is(
          [data-mobile-popup-owner],
          [data-mobile-member-page],
          .member-finance-page
        ) :focus-visible {
          outline: 2px solid #d98cff !important;
          outline-offset: 2px !important;
        }
      }

      @supports not (overflow: clip) {
        @media (max-width: 900px) {
          html[data-mobile-p7-p9-phase] body,
          html[data-mobile-p7-p9-phase] #member-desktop-scale-shell,
          html[data-mobile-p7-p9-phase] #member-desktop-scale-canvas,
          html[data-mobile-p7-p9-phase] [data-mobile-member-page],
          html[data-mobile-p7-p9-phase] .member-finance-page {
            overflow-x: hidden !important;
          }
        }
      }
    `}</style>
  );
}

function phaseForRoute(route: string): MobileClosurePhase | null {
  if (P9_ROUTES.has(route)) return 'p9';
  if (P8_ROUTES.has(route)) return 'p8';
  if (P7_ROUTES.has(route)) return 'p7';
  return null;
}

function normalizePath(pathname: string) {
  return pathname.replace(/\/+$/, '') || '/';
}

function cleanupAuthQuery() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has('auth') && !url.searchParams.has('next')) return;
  url.searchParams.delete('auth');
  url.searchParams.delete('next');
  const search = url.searchParams.toString();
  window.history.replaceState(window.history.state, '', `${url.pathname}${search ? `?${search}` : ''}${url.hash}`);
}

function lastVisible(elements: NodeListOf<HTMLElement>) {
  return Array.from(elements).reverse().find(isVisible) ?? null;
}

function isVisible(element: HTMLElement) {
  if (element.hidden || element.getAttribute('aria-hidden') === 'true') return false;
  const style = window.getComputedStyle(element);
  return style.display !== 'none' && style.visibility !== 'hidden';
}

function getFocusable(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
    .filter((element) => !element.hidden && element.getAttribute('aria-hidden') !== 'true' && element.getClientRects().length > 0);
}

function firstFocusable(container: HTMLElement) {
  return getFocusable(container)[0] ?? container;
}
