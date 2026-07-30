'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMemberSession } from '../../member-session-provider';

const GAME_ACTION_SELECTOR = [
  '[data-public-game-action="login"]',
  'a.source-highlight-hero__link',
  'a.source-highlight-game',
  'a.reference-game-tile',
  'a.source-popular-card',
  'a.source-online-card',
  '.v47-mobile-game-grid a',
  '.browse-source-game-cover',
  '.browse-source-game-card footer button',
  '[data-game-id]',
  '[data-game-code]',
].join(',');

const EXCLUDED_SELECTOR = [
  '.public-home-topbar',
  '.member-desktop-nav',
  '.member-bottom-nav',
  '.browse-source-category-nav',
  '.browse-source-provider-row',
  '.browse-source-filter-panel',
  '.browse-source-panel-heading',
  '.reference-panel-heading',
  '.source-feed-heading',
  '.v47-mobile-section-title',
  '.browse-source-favorite',
  '[aria-label*="รายการโปรด"]',
  '[aria-label*="favorite" i]',
  '[data-favorite]',
].join(',');

const DEFAULT_MEMBER_GAME_DESTINATION = '/games';

export default function PublicGameLoginController() {
  const router = useRouter();
  const { ready, isLoggedIn } = useMemberSession();

  useEffect(() => {
    const requireLoginForGame = (event: MouseEvent) => {
      if (
        !ready
        || isLoggedIn
        || event.button !== 0
        || event.metaKey
        || event.ctrlKey
        || event.shiftKey
        || event.altKey
      ) return;

      const target = event.target;
      if (!(target instanceof Element) || target.closest(EXCLUDED_SELECTOR)) return;

      const action = target.closest<HTMLElement>(GAME_ACTION_SELECTOR);
      if (!action) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      const destination = gameDestination(action);
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set('auth', 'login');
      currentUrl.searchParams.set('next', destination);
      router.replace(`${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`, { scroll: false });
    };

    window.addEventListener('click', requireLoginForGame, true);
    return () => window.removeEventListener('click', requireLoginForGame, true);
  }, [isLoggedIn, ready, router]);

  return null;
}

function gameDestination(action: HTMLElement) {
  const link = action instanceof HTMLAnchorElement
    ? action
    : action.closest<HTMLAnchorElement>('a[href]');
  if (!link) return DEFAULT_MEMBER_GAME_DESTINATION;

  try {
    const url = new URL(link.href, window.location.href);
    if (url.origin !== window.location.origin) return DEFAULT_MEMBER_GAME_DESTINATION;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return DEFAULT_MEMBER_GAME_DESTINATION;
  }
}
