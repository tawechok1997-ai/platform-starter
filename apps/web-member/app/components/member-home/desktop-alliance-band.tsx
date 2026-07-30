'use client';

import { memo } from 'react';
import { useMemberLocale } from '../../member-locale-provider';

type AllianceLogo = {
  key: string;
  name: string;
  url: string;
};

const ROW_ONE = [
  'evoplay', 'cq9', 'jili', 'playstar', 'joker', 'ebet',
  'popk', 'evoplay', 'cq9', 'jili', 'playstar', 'joker',
].map((name, index): AllianceLogo => ({
  key: `alliance-row-one-${index}`,
  name,
  url: `/assets/asset-pc/images/alliance/${name}.webp`,
}));

const ROW_TWO = [
  'jili', 'playstar', 'evoplay', 'ebet', 'popk', 'cq9',
  'evoplay', 'jili', 'playstar', 'joker', 'evoplay',
].map((name, index): AllianceLogo => ({
  key: `alliance-row-two-${index}`,
  name,
  url: `/assets/asset-pc/images/alliance/${name}.webp`,
}));

export const DesktopAllianceBand = memo(function DesktopAllianceBand() {
  const { locale } = useMemberLocale();
  const heading = locale === 'th' ? 'พันธมิตรของเรา' : 'Our partners';

  return (
    <section className="noah-alliance-v3" aria-labelledby="noah-alliance-v3-heading" data-locale={locale}>
      <div className="noah-alliance-v3__inner">
        <h2 id="noah-alliance-v3-heading" className="noah-alliance-v3__heading">{heading}</h2>
        <div className="noah-alliance-v3__rows">
          <AllianceRow logos={ROW_ONE} className="noah-alliance-v3__row noah-alliance-v3__row--one" />
          <AllianceRow logos={ROW_TWO} className="noah-alliance-v3__row noah-alliance-v3__row--two" />
        </div>
      </div>
    </section>
  );
});

const AllianceRow = memo(function AllianceRow({ logos, className }: { logos: AllianceLogo[]; className: string }) {
  return (
    <div className={className}>
      {logos.map((logo) => (
        <span key={logo.key} className="noah-alliance-v3__card" title={logo.name}>
          <img className="noah-alliance-v3__image" src={logo.url} alt={logo.name} loading="eager" decoding="sync" />
        </span>
      ))}
    </div>
  );
});
