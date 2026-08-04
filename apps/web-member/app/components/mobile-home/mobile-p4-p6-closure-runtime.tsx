'use client';

import { useEffect } from 'react';
import {
  getMemberGameCatalog,
  type MemberCatalogGame,
} from '../../lib/member-game-catalog';

const CATEGORY_EVENT = 'member:mobile-category-select';
const ROOT_SELECTOR = '[data-mobile-home-root="true"]';
const CATEGORY_SELECTOR = '[data-mobile-category-id]';
const BOTTOM_NAV_SELECTOR = '[data-mobile-member-bottom-navigation="true"]';
const DRAWER_TRIGGER_SELECTOR = 'button[aria-controls="mobile-home-drawer"]';
const DRAWER_SELECTOR = '#mobile-home-drawer';
const DRAWER_CLOSE_SELECTOR = 'button[aria-label="ปิดเมนู"], button[aria-label="Close menu"]';
const GAME_ACTION_SELECTOR = '[data-game-id][data-provider-code]';
const HOME_PATHS = new Set(['/', '/home', '/member/home', '/mobile/member/home']);
const MOBILE_CATEGORY_IDS = new Set([
  'home',
  'casino',
  'slot',
  'fishing',
  'sport',
  'card',
  'lottery',
]);
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

type CatalogIndex = Map<string, MemberCatalogGame>;

export default function MobileP4P6ClosureRuntime() {
  useEffect(() => {
    let disposed = false;
    let scheduled = false;
    let drawerWasOpen = false;
    let drawerReturnFocus: HTMLElement | null = null;
    const catalogIndex: CatalogIndex = new Map();
    const html = document.documentElement;

    void getMemberGameCatalog('mobile')
      .then((items) => {
        if (disposed) return;
        indexCatalog(items, catalogIndex);
        prepareGameActions();
      })
      .catch(() => {
        // The canonical /games route can still resolve the item from its query.
      });

    const root = () => document.querySelector<HTMLElement>(ROOT_SELECTOR);
    const drawerTrigger = () => root()?.querySelector<HTMLButtonElement>(DRAWER_TRIGGER_SELECTOR) ?? null;
    const drawer = () => root()?.querySelector<HTMLElement>(DRAWER_SELECTOR) ?? null;

    const currentCategory = () => {
      const selected = root()?.querySelector<HTMLElement>(`${CATEGORY_SELECTOR}[aria-selected="true"]`)
        ?.dataset.mobileCategoryId;
      const stored = root()?.dataset.mobileActiveCategory;
      return isMobileCategoryId(selected) ? selected : isMobileCategoryId(stored) ? stored : 'home';
    };

    const isDrawerOpen = () => drawerTrigger()?.getAttribute('aria-expanded') === 'true';

    const syncHomeSurface = () => {
      const normalizedPath = normalizePath(window.location.pathname);
      const homeSurface = HOME_PATHS.has(normalizedPath)
        && currentCategory() === 'home'
        && !isDrawerOpen();
      const state = homeSurface ? 'true' : 'false';

      setDataset(html, 'mobileMemberHomeSurface', state);
      setDataset(html, 'mobileMemberNav', state);

      const navigation = document.querySelector<HTMLElement>(BOTTOM_NAV_SELECTOR);
      if (!navigation) return;

      if (homeSurface) {
        navigation.hidden = false;
        navigation.removeAttribute('aria-hidden');
      } else {
        navigation.hidden = true;
        navigation.setAttribute('aria-hidden', 'true');
      }
    };

    const prepareGameActions = () => {
      root()?.querySelectorAll<HTMLElement>(GAME_ACTION_SELECTOR).forEach((action) => {
        if (action.closest('a[href]')) return;
        action.dataset.mobileGameLaunch = 'canonical';
        action.dataset.gamePlatform = 'mobile';
      });
    };

    const syncDrawer = () => {
      const trigger = drawerTrigger();
      const panel = drawer();
      const open = Boolean(trigger && panel && trigger.getAttribute('aria-expanded') === 'true');

      setDataset(html, 'mobileDrawerOpen', open ? 'true' : 'false');

      if (panel) {
        panel.dataset.mobileDrawerOwner = 'p6';
        panel.setAttribute('role', 'dialog');
        panel.setAttribute('aria-modal', 'true');
        panel.setAttribute('tabindex', '-1');
      }

      if (open && !drawerWasOpen && panel) {
        drawerReturnFocus = document.activeElement instanceof HTMLElement
          ? document.activeElement
          : trigger;
        window.requestAnimationFrame(() => {
          firstFocusable(panel)?.focus({ preventScroll: true });
        });
      }

      if (!open && drawerWasOpen) {
        const returnTarget = drawerReturnFocus;
        drawerReturnFocus = null;
        window.requestAnimationFrame(() => {
          if (returnTarget?.isConnected) returnTarget.focus({ preventScroll: true });
        });
      }

      drawerWasOpen = open;
      syncHomeSurface();
    };

    const syncAll = () => {
      const owner = root();
      if (!owner) return;
      owner.dataset.mobileP4P6Ready = 'true';
      owner.dataset.mobileActiveCategory = currentCategory();
      prepareGameActions();
      syncDrawer();
      syncHomeSurface();
    };

    const scheduleSync = () => {
      if (scheduled || disposed) return;
      scheduled = true;
      queueMicrotask(() => {
        scheduled = false;
        syncAll();
      });
    };

    const dispatchCategory = (category: string) => {
      if (!isMobileCategoryId(category)) return;
      const owner = root();
      if (owner) owner.dataset.mobileActiveCategory = category;
      window.dispatchEvent(new CustomEvent(CATEGORY_EVENT, {
        detail: { category },
      }));
      syncHomeSurface();
    };

    const launchGame = (action: HTMLElement, event: MouseEvent) => {
      if (action.closest('a[href]')) return;

      const gameId = action.dataset.gameId?.trim() ?? '';
      const gameCode = action.dataset.gameCode?.trim() ?? '';
      const catalogGame = findCatalogGame(catalogIndex, gameId, gameCode);
      const provider = catalogGame?.provider
        || normalizeProviderCode(action.dataset.providerCode ?? '');
      const category = catalogGame?.category
        || action.dataset.gameCategory?.trim()
        || 'slot';
      const game = catalogGame?.id || gameId || gameCode;

      if (!provider || !game) return;

      event.preventDefault();
      event.stopPropagation();

      const query = new URLSearchParams({
        category,
        provider,
        game,
        platform: 'mobile',
      });
      window.location.assign(`/games?${query.toString()}`);
    };

    const handleClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;

      const categoryButton = event.target.closest<HTMLElement>(CATEGORY_SELECTOR);
      if (categoryButton) {
        const category = categoryButton.dataset.mobileCategoryId ?? '';
        queueMicrotask(() => dispatchCategory(category));
      }

      const gameAction = event.target.closest<HTMLElement>(GAME_ACTION_SELECTOR);
      if (gameAction) launchGame(gameAction, event);

      if (
        event.target.closest(DRAWER_TRIGGER_SELECTOR)
        || event.target.closest('[data-mobile-drawer-dismiss="true"]')
        || event.target.closest(`${DRAWER_SELECTOR} ${DRAWER_CLOSE_SELECTOR}`)
        || event.target.closest(`${DRAWER_SELECTOR} a[href]`)
      ) {
        scheduleSync();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const panel = drawer();
      if (!panel || !isDrawerOpen()) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        panel.querySelector<HTMLButtonElement>(DRAWER_CLOSE_SELECTOR)?.click();
        scheduleSync();
        return;
      }

      if (event.key !== 'Tab') return;
      const focusable = getFocusable(panel);
      if (focusable.length === 0) {
        event.preventDefault();
        panel.focus({ preventScroll: true });
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
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
      attributeFilter: ['aria-expanded', 'aria-selected'],
      childList: true,
      subtree: true,
    });

    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener(CATEGORY_EVENT, scheduleSync);
    window.addEventListener('popstate', scheduleSync);
    window.addEventListener('hashchange', scheduleSync);
    window.addEventListener('resize', scheduleSync, { passive: true });
    syncAll();

    return () => {
      disposed = true;
      observer.disconnect();
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener(CATEGORY_EVENT, scheduleSync);
      window.removeEventListener('popstate', scheduleSync);
      window.removeEventListener('hashchange', scheduleSync);
      window.removeEventListener('resize', scheduleSync);
      delete html.dataset.mobileDrawerOpen;
      delete html.dataset.mobileMemberHomeSurface;
      delete html.dataset.mobileMemberNav;
      const owner = root();
      if (owner) delete owner.dataset.mobileP4P6Ready;
    };
  }, []);

  return (
    <style jsx global>{`
      @media (max-width: 900px) {
        html[data-member-viewport-mode='mobile'] [data-mobile-home-root='true'] {
          box-sizing: border-box !important;
          width: min(100%, 640px) !important;
          min-width: 0 !important;
          max-width: 640px !important;
          overflow-x: clip !important;
          color: #fff !important;
          background: #171422 !important;
        }

        html[data-member-viewport-mode='mobile'] [data-mobile-home-root='true'] *,
        html[data-member-viewport-mode='mobile'] [data-mobile-home-root='true'] *::before,
        html[data-member-viewport-mode='mobile'] [data-mobile-home-root='true'] *::after {
          box-sizing: border-box;
        }

        html[data-member-viewport-mode='mobile'] [data-mobile-content-slot='after-highlight'],
        html[data-member-viewport-mode='mobile'] [data-mobile-section-owner='source-content'],
        html[data-member-viewport-mode='mobile'] [data-provider-games-stage] {
          width: 100% !important;
          min-width: 0 !important;
          max-width: 100% !important;
          overflow-x: clip !important;
        }

        html[data-member-viewport-mode='mobile'] [data-mobile-game-launch='canonical'] {
          min-width: 0 !important;
          min-height: 44px !important;
          color: inherit !important;
          text-decoration: none !important;
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
        }

        html[data-member-viewport-mode='mobile'] [data-mobile-drawer-owner='p6'] {
          width: min(428px, calc(100vw - env(safe-area-inset-right, 0px))) !important;
          height: 100dvh !important;
          max-height: 100dvh !important;
          padding-top: max(20px, env(safe-area-inset-top, 0px)) !important;
          padding-bottom: max(28px, env(safe-area-inset-bottom, 0px)) !important;
          overflow-x: clip !important;
          overflow-y: auto !important;
          overscroll-behavior: contain !important;
          scrollbar-width: none !important;
          -webkit-overflow-scrolling: touch;
        }

        html[data-member-viewport-mode='mobile'] [data-mobile-drawer-owner='p6'] a,
        html[data-member-viewport-mode='mobile'] [data-mobile-drawer-owner='p6'] button {
          min-height: 44px;
          touch-action: manipulation;
        }

        html[data-member-viewport-mode='mobile'] [data-mobile-drawer-owner='p6'] button[aria-label='ปิดเมนู'],
        html[data-member-viewport-mode='mobile'] [data-mobile-drawer-owner='p6'] button[aria-label='Close menu'] {
          width: 44px !important;
          height: 44px !important;
        }

        html[data-member-viewport-mode='mobile'] [data-mobile-drawer-owner='p6'] :focus-visible,
        html[data-member-viewport-mode='mobile'] [data-mobile-member-bottom-navigation='true'] :focus-visible,
        html[data-member-viewport-mode='mobile'] [data-mobile-game-launch='canonical']:focus-visible {
          outline: 2px solid #d98cff !important;
          outline-offset: 2px !important;
        }

        html[data-member-viewport-mode='mobile'] [data-mobile-member-bottom-navigation='true'] {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }

        html[data-member-viewport-mode='mobile'][data-mobile-member-home-surface='true'][data-mobile-drawer-open='false']
          [data-mobile-member-bottom-navigation='true'] {
          display: flex !important;
          visibility: visible !important;
          opacity: 1 !important;
          pointer-events: none !important;
        }

        html[data-member-viewport-mode='mobile'][data-mobile-member-home-surface='true'][data-mobile-drawer-open='false']
          [data-mobile-member-bottom-navigation='true'] > div {
          pointer-events: auto !important;
        }

        html[data-member-viewport-mode='mobile'][data-mobile-member-home-surface='true'][data-mobile-drawer-open='false']
          [data-mobile-member-bottom-navigation='true'] button {
          min-width: 44px !important;
          min-height: 60px !important;
          touch-action: manipulation;
        }

        html[data-member-viewport-mode='mobile'][data-mobile-member-home-surface='true'][data-mobile-drawer-open='false'] body {
          padding-bottom: calc(60px + env(safe-area-inset-bottom, 0px)) !important;
        }

        html[data-member-viewport-mode='mobile'][data-mobile-drawer-open='true'] body,
        html[data-member-viewport-mode='mobile'][data-mobile-member-home-surface='false'] body {
          padding-bottom: 0 !important;
        }
      }

      @supports not (overflow: clip) {
        @media (max-width: 900px) {
          html[data-member-viewport-mode='mobile'] [data-mobile-home-root='true'],
          html[data-member-viewport-mode='mobile'] [data-mobile-content-slot='after-highlight'],
          html[data-member-viewport-mode='mobile'] [data-mobile-section-owner='source-content'] {
            overflow-x: hidden !important;
          }
        }
      }
    `}</style>
  );
}

function indexCatalog(items: MemberCatalogGame[], index: CatalogIndex) {
  items.forEach((item) => {
    for (const key of [item.id, item.providerGameCode]) {
      const normalized = key.trim().toLowerCase();
      if (normalized) index.set(normalized, item);
    }
  });
}

function findCatalogGame(index: CatalogIndex, id: string, code: string) {
  return index.get(id.trim().toLowerCase())
    || index.get(code.trim().toLowerCase())
    || null;
}

function normalizeProviderCode(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\.(?:png|jpe?g|webp|svg)$/i, '')
    .replace(/[^a-z0-9_-]+/g, '');
}

function normalizePath(pathname: string) {
  return pathname.replace(/\/+$/, '') || '/';
}

function isMobileCategoryId(value: unknown): value is string {
  return typeof value === 'string' && MOBILE_CATEGORY_IDS.has(value);
}

function getFocusable(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
    .filter((element) => !element.hidden && element.getClientRects().length > 0);
}

function firstFocusable(container: HTMLElement) {
  return getFocusable(container)[0] ?? container;
}

function setDataset(element: HTMLElement, key: string, value: string) {
  if (element.dataset[key] !== value) element.dataset[key] = value;
}
