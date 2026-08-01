'use client';

import SourceProviderCategoryPage from './source-provider-category-page';
import type { SourceGameCategoryConfig } from './source-game-category-page';

const rows = [
  ['lotmw', 'RB7 Lotto', true],
  ['dac', 'Huay Dragon', false],
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
  slug: 'lotto',
  title: 'หวย',
  total: rows.length,
  resultUnit: 'ค่าย',
  mode: 'provider-cards',
  baseBackground: '/assets/asset-pc/images/game/lotto/bg_lotto.webp',
  baseLogo: '/assets/asset-pc/images/game/lotto/logo_lotto.webp',
  filters: [{ key: 'new', label: 'เกมส์ใหม่', count: 1 }],
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

export default function LottoBrowseSource() {
  return (
    <>
      <SourceProviderCategoryPage config={config} />
      <style>{`
        main[data-source-game-category='lotto'] [data-source-filter-types] {
          height: 60px !important;
          min-height: 60px !important;
        }

        main[data-source-game-category='lotto'] [data-source-filter-panel] button:disabled {
          cursor: pointer !important;
          opacity: 1 !important;
        }
      `}</style>
    </>
  );
}
