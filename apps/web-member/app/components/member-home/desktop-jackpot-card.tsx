'use client';

import { useEffect, useState, type SyntheticEvent } from 'react';
import { useMemberRuntime } from '../../member-runtime-provider';

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
  const { home } = useMemberRuntime();
  const configuredValue = parseJackpotValue(home.jackpot.amount);
  const [value, setValue] = useState(configuredValue ?? initialValue);

  useEffect(() => {
    if (configuredValue !== null) {
      setValue(configuredValue);
      return;
    }
    const timer = window.setInterval(() => {
      setValue((current) => current + Math.floor(Math.random() * 7) + 1);
    }, 1800);
    return () => window.clearInterval(timer);
  }, [configuredValue]);

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

  const valueLabel = configuredValue !== null ? home.jackpot.amount : value.toLocaleString('en-US');

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

function parseJackpotValue(value: string) {
  const amount = Number(value.replace(/[^\d.-]/g, ''));
  return Number.isFinite(amount) ? amount : null;
}
