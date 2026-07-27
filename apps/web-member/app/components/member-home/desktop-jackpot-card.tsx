'use client';

import { useEffect, useState, type SyntheticEvent } from 'react';
import styles from './desktop-jackpot-card.module.css';

type DesktopJackpotCardProps = {
  artUrl: string;
  fallbackUrl: string;
  iconUrl: string;
  initialValue?: number;
};

const DEFAULT_JACKPOT_VALUE = 196_464_585;

export function DesktopJackpotCard({
  artUrl,
  fallbackUrl,
  iconUrl,
  initialValue = DEFAULT_JACKPOT_VALUE,
}: DesktopJackpotCardProps) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setValue((current) => current + Math.floor(Math.random() * 7) + 1);
    }, 1800);
    return () => window.clearInterval(timer);
  }, []);

  const handleArtError = (event: SyntheticEvent<HTMLImageElement>) => {
    const image = event.currentTarget;
    if (!fallbackUrl || image.dataset.fallbackApplied === 'true') {
      image.style.visibility = 'hidden';
      return;
    }
    image.dataset.fallbackApplied = 'true';
    image.src = fallbackUrl;
  };

  return (
    <section className={styles.card} aria-label="Jackpot">
      <header className={styles.header}>
        <img className={styles.icon} src={iconUrl} alt="" aria-hidden="true" />
        <strong className={styles.title}>Jackpot</strong>
      </header>
      <a className={styles.artLink} href="/home" aria-label={`Jackpot ${value.toLocaleString('en-US')}`}>
        <img className={styles.art} src={artUrl} alt="" onError={handleArtError} />
        <span className={styles.valueWrap} aria-live="off">
          <strong className={styles.value}>{value.toLocaleString('en-US')}</strong>
        </span>
      </a>
    </section>
  );
}
