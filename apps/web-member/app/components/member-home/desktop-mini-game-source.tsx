'use client';

import Link from 'next/link';
import { useCallback, useState } from 'react';
import { DesktopDailyMissionPopup } from './desktop-daily-mission-popup';
import styles from './desktop-mini-game-source.module.css';

const IMAGE_ROOT = '/assets/asset-pc/images';

const MINI_GAME_ACTIONS = [
  {
    key: 'wheel',
    label: 'วงล้อ',
    image: `${IMAGE_ROOT}/mini_game/icon-luckywheel-dt.webp`,
    href: '/mini-game/spinner',
  },
  {
    key: 'mission',
    label: 'ทำภารกิจ',
    image: `${IMAGE_ROOT}/mini_game/icon-dailymission-dt.webp`,
  },
] as const;

export default function DesktopMiniGameSource() {
  const [missionOpen, setMissionOpen] = useState(false);
  const openMission = useCallback(() => setMissionOpen(true), []);
  const closeMission = useCallback(() => setMissionOpen(false), []);

  return (
    <>
      <section
        id="desktop-mini-game-source"
        className={`reference-side-card reference-mini-games source-mini-game ${styles.miniGame}`}
        aria-label="Mini Game"
      >
        <div className="source-mini-game__header">
          <div className="source-mini-game__header-gradient" aria-hidden="true" />
          <div className="source-mini-game__header-line" aria-hidden="true" />
          <div className="source-mini-game__header-content">
            <div className="source-mini-game__title">
              <img
                loading="lazy"
                className="source-mini-game__title-icon"
                src={`${IMAGE_ROOT}/home/mini-game.webp`}
                alt=""
                aria-hidden="true"
              />
              <div className="source-mini-game__title-text">Mini Game</div>
            </div>
            <div className="source-mini-game__header-action" aria-hidden="true" />
          </div>
        </div>

        <div className={styles.actions}>
          <Link href={MINI_GAME_ACTIONS[0].href} className={styles.action}>
            <img
              loading="lazy"
              className={styles.actionIcon}
              src={MINI_GAME_ACTIONS[0].image}
              alt=""
              aria-hidden="true"
            />
            <span className={styles.actionLabel}>{MINI_GAME_ACTIONS[0].label}</span>
          </Link>

          <button
            type="button"
            className={styles.action}
            onClick={openMission}
            aria-haspopup="dialog"
            aria-expanded={missionOpen}
          >
            <img
              loading="lazy"
              className={styles.actionIcon}
              src={MINI_GAME_ACTIONS[1].image}
              alt=""
              aria-hidden="true"
            />
            <span className={styles.actionLabel}>{MINI_GAME_ACTIONS[1].label}</span>
          </button>
        </div>
      </section>

      <DesktopDailyMissionPopup open={missionOpen} onClose={closeMission} />
    </>
  );
}
