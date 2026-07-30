'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useMemberSession } from '../../member-session-provider';
import { useMemberLocale } from '../../member-locale-provider';
import { useSiteSettings } from '../../site-settings-provider';
import { usePendingCount } from '../../hooks/use-pending-count';
import { formatMemberWalletBalance } from '../../../src/features/wallet/member-wallet';
import PublicAuthenticatedActions from '../public-authenticated-actions-styled';

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
  'a[class*="gameCard"]',
  'button[class*="gameCard"]',
  'a[class*="game-tile"]',
  'button[class*="game-tile"]',
  'a[class*="gameTile"]',
  'button[class*="gameTile"]',
  'a[class*="game-cover"]',
  'button[class*="game-cover"]',
  'a[class*="gameCover"]',
  'button[class*="gameCover"]',
  '[class*="game-card"] a',
  '[class*="game-card"] button',
  '[class*="gameCard"] a',
  '[class*="gameCard"] button',
  '[class*="game-item"] a',
  '[class*="game-item"] button',
  '[class*="gameItem"] a',
  '[class*="gameItem"] button',
].join(',');

const GAME_CARD_ROOT_SELECTOR = [
  '[data-public-game-action]',
  '[data-game-id]',
  '[data-game-code]',
  '[class*="game-card"]',
  '[class*="gameCard"]',
  '[class*="game-tile"]',
  '[class*="gameTile"]',
  '[class*="game-cover"]',
  '[class*="gameCover"]',
  '[class*="game-item"]',
  '[class*="gameItem"]',
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
const PUBLIC_HEADER_ACTION_TARGET = '.public-home-topbar .public-home-desktop-bar > .member-actions';
const LEGACY_AUTHENTICATED_ACTIONS = [
  ':scope > .member-guest-action',
  ':scope > .member-header-wallet',
  ':scope > .member-header-logout',
].join(',');

export default function PublicGameLoginController() {
  const { isLoggedIn, wallet, walletLoading, logout } = useMemberSession();
  const { locale, toggleLocale } = useMemberLocale();
  const { typedSettings } = useSiteSettings();
  const { pendingCount } = usePendingCount(isLoggedIn);
  const [headerActionTarget, setHeaderActionTarget] = useState<HTMLElement | null>(null);
  const formattedWalletBalance = formatMemberWalletBalance(wallet);
  const compactWalletBalance = formattedWalletBalance.replace(/^[A-Z]{3}\s+/, '');

  useEffect(() => {
    const requireLoginForGame = (event: MouseEvent) => {
      if (
        isLoggedIn
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

    window.addEventListener('click', requireLoginForGame, true);
    return () => window.removeEventListener('click', requireLoginForGame, true);
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn) {
      setHeaderActionTarget(null);
      return;
    }

    const syncTarget = () => {
      const nextTarget = document.querySelector<HTMLElement>(PUBLIC_HEADER_ACTION_TARGET);
      if (nextTarget) hideLegacyAuthenticatedActions(nextTarget);
      setHeaderActionTarget((current) => (current === nextTarget ? current : nextTarget));
    };

    syncTarget();
    const observer = new MutationObserver(syncTarget);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [isLoggedIn]);

  if (!isLoggedIn || !headerActionTarget) return null;

  return createPortal(
    <div className="public-authenticated-portal">
      <PublicAuthenticatedActions
        locale={locale}
        siteName={typedSettings.website.site_name}
        walletLoading={walletLoading}
        compactWalletBalance={compactWalletBalance}
        pendingCount={pendingCount}
        logout={logout}
        onToggleLocale={toggleLocale}
      />
    </div>,
    headerActionTarget,
  );
}

function hideLegacyAuthenticatedActions(target: HTMLElement) {
  target.querySelectorAll<HTMLElement>(LEGACY_AUTHENTICATED_ACTIONS).forEach((element) => {
    element.hidden = true;
    element.setAttribute('aria-hidden', 'true');
    element.style.setProperty('display', 'none', 'important');
    element.style.setProperty('visibility', 'hidden', 'important');
    element.style.setProperty('pointer-events', 'none', 'important');
  });
}
