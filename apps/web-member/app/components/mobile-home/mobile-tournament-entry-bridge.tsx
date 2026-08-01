'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMemberSession } from '../../member-session-provider';

const MEMBER_AUTH_OPEN_EVENT = 'member:auth-open';
const MOBILE_TOURNAMENT_ROUTE = '/mobile/member/tournament';
const TOURNAMENT_ART_SELECTOR = [
  '[data-mobile-home-root="true"]',
  'img[data-asset-filename="tournament-mobile-source.svg"]',
].join(' ');

export default function MobileTournamentEntryBridge() {
  const router = useRouter();
  const { ready, isLoggedIn } = useMemberSession();

  useEffect(() => {
    const openTournament = () => {
      if (!ready || !isLoggedIn) {
        window.dispatchEvent(new CustomEvent(MEMBER_AUTH_OPEN_EVENT, {
          detail: { mode: 'login', next: MOBILE_TOURNAMENT_ROUTE },
        }));
        return;
      }

      router.push(MOBILE_TOURNAMENT_ROUTE);
    };

    const decorateTournamentArt = () => {
      document.querySelectorAll<HTMLImageElement>(TOURNAMENT_ART_SELECTOR).forEach((image) => {
        const trigger = image.parentElement;
        if (!trigger) return;

        trigger.dataset.mobileTournamentEntry = 'true';
        trigger.setAttribute('role', 'button');
        trigger.setAttribute('aria-label', 'เปิดหน้าทัวร์นาเมนต์');
        trigger.tabIndex = 0;
        trigger.style.cursor = 'pointer';
      });
    };

    const handleClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const trigger = target.closest<HTMLElement>('[data-mobile-tournament-entry="true"]');
      if (!trigger) return;

      event.preventDefault();
      event.stopPropagation();
      openTournament();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const target = event.target;
      if (!(target instanceof HTMLElement) || target.dataset.mobileTournamentEntry !== 'true') return;

      event.preventDefault();
      openTournament();
    };

    decorateTournamentArt();
    const observer = new MutationObserver(decorateTournamentArt);
    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener('click', handleClick, true);
    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      observer.disconnect();
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [isLoggedIn, ready, router]);

  return null;
}
