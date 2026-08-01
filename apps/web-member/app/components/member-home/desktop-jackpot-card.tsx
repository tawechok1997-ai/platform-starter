'use client';

import type { SyntheticEvent } from 'react';
import { useMemberRuntime } from '../../member-runtime-provider';
import { useMemberJackpotLabel } from './member-jackpot-runtime';

type DesktopJackpotCardProps = {
  artUrl: string;
  fallbackUrl: string;
  iconUrl: string;
};

export function DesktopJackpotCard({
  artUrl,
  fallbackUrl,
  iconUrl,
}: DesktopJackpotCardProps) {
  const { home } = useMemberRuntime();
  const valueLabel = useMemberJackpotLabel(home.jackpot.amount);

  if (!home.jackpot.enabled) return null;

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
    <section className="home-jackpot" aria-label={home.jackpot.title}>
      <header className="home-jackpot__header">
        <img className="home-jackpot__icon" src={home.jackpot.icon || iconUrl} alt="" aria-hidden="true" />
        <strong className="home-jackpot__title">{home.jackpot.title}</strong>
      </header>
      <a className="home-jackpot__art-link" href="/home" aria-label={`${home.jackpot.title} ${valueLabel}`}>
        <img className="home-jackpot__art" src={home.jackpot.image || artUrl} alt="" onError={handleArtError} />
        <span className="home-jackpot__value-wrap" aria-live="off">
          <strong className="home-jackpot__value">{valueLabel}</strong>
        </span>
      </a>
    </section>
  );
}
