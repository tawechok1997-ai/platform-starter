'use client';

import { useEffect } from 'react';

type AllianceLogo = {
  name: string;
  url: string;
};

const ALLIANCE_ROW_ONE: AllianceLogo[] = [
  'evoplay', 'cq9', 'jili', 'playstar', 'joker', 'ebet',
  'popk', 'evoplay', 'cq9', 'jili', 'playstar', 'joker',
].map((name) => ({ name, url: `/assets/asset-pc/images/alliance/${name}.webp` }));

const ALLIANCE_ROW_TWO: AllianceLogo[] = [
  'jili', 'playstar', 'evoplay', 'ebet', 'popk', 'cq9',
  'evoplay', 'jili', 'playstar', 'joker', 'evoplay',
].map((name) => ({ name, url: `/assets/asset-pc/images/alliance/${name}.webp` }));

export default function MemberAllianceBandRepair() {
  useEffect(() => {
    const installBand = () => {
      const home = document.querySelector<HTMLElement>('.desktop-reference-home');
      if (!home) return;

      const body = home.querySelector<HTMLElement>(':scope > .desktop-home__body');
      const legacyHost = home.querySelector<HTMLElement>('.reference-provider-strip');
      if (!body || !legacyHost) return;

      legacyHost.classList.add('noah-alliance-host-hidden');
      legacyHost.querySelectorAll(':scope > .noah-alliance-v2').forEach((node) => node.remove());

      const existing = home.querySelector<HTMLElement>(':scope > .noah-alliance-v3');
      if (existing) return;

      const band = document.createElement('section');
      band.className = 'noah-alliance-v3';
      band.setAttribute('aria-labelledby', 'noah-alliance-v3-heading');

      const inner = document.createElement('div');
      inner.className = 'noah-alliance-v3__inner';

      const heading = document.createElement('h2');
      heading.id = 'noah-alliance-v3-heading';
      heading.className = 'noah-alliance-v3__heading';
      heading.textContent = 'พันธมิตรของเรา';
      inner.appendChild(heading);

      const rows = document.createElement('div');
      rows.className = 'noah-alliance-v3__rows';
      rows.appendChild(createAllianceRow(ALLIANCE_ROW_ONE, 'noah-alliance-v3__row noah-alliance-v3__row--one'));
      rows.appendChild(createAllianceRow(ALLIANCE_ROW_TWO, 'noah-alliance-v3__row noah-alliance-v3__row--two'));
      inner.appendChild(rows);
      band.appendChild(inner);

      body.insertAdjacentElement('afterend', band);
    };

    installBand();

    const observer = new MutationObserver(installBand);
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('pageshow', installBand);

    return () => {
      observer.disconnect();
      window.removeEventListener('pageshow', installBand);
    };
  }, []);

  return null;
}

function createAllianceRow(logos: AllianceLogo[], className: string) {
  const row = document.createElement('div');
  row.className = className;

  logos.forEach((logo) => {
    const card = document.createElement('span');
    card.className = 'noah-alliance-v3__card';
    card.title = logo.name;

    const image = document.createElement('img');
    image.className = 'noah-alliance-v3__image';
    image.src = logo.url;
    image.alt = logo.name;
    image.loading = 'eager';
    image.decoding = 'sync';
    card.appendChild(image);
    row.appendChild(card);
  });

  return row;
}
