'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useMemberSession } from '../../member-session-provider';
import {
  openMemberProviderGame,
  type MemberGameLaunchCandidate,
} from '../game/member-provider-game-launch';
import '../../member-game-launch-overlay.css';

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
  '[data-source-game-cover]',
  '[data-game-id]',
  '[data-game-code]',
  '[data-game-name]',
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

type LaunchState = {
  status: 'loading' | 'error';
  gameName: string;
  message: string;
};

export default function PublicGameLoginController() {
  const router = useRouter();
  const { ready, isLoggedIn } = useMemberSession();
  const launchInFlightRef = useRef(false);
  const [launchState, setLaunchState] = useState<LaunchState | null>(null);

  useEffect(() => {
    const handleGameAction = async (event: MouseEvent) => {
      if (
        !ready
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

      if (!isLoggedIn) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        const destination = gameDestination(action);
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set('auth', 'login');
        currentUrl.searchParams.set('next', destination);
        router.replace(`${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`, { scroll: false });
        return;
      }

      const candidate = readGameCandidate(action);
      if (!candidate) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      if (launchInFlightRef.current) return;

      launchInFlightRef.current = true;
      action.dataset.memberGameLaunching = 'true';
      const gameName = candidate.name || 'เกม';
      setLaunchState({ status: 'loading', gameName, message: 'กำลังเชื่อมต่อค่ายเกม...' });

      try {
        await openMemberProviderGame(candidate);
      } catch (caught) {
        setLaunchState({
          status: 'error',
          gameName,
          message: caught instanceof Error ? caught.message : 'เปิดเกมไม่สำเร็จ',
        });
      } finally {
        launchInFlightRef.current = false;
        delete action.dataset.memberGameLaunching;
      }
    };

    window.addEventListener('click', handleGameAction, true);
    return () => window.removeEventListener('click', handleGameAction, true);
  }, [isLoggedIn, ready, router]);

  useEffect(() => {
    if (launchState?.status !== 'error') return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLaunchState(null);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [launchState?.status]);

  if (!launchState || typeof document === 'undefined') return null;

  return createPortal(
    <div className="member-game-launch-overlay" role="presentation">
      <section
        className="member-game-launch-dialog"
        role={launchState.status === 'error' ? 'alertdialog' : 'status'}
        aria-live="assertive"
        aria-busy={launchState.status === 'loading'}
      >
        {launchState.status === 'loading' ? <span className="member-game-launch-spinner" aria-hidden="true" /> : null}
        <strong>{launchState.status === 'loading' ? `กำลังเปิด ${launchState.gameName}` : 'เปิดเกมไม่สำเร็จ'}</strong>
        <p>{launchState.message}</p>
        {launchState.status === 'error' ? (
          <button type="button" onClick={() => setLaunchState(null)}>ปิด</button>
        ) : null}
      </section>
    </div>,
    document.body,
  );
}

function readGameCandidate(action: HTMLElement): MemberGameLaunchCandidate | null {
  const owner = action.closest<HTMLElement>('[data-game-id], [data-game-code], [data-game-name], [data-provider-code]') ?? action;
  const id = firstText(owner.dataset.gameId, action.dataset.gameId);
  const providerGameCode = firstText(owner.dataset.gameCode, action.dataset.gameCode);
  const providerCode = firstText(owner.dataset.providerCode, action.dataset.providerCode);
  const category = firstText(owner.dataset.gameCategory, action.dataset.gameCategory);
  const name = firstText(
    owner.dataset.gameName,
    action.dataset.gameName,
    action.getAttribute('title'),
    cleanAriaLabel(action.getAttribute('aria-label')),
  );

  return id || providerGameCode || name
    ? { id, providerGameCode, providerCode, category, name }
    : null;
}

function cleanAriaLabel(value: string | null) {
  return firstText(value).replace(/^(เปิด|เข้าเล่น|เล่น)\s*/i, '').trim();
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

function firstText(...values: Array<string | null | undefined>) {
  return values.find((value): value is string => typeof value === 'string' && value.trim().length > 0)?.trim() ?? '';
}
