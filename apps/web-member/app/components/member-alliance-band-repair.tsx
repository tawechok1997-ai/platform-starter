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
      const host = document.querySelector<HTMLElement>('.desktop-reference-home .reference-provider-strip');
      if (!host) return;

      host.classList.add('noah-alliance-host');
      if (host.querySelector(':scope > .noah-alliance-v2')) return;

      const band = document.createElement('div');
      band.className = 'noah-alliance-v2';
      band.setAttribute('role', 'group');
      band.setAttribute('aria-label', 'พันธมิตรของเรา');

      const heading = document.createElement('h2');
      heading.className = 'noah-alliance-v2__heading';
      heading.textContent = 'พันธมิตรของเรา';
      band.appendChild(heading);

      const rows = document.createElement('div');
      rows.className = 'noah-alliance-v2__rows';
      rows.appendChild(createAllianceRow(ALLIANCE_ROW_ONE, 'noah-alliance-v2__row noah-alliance-v2__row--one'));
      rows.appendChild(createAllianceRow(ALLIANCE_ROW_TWO, 'noah-alliance-v2__row noah-alliance-v2__row--two'));
      band.appendChild(rows);

      host.appendChild(band);
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
    card.className = 'noah-alliance-v2__card';
    card.title = logo.name;
    card.setAttribute('aria-label', logo.name);

    const artwork = document.createElement('span');
    artwork.className = 'noah-alliance-v2__artwork';
    artwork.style.backgroundImage = `url("${logo.url}")`;
    card.appendChild(artwork);
    row.appendChild(card);
  });

  return row;
}
