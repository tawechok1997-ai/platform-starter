'use client';

import SourceProviderCategoryPage from './source-provider-category-page';
import type { SourceGameCategoryConfig } from './source-game-category-page';

const rows = [
  ['sbo', 'SBO', false],
  ['lali', 'Lalika', false],
  ['bcs', 'Betconstruct', true],
  ['muay', 'Muay Pakyok', true],
  ['saba', 'Saba', false],
] as const;

const providers = rows.map(([code, name]) => ({
  code,
  name,
  badge: `https://cdn.zabbet.com/providers/set/1_1_badge/${code}.png`,
  card: `https://cdn.zabbet.com/providers/set/1_1_v/${code}.png`,
  background: `https://cdn.zabbet.com/providers/set/1_1_bg/${code}.png`,
  title: `https://cdn.zabbet.com/providers/set/1_1_title/${code}.png`,
  avatar: `https://cdn.zabbet.com/providers/set/1_1_avatar/${code}.png`,
}));

const config: SourceGameCategoryConfig = {
  slug: 'sport',
  title: 'กีฬา',
  total: rows.length,
  resultUnit: 'ค่าย',
  mode: 'provider-cards',
  baseBackground: '/assets/asset-pc/images/game/sport/bg_sport.webp',
  baseLogo: '/assets/asset-pc/images/game/sport/logo_sport.webp',
  filters: [],
  providers,
  showProviderStrip: false,
  games: rows.map(([code, name, isNew]) => ({
    id: code,
    name,
    image: `https://cdn.zabbet.com/providers/set/1_1_v/${code}.png`,
    provider: code,
    isNew,
    isHot: false,
    tags: isNew ? ['new' as const] : [],
  })),
};

export default function SportBrowseSource() {
  return (
    <>
      <SourceProviderCategoryPage config={config} />
      <style>{`
        main[data-source-game-category='sport'] [data-source-filter-types] {
          height: 16px !important;
          min-height: 16px !important;
          padding: 0 !important;
        }

        main[data-source-game-category='sport'] [data-source-filter-panel] button:disabled {
          cursor: pointer !important;
          opacity: 1 !important;
        }
      `}</style>
    </>
  );
}
