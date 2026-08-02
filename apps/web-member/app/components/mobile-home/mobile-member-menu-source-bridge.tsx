'use client';

import { useEffect } from 'react';

const MENU_OWNER = '[data-mobile-popup-owner="menu"]';
const BOTTOM_NAVIGATION = '[data-mobile-member-bottom-navigation="true"]';
const MOBILE_CATEGORY_EVENT = 'member:mobile-category-select';

const HOME_PATHS = new Set([
  '/',
  '/home',
  '/member/home',
  '/mobile/member/home',
]);

const MENU_ITEM_KEYS: ReadonlyArray<readonly [string, string]> = [
  ['แนะนำเพื่อน', 'referral'],
  ['รายได้คอมมิชชั่น', 'commission'],
  ['ประวัติ', 'history'],
  ['โปรโมชั่น', 'promotions'],
  ['กิจกรรม', 'activity'],
  ['คูปอง', 'coupon'],
  ['ถ่ายทอดสด', 'live'],
];

const INLINE_MEMBER_TABS = {
  promotions: {
    route: '/mobile/member/promotions',
    tabId: 'mobile-highlight-tab-1',
  },
  activity: {
    route: '/mobile/member/activity',
    tabId: 'mobile-highlight-tab-2',
  },
  news: {
    route: '/mobile/member/news',
    tabId: 'mobile-highlight-tab-3',
  },
} as const;

type InlineMemberTab = keyof typeof INLINE_MEMBER_TABS;

export default function MobileMemberMenuSourceBridge() {
  useEffect(() => {
    let scheduled = false;

    const syncBottomNavigation = () => {
      const navigation = document.querySelector<HTMLElement>(BOTTOM_NAVIGATION);
      const activeCategory = document.querySelector<HTMLElement>(
        '[data-mobile-category-id][aria-selected="true"]',
      )?.dataset.mobileCategoryId ?? 'home';
      const homeSurface = isHomePath(window.location.pathname) && activeCategory === 'home';
      const homeValue = homeSurface ? 'true' : 'false';

      if (document.documentElement.dataset.mobileMemberHomeSurface !== homeValue) {
        document.documentElement.dataset.mobileMemberHomeSurface = homeValue;
      }
      if (document.documentElement.dataset.mobileMemberNav !== homeValue) {
        document.documentElement.dataset.mobileMemberNav = homeValue;
      }

      if (!navigation) return;
      if (homeSurface) {
        navigation.hidden = false;
        navigation.removeAttribute('aria-hidden');
        navigation.style.removeProperty('display');
        navigation.style.removeProperty('pointer-events');
      } else {
        navigation.hidden = true;
        navigation.setAttribute('aria-hidden', 'true');
        navigation.style.setProperty('display', 'none', 'important');
        navigation.style.setProperty('pointer-events', 'none', 'important');
      }
    };

    const syncMenuPopup = () => {
      const dialog = document.querySelector<HTMLElement>(MENU_OWNER);
      if (!dialog) return;

      dialog.dataset.mobileMenuSource = 'true';
      dialog.style.setProperty('box-sizing', 'border-box', 'important');
      dialog.style.setProperty('width', 'min(480px, calc(100vw - 32px))', 'important');
      dialog.style.setProperty('max-width', 'min(480px, calc(100vw - 32px))', 'important');
      dialog.style.setProperty('height', 'auto', 'important');
      dialog.style.setProperty('transform', 'none', 'important');
      dialog.style.setProperty('scale', 'none', 'important');
      dialog.style.setProperty('zoom', '1', 'important');

      const content = dialog.querySelector<HTMLElement>(':scope > div:last-child');
      content?.style.setProperty('width', '100%', 'important');
      content?.style.setProperty('min-width', '0', 'important');
      content?.style.setProperty('max-width', 'none', 'important');
      content?.style.setProperty('overflow', 'visible', 'important');

      const items = Array.from(content?.querySelectorAll<HTMLButtonElement>(':scope > div > button') ?? []);
      items.forEach((item) => {
        const label = compactText(item.textContent ?? '');
        const key = MENU_ITEM_KEYS.find(([sourceLabel]) => label.includes(compactText(sourceLabel)))?.[1];
        if (!key) return;
        item.dataset.sourceMemberMenuItem = key;
        item.dataset.sourceMemberMenuLabel = label;
      });
    };

    const syncInlineTabs = () => {
      for (const key of Object.keys(INLINE_MEMBER_TABS) as InlineMemberTab[]) {
        const button = document.getElementById(INLINE_MEMBER_TABS[key].tabId);
        if (!(button instanceof HTMLButtonElement)) continue;
        protectInlineTabButton(button, key);
      }
    };

    const syncAll = () => {
      syncBottomNavigation();
      syncMenuPopup();
      syncInlineTabs();
    };

    const scheduleSync = () => {
      if (scheduled) return;
      scheduled = true;
      queueMicrotask(() => {
        scheduled = false;
        syncAll();
      });
    };

    const selectInlineTab = (key: InlineMemberTab) => {
      const button = document.getElementById(INLINE_MEMBER_TABS[key].tabId);
      if (!(button instanceof HTMLButtonElement)) return;

      protectInlineTabButton(button, key);
      button.click();
      button.focus({ preventScroll: true });

      window.requestAnimationFrame(() => {
        document.querySelector<HTMLElement>('[data-mobile-section-owner="highlight-tabs"]')
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    };

    const handleInlineNavigation = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      if (!isHomePath(window.location.pathname)) return;
      if (!document.querySelector('[data-mobile-home-root="true"]')) return;

      const highlightButton = event.target.closest<HTMLButtonElement>(
        '[data-mobile-section-owner="highlight-tabs"] button[id^="mobile-highlight-tab-"]',
      );
      if (highlightButton) {
        const key = inlineTabFromButton(highlightButton);
        if (key) protectInlineTabButton(highlightButton, key);
        return;
      }

      const anchor = event.target.closest<HTMLAnchorElement>('a[href]');
      if (anchor && !anchor.download && (!anchor.target || anchor.target === '_self')) {
        const destination = new URL(anchor.href, window.location.href);
        if (destination.origin === window.location.origin) {
          const key = inlineTabFromPath(destination.pathname);
          if (key) {
            event.preventDefault();
            event.stopImmediatePropagation();
            closeLegacyDrawer();
            selectInlineTab(key);
            return;
          }
        }
      }

      const popupItem = event.target.closest<HTMLButtonElement>(
        `${MENU_OWNER} button[data-source-member-menu-item]`,
      );
      const popupKey = popupItem
        ? inlineTabFromMenuKey(popupItem.dataset.sourceMemberMenuItem)
        : null;
      if (!popupItem || !popupKey) return;

      event.preventDefault();
      event.stopImmediatePropagation();
      document.querySelector<HTMLButtonElement>(`${MENU_OWNER} button[aria-label="ปิด"]`)?.click();
      queueMicrotask(() => selectInlineTab(popupKey));
    };

    const handleClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;

      const popupItem = event.target.closest<HTMLButtonElement>(
        `${MENU_OWNER} button[data-source-member-menu-item]`,
      );
      if (!popupItem) return;

      const sourceLabel = popupItem.dataset.sourceMemberMenuLabel ?? compactText(popupItem.textContent ?? '');
      const drawerAction = findMemberDrawerAction(sourceLabel);
      if (!drawerAction) return;

      event.preventDefault();
      event.stopImmediatePropagation();
      document.querySelector<HTMLButtonElement>(`${MENU_OWNER} button[aria-label="ปิด"]`)?.click();
      queueMicrotask(() => drawerAction.click());
    };

    const observer = new MutationObserver(scheduleSync);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['aria-selected', 'data-mobile-member-nav'],
      childList: true,
      subtree: true,
    });

    syncAll();
    window.addEventListener('click', handleInlineNavigation, true);
    document.addEventListener('click', handleClick, true);
    window.addEventListener(MOBILE_CATEGORY_EVENT, scheduleSync);
    window.addEventListener('popstate', scheduleSync);
    window.addEventListener('hashchange', scheduleSync);
    window.addEventListener('resize', scheduleSync, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener('click', handleInlineNavigation, true);
      document.removeEventListener('click', handleClick, true);
      window.removeEventListener(MOBILE_CATEGORY_EVENT, scheduleSync);
      window.removeEventListener('popstate', scheduleSync);
      window.removeEventListener('hashchange', scheduleSync);
      window.removeEventListener('resize', scheduleSync);
      delete document.documentElement.dataset.mobileMemberHomeSurface;
    };
  }, []);

  return (
    <style jsx global>{`
      @media (max-width: 900px) {
        html[data-mobile-member-home-surface='false'] ${BOTTOM_NAVIGATION} {
          display: none !important;
          pointer-events: none !important;
        }

        html[data-mobile-member-home-surface='false'] body {
          padding-bottom: 0 !important;
        }

        ${MENU_OWNER}[data-mobile-menu-source='true'] {
          box-sizing: border-box !important;
          width: min(480px, calc(100vw - 32px)) !important;
          max-width: min(480px, calc(100vw - 32px)) !important;
          height: auto !important;
          max-height: calc(100dvh - 32px) !important;
          padding: 56px 16px 16px !important;
          align-items: center !important;
          gap: 24px !important;
          overflow: hidden !important;
          border-radius: 10px !important;
          background: linear-gradient(0deg, rgb(27 24 36) -5.86%, rgb(63 59 75) 104.05%) !important;
          box-shadow: 0 1px 24px 4px rgb(90 90 90 / 20%) !important;
          transform: none !important;
          scale: none !important;
          zoom: 1 !important;
        }

        ${MENU_OWNER}[data-mobile-menu-source='true'] > div:last-child {
          box-sizing: border-box !important;
          width: 100% !important;
          min-width: 0 !important;
          max-width: none !important;
          height: auto !important;
          max-height: none !important;
          overflow: visible !important;
        }

        ${MENU_OWNER}[data-mobile-menu-source='true'] > div:last-child > div {
          display: grid !important;
          box-sizing: border-box !important;
          width: 100% !important;
          min-width: 0 !important;
          grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
          justify-content: start !important;
          align-items: start !important;
          gap: 8px !important;
          text-align: center !important;
        }

        ${MENU_OWNER}[data-mobile-menu-source='true'] button[data-source-member-menu-item] {
          display: flex !important;
          box-sizing: border-box !important;
          width: 100% !important;
          min-width: 0 !important;
          height: auto !important;
          min-height: 0 !important;
          padding: 0 0 8px !important;
          flex-direction: column !important;
          justify-content: flex-start !important;
          align-items: center !important;
          gap: 8px !important;
          border: 0 !important;
          color: #fff !important;
          background: transparent !important;
          font: inherit !important;
          cursor: pointer !important;
          -webkit-tap-highlight-color: transparent;
        }

        ${MENU_OWNER}[data-mobile-menu-source='true'] button[data-source-member-menu-item] > span:first-child {
          position: relative !important;
          display: grid !important;
          box-sizing: border-box !important;
          width: 50px !important;
          height: 50px !important;
          flex: 0 0 50px !important;
          place-items: center !important;
          overflow: visible !important;
          border-radius: 10px !important;
          background: linear-gradient(145deg, rgb(70 62 91), rgb(43 38 55)) !important;
          box-shadow:
            rgb(68 61 91) 0 2px 4px 0 inset,
            rgb(0 0 0 / 24.7%) 0 4px 4px 0,
            rgb(0 0 0 / 24.7%) 0 -2px 1px 0 inset,
            rgb(0 0 0 / 24.7%) 0 4px 4px 0 !important;
        }

        ${MENU_OWNER}[data-mobile-menu-source='true'] button[data-source-member-menu-item] > span:first-child > img {
          position: absolute !important;
          inset: 0 !important;
          display: block !important;
          box-sizing: border-box !important;
          width: 100% !important;
          height: 100% !important;
          padding: 9px !important;
          object-fit: contain !important;
          transform: rotate(30deg) scale(1.15);
          transform-origin: center;
          transition: transform 300ms ease;
        }

        ${MENU_OWNER}[data-mobile-menu-source='true'] button[data-source-member-menu-item]:hover > span:first-child > img,
        ${MENU_OWNER}[data-mobile-menu-source='true'] button[data-source-member-menu-item]:focus-visible > span:first-child > img,
        ${MENU_OWNER}[data-mobile-menu-source='true'] button[data-source-member-menu-item]:active > span:first-child > img {
          transform: rotate(0deg) scale(1.3);
        }

        ${MENU_OWNER}[data-mobile-menu-source='true'] button[data-source-member-menu-item] > span:last-child {
          display: block !important;
          width: 50px !important;
          max-width: 100% !important;
          overflow: visible !important;
          color: #fff !important;
          font-size: 9px !important;
          font-weight: 400 !important;
          line-height: 16px !important;
          text-align: center !important;
          text-overflow: clip !important;
          white-space: nowrap !important;
        }

        ${MENU_OWNER}[data-mobile-menu-source='true'] button[data-source-member-menu-item='live'] > span:first-child::after {
          position: absolute;
          right: 4px;
          bottom: 3px;
          z-index: 4;
          display: flex;
          min-width: 29px;
          height: 15px;
          padding: 0 2px;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          color: #fff;
          background: linear-gradient(180deg, #ed187b, #a600cb);
          box-shadow: 0 2px 6px rgb(201 0 190 / 45%);
          content: 'LIVE';
          font-size: 9px;
          font-weight: 900;
          line-height: 15px;
        }
      }

      @media (min-width: 360px) and (max-width: 900px) {
        ${MENU_OWNER}[data-mobile-menu-source='true'] button[data-source-member-menu-item] > span:first-child {
          width: 70px !important;
          height: 70px !important;
          flex-basis: 70px !important;
        }

        ${MENU_OWNER}[data-mobile-menu-source='true'] button[data-source-member-menu-item] > span:first-child > img {
          padding: 12px !important;
        }

        ${MENU_OWNER}[data-mobile-menu-source='true'] button[data-source-member-menu-item] > span:last-child {
          width: auto !important;
          font-size: 11px !important;
        }
      }

      @media (min-width: 640px) and (max-width: 900px) {
        ${MENU_OWNER}[data-mobile-menu-source='true'] button[data-source-member-menu-item] > span:last-child {
          font-size: 12px !important;
        }
      }
    `}</style>
  );
}

function isHomePath(pathname: string) {
  const normalized = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  return HOME_PATHS.has(normalized);
}

function compactText(value: string) {
  return value.replace(/\s+/g, '').trim();
}

function inlineTabFromPath(pathname: string): InlineMemberTab | null {
  const normalized = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  for (const key of Object.keys(INLINE_MEMBER_TABS) as InlineMemberTab[]) {
    if (INLINE_MEMBER_TABS[key].route === normalized) return key;
  }
  return null;
}

function inlineTabFromMenuKey(value: string | undefined): InlineMemberTab | null {
  if (value === 'promotions') return 'promotions';
  if (value === 'activity') return 'activity';
  if (value === 'news') return 'news';
  return null;
}

function inlineTabFromButton(button: HTMLButtonElement): InlineMemberTab | null {
  for (const key of Object.keys(INLINE_MEMBER_TABS) as InlineMemberTab[]) {
    if (INLINE_MEMBER_TABS[key].tabId === button.id) return key;
  }
  return null;
}

function protectInlineTabButton(button: HTMLButtonElement, key: InlineMemberTab) {
  const currentLabel = (button.getAttribute('aria-label') || button.textContent || '').replace(/\u2060/g, '');
  const protectedLabel = currentLabel
    .replace('โปรโมชั่น', 'โปร\u2060โมชั่น')
    .replace('กิจกรรม', 'กิจ\u2060กรรม')
    .replace('ข่าวสาร', 'ข่าว\u2060สาร');

  button.dataset.mobileInlineContentTab = key;
  if (!button.getAttribute('aria-label')) button.setAttribute('aria-label', currentLabel);
  if (button.textContent !== protectedLabel) button.textContent = protectedLabel;
}

function findMemberDrawerAction(sourceLabel: string) {
  const normalizedSource = compactText(sourceLabel);
  return Array.from(document.querySelectorAll<HTMLElement>(
    '#mobile-home-drawer nav a, #mobile-home-drawer nav button',
  )).find((candidate) => {
    const candidateLabel = compactText(candidate.textContent ?? '');
    return candidateLabel === normalizedSource
      || candidateLabel.includes(normalizedSource)
      || normalizedSource.includes(candidateLabel);
  }) ?? null;
}

function closeLegacyDrawer() {
  document.querySelector<HTMLButtonElement>(
    '#mobile-home-drawer button[aria-label="ปิดเมนู"]',
  )?.click();
}
