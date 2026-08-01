'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useMemberLocale } from '../../member-locale-provider';
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
  '.game-lobby-cover-button',
  '.game-lobby-card-body > button',
  '.game-lobby-hero-actions button',
  '.hot-game-overlay button:last-child',
  '.game-detail-play',
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
  '.game-lobby-page',
  '.public-member-actions',
  '.public-auth-page',
  '[role="dialog"]',
  '[aria-modal="true"]',
  'input',
  'textarea',
  'select',
  '[contenteditable="true"]',
  '[aria-label*="รายการโปรด"]',
  '[aria-label*="favorite" i]',
  '[data-favorite]',
].join(',');

const DEFAULT_MEMBER_GAME_DESTINATION = '/games';
const GAME_LAUNCH_TIMEOUT_MS = 15_000;

type LaunchState = {
  status: 'loading' | 'error';
  gameName: string;
  message: string;
};

export default function PublicGameLoginController() {
  const router = useRouter();
  const { locale } = useMemberLocale();
  const { ready, isLoggedIn } = useMemberSession();
  const launchAbortRef = useRef<AbortController | null>(null);
  const [launchState, setLaunchState] = useState<LaunchState | null>(null);

  useEffect(() => {
    const handleGameAction = async (event: MouseEvent) => {
      if (
        !ready
        || event.defaultPrevented
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

      launchAbortRef.current?.abort();
      const controller = new AbortController();
      launchAbortRef.current = controller;
      let timedOut = false;
      const timeout = window.setTimeout(() => {
        timedOut = true;
        controller.abort();
      }, GAME_LAUNCH_TIMEOUT_MS);

      action.dataset.memberGameLaunching = 'true';
      const copy = LAUNCH_COPY[locale];
      const gameName = candidate.name || copy.game;
      setLaunchState({ status: 'loading', gameName, message: copy.connecting });

      try {
        await openMemberProviderGame(candidate, { signal: controller.signal, locale });
      } catch (caught) {
        if (controller.signal.aborted) {
          if (launchAbortRef.current === controller && timedOut) {
            setLaunchState({
              status: 'error',
              gameName,
              message: copy.timeout,
            });
          }
          return;
        }

        setLaunchState({
          status: 'error',
          gameName,
          message: caught instanceof Error ? caught.message : copy.launchFailed,
        });
      } finally {
        window.clearTimeout(timeout);
        delete action.dataset.memberGameLaunching;
        if (launchAbortRef.current === controller) launchAbortRef.current = null;
      }
    };

    window.addEventListener('click', handleGameAction, true);
    return () => window.removeEventListener('click', handleGameAction, true);
  }, [isLoggedIn, locale, ready, router]);

  useEffect(() => () => launchAbortRef.current?.abort(), []);

  useEffect(() => {
    if (launchState?.status !== 'error') return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLaunchState(null);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [launchState?.status]);

  if (!launchState || typeof document === 'undefined') return null;
  const copy = LAUNCH_COPY[locale];

  const closeLaunch = () => {
    launchAbortRef.current?.abort();
    launchAbortRef.current = null;
    setLaunchState(null);
  };

  return createPortal(
    <div className="member-game-launch-overlay" role="presentation">
      <section
        className="member-game-launch-dialog"
        role={launchState.status === 'error' ? 'alertdialog' : 'status'}
        aria-live="assertive"
        aria-busy={launchState.status === 'loading'}
      >
        {launchState.status === 'loading' ? <span className="member-game-launch-spinner" aria-hidden="true" /> : null}
        <strong>{launchState.status === 'loading' ? `${copy.opening} ${launchState.gameName}` : copy.launchFailed}</strong>
        <p>{launchState.message}</p>
        <button type="button" onClick={closeLaunch}>
          {launchState.status === 'loading' ? copy.cancel : copy.close}
        </button>
      </section>
    </div>,
    document.body,
  );
}

function readGameCandidate(action: HTMLElement): MemberGameLaunchCandidate | null {
  const owner = action.closest<HTMLElement>('[data-game-id], [data-game-code], [data-game-name], [data-provider-code]') ?? action;
  const linkContext = readLinkContext(action);
  const pageCategory = action.closest<HTMLElement>('main[data-source-game-category]')?.dataset.sourceGameCategory;
  const id = firstText(owner.dataset.gameId, action.dataset.gameId, linkContext.gameId);
  const providerGameCode = firstText(owner.dataset.gameCode, action.dataset.gameCode, linkContext.gameCode);
  const providerCode = firstText(owner.dataset.providerCode, action.dataset.providerCode, linkContext.providerCode);
  const category = firstText(owner.dataset.gameCategory, action.dataset.gameCategory, linkContext.category, pageCategory);
  const name = firstText(
    owner.dataset.gameName,
    action.dataset.gameName,
    action.getAttribute('title'),
    cleanAriaLabel(action.getAttribute('aria-label')),
    action.closest<HTMLElement>('.game-lobby-card, .hot-game-card, .game-detail-dialog, .game-lobby-hero')
      ?.querySelector<HTMLElement>('.game-lobby-card-body > strong, .hot-game-body > strong, #game-detail-title, .game-lobby-hero-copy h1')
      ?.textContent,
    action.querySelector<HTMLElement>('.source-highlight-game__name, .source-popular-card__name, strong')?.textContent,
    cleanImageAlt(action.querySelector<HTMLImageElement>('img[alt]')?.alt),
  );

  return id || providerGameCode || name
    ? { id, providerGameCode, providerCode, category, name }
    : null;
}

function readLinkContext(action: HTMLElement) {
  const link = action instanceof HTMLAnchorElement ? action : action.closest<HTMLAnchorElement>('a[href]');
  if (!link) return { gameId: '', gameCode: '', providerCode: '', category: '' };

  try {
    const url = new URL(link.href, window.location.href);
    return {
      gameId: firstText(url.searchParams.get('gameId'), url.searchParams.get('game')),
      gameCode: firstText(url.searchParams.get('gameCode'), url.searchParams.get('code')),
      providerCode: firstText(url.searchParams.get('provider'), url.searchParams.get('providerCode')),
      category: firstText(url.searchParams.get('category')),
    };
  } catch {
    return { gameId: '', gameCode: '', providerCode: '', category: '' };
  }
}

function cleanAriaLabel(value: string | null) {
  return firstText(value).replace(/^(?:เปิด|เข้าเล่น|เล่น|open|play)\s*/i, '').trim();
}

function cleanImageAlt(value: string | null | undefined) {
  const text = firstText(value);
  return /^(เกมไฮไลท์|ภาพ|โลโก้|provider)$/i.test(text) ? '' : text.replace(/^ภาพปก\s*/i, '').trim();
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

const LAUNCH_COPY = {
  th: {
    game: 'เกม',
    connecting: 'กำลังเชื่อมต่อค่ายเกม...',
    timeout: 'ค่ายเกมตอบสนองช้าเกิน 15 วินาที กรุณาลองใหม่อีกครั้ง',
    launchFailed: 'เปิดเกมไม่สำเร็จ',
    opening: 'กำลังเปิด',
    cancel: 'ยกเลิก',
    close: 'ปิด',
  },
  en: {
    game: 'game',
    connecting: 'Connecting to the game provider...',
    timeout: 'The game provider took longer than 15 seconds to respond. Please try again.',
    launchFailed: 'Unable to launch the game',
    opening: 'Opening',
    cancel: 'Cancel',
    close: 'Close',
  },
} as const;
