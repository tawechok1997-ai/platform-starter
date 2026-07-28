'use client';

import { useEffect, useState, type SyntheticEvent } from 'react';

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
    <section className="home-jackpot" aria-label="Jackpot">
      <header className="home-jackpot__header">
        <img className="home-jackpot__icon" src={iconUrl} alt="" aria-hidden="true" />
        <strong className="home-jackpot__title">Jackpot</strong>
      </header>
      <a className="home-jackpot__art-link" href="/home" aria-label={`Jackpot ${value.toLocaleString('en-US')}`}>
        <img className="home-jackpot__art" src={artUrl} alt="" onError={handleArtError} />
        <span className="home-jackpot__value-wrap" aria-live="off">
          <strong className="home-jackpot__value">{value.toLocaleString('en-US')}</strong>
        </span>
      </a>
    </section>
  );
}
