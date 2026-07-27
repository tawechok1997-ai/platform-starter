'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { DesktopTournamentBoard } from './member-home/desktop-tournament-board';

const TARGET_SELECTOR = '.desktop-reference-home .reference-tournament-board[data-section-kind="tournament"]';

export default function MemberTournamentBoardRepair() {
  const [target, setTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    let currentTarget: HTMLElement | null = null;

    const locateTarget = () => {
      const nextTarget = document.querySelector<HTMLElement>(TARGET_SELECTOR);
      if (nextTarget === currentTarget) return;

      if (currentTarget) delete currentTarget.dataset.sourceTournamentMounted;
      currentTarget = nextTarget;
      if (currentTarget) currentTarget.dataset.sourceTournamentMounted = 'true';
      setTarget(currentTarget);
    };

    locateTarget();
    const observer = new MutationObserver(locateTarget);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      if (currentTarget) delete currentTarget.dataset.sourceTournamentMounted;
    };
  }, []);

  if (!target) return null;
  return createPortal(<DesktopTournamentBoard />, target);
}
