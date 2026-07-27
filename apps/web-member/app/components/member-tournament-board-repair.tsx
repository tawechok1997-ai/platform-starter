'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { DesktopJackpotCard } from './member-home/desktop-jackpot-card';
import { DesktopTournamentBoard } from './member-home/desktop-tournament-board';

const TOURNAMENT_TARGET_SELECTOR = '.desktop-reference-home .reference-tournament-board[data-section-kind="tournament"]';
const JACKPOT_TARGET_SELECTOR = '.desktop-reference-home .reference-jackpot';
const JACKPOT_ART = '/assets/asset-pc/images/FEZX/highlight/1725948738165-4cb4f1ec-44ed-4b21-99ed-398fbb6d7b25.gif';
const JACKPOT_ICON = '/assets/asset-pc/images/home/coin.webp';

export default function MemberTournamentBoardRepair() {
  const [tournamentTarget, setTournamentTarget] = useState<HTMLElement | null>(null);
  const [jackpotMount, setJackpotMount] = useState<HTMLElement | null>(null);

  useEffect(() => {
    let currentTournamentTarget: HTMLElement | null = null;
    let currentJackpotTarget: HTMLElement | null = null;
    let currentJackpotMount: HTMLSpanElement | null = null;

    const hideLegacyJackpot = (target: HTMLElement) => {
      target.querySelectorAll<HTMLElement>(':scope > header, :scope > div').forEach((element) => {
        element.dataset.sourceJackpotLegacy = 'true';
        element.style.setProperty('display', 'none', 'important');
      });
    };

    const releaseJackpot = () => {
      currentJackpotMount?.remove();
      if (currentJackpotTarget) {
        currentJackpotTarget.querySelectorAll<HTMLElement>('[data-source-jackpot-legacy="true"]').forEach((element) => {
          element.style.removeProperty('display');
          delete element.dataset.sourceJackpotLegacy;
        });
        delete currentJackpotTarget.dataset.sourceJackpotMounted;
      }
      currentJackpotTarget = null;
      currentJackpotMount = null;
    };

    const locateTargets = () => {
      const nextTournamentTarget = document.querySelector<HTMLElement>(TOURNAMENT_TARGET_SELECTOR);
      if (nextTournamentTarget !== currentTournamentTarget) {
        if (currentTournamentTarget) delete currentTournamentTarget.dataset.sourceTournamentMounted;
        currentTournamentTarget = nextTournamentTarget;
        if (currentTournamentTarget) currentTournamentTarget.dataset.sourceTournamentMounted = 'true';
        setTournamentTarget(currentTournamentTarget);
      }

      const nextJackpotTarget = document.querySelector<HTMLElement>(JACKPOT_TARGET_SELECTOR);
      if (nextJackpotTarget !== currentJackpotTarget) {
        releaseJackpot();
        currentJackpotTarget = nextJackpotTarget;

        if (currentJackpotTarget) {
          hideLegacyJackpot(currentJackpotTarget);
          currentJackpotTarget.dataset.sourceJackpotMounted = 'true';

          currentJackpotMount = document.createElement('span');
          currentJackpotMount.dataset.sourceJackpotPortal = 'true';
          currentJackpotMount.style.display = 'block';
          currentJackpotMount.style.width = '100%';
          currentJackpotTarget.appendChild(currentJackpotMount);
        }
        setJackpotMount(currentJackpotMount);
        return;
      }

      if (currentJackpotTarget) {
        hideLegacyJackpot(currentJackpotTarget);
        if (currentJackpotMount && !currentJackpotMount.isConnected) {
          currentJackpotTarget.appendChild(currentJackpotMount);
        }
      }
    };

    locateTargets();
    const observer = new MutationObserver(locateTargets);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      if (currentTournamentTarget) delete currentTournamentTarget.dataset.sourceTournamentMounted;
      releaseJackpot();
    };
  }, []);

  return (
    <>
      {tournamentTarget ? createPortal(<DesktopTournamentBoard />, tournamentTarget) : null}
      {jackpotMount ? createPortal(
        <DesktopJackpotCard
          artUrl={JACKPOT_ART}
          fallbackUrl={JACKPOT_ART}
          iconUrl={JACKPOT_ICON}
        />,
        jackpotMount,
      ) : null}
    </>
  );
}
