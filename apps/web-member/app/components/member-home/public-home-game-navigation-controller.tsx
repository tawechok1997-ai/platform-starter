'use client';

import { useEffect } from 'react';
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
  'a[class*="game-card"]',
  'button[class*="game-card"]',
  'a[class*="game-tile"]',
  'button[class*="game-tile"]',
  'a[class*="game-cover"]',
  'button[class*="game-cover"]',
  '[class*="game-card"] a',
  '[class*="game-card"] button',
  '[class*="game-item"] a',
  '[class*="game-item"] button',
].join(',');

const GAME_CARD_ROOT_SELECTOR = [
  '[data-public-game-action]',
  '[data-game-id]',
  '[data-game-code]',
  '[class*="game-card"]',
  '[class*="game-tile"]',
  '[class*="game-cover"]',
  '[class*="game-item"]',
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

const MEMBER_GAME_DESTINATION = '/games';

export default function PublicGameLoginController() {
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
      if (!(target instanceof Element)) return;
      if (target.closest(EXCLUDED_SELECTOR)) return;

      const directAction = target.closest<HTMLElement>(GAME_ACTION_SELECTOR);
      const cardRoot = target.closest<HTMLElement>(GAME_CARD_ROOT_SELECTOR);
      if (!directAction && !cardRoot) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set('auth', 'login');
      currentUrl.searchParams.set('next', MEMBER_GAME_DESTINATION);
      window.history.replaceState(null, '', `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`);

      const loginButton = document.querySelector<HTMLButtonElement>('button.member-guest-action--login');
      if (loginButton) {
        loginButton.click();
        return;
      }

      window.location.assign(`/?auth=login&next=${encodeURIComponent(MEMBER_GAME_DESTINATION)}`);
    };

    // Window capture runs before legacy card handlers and links. One owner now
    // controls every public game-card click without affecting category browsing.
    window.addEventListener('click', requireLoginForGame, true);
    return () => window.removeEventListener('click', requireLoginForGame, true);
  }, [isLoggedIn, ready]);

  return null;
}
