'use client';

import SourceProviderCategoryPage from '../../source-provider-category-page';
import type { SourceGameCategoryConfig } from '../../source-game-category-page';

const rows = [
  ['dg', 'DREAM GAMING', false],
  ['sexyd', 'Sexy Baccarat', false],
  ['yeebet', 'Yeebet', true],
  ['sag', 'SA GAMING', false],
  ['ppcasino', 'PRAGMATIC PLAY Casino', false],
  ['evt', 'EVOLUTION', false],
  ['ab', 'AllBet', false],
  ['wmc', 'WM CASINO', false],
  ['biggamecasino', 'Biggame casino', false],
  ['astar', 'Astar', true],
] as const;

const PROVIDER_ROOT = 'https://cdn.zabbet.com/providers/set';
const PROVIDER_CARD_ROOT = `${PROVIDER_ROOT}/1_1_v`;

const providers = rows.map(([code, name]) => ({
  code,
  name,
  badge: `${PROVIDER_ROOT}/1_1_badge/${code}.png`,
  card: `${PROVIDER_CARD_ROOT}/${code}.png`,
  background: `${PROVIDER_ROOT}/1_1_bg/${code}.png`,
  title: `${PROVIDER_ROOT}/1_1_title/${code}.png`,
  avatar: `${PROVIDER_ROOT}/1_1_avatar/${code}.png`,
}));

const config: SourceGameCategoryConfig = {
  slug: 'casino',
  title: 'คาสิโน',
  total: rows.length,
  resultUnit: 'ค่าย',
  mode: 'provider-cards',
  baseBackground: '/assets/asset-pc/images/game/casino/bg_casino.webp',
  baseLogo: '/assets/asset-pc/images/game/casino/logo_casino.webp',
  filters: [{ key: 'new', label: 'เกมส์ใหม่', count: 2 }],
  providers,
  games: rows.map(([code, name, isNew]) => ({
    id: code,
    name,
    image: `${PROVIDER_CARD_ROOT}/${code}.png`,
    provider: code,
    isNew,
    isHot: false,
    tags: isNew ? ['new' as const] : [],
  })),
};

export default function CasinoSourcePage() {
  return (
    <>
      <SourceProviderCategoryPage config={config} />
      <style>{`
        main[data-source-game-category='casino'][data-source-game-category='casino'] {
          background: #110e16 !important;
          background-color: #110e16 !important;
        }

        main[data-source-game-category='casino'] > div[aria-hidden='true'] {
          height: auto !important;
          min-height: 600px !important;
        }

        main[data-source-game-category='casino'] > div[aria-hidden='true'] > img {
          height: auto !important;
          min-height: 600px !important;
        }

        main[data-source-game-category='casino'] [data-source-bottom-fade][data-source-bottom-fade] {
          opacity: 1 !important;
          background: linear-gradient(182deg, rgba(115, 115, 115, 0) 29.43%, #110e16 52.3%, #110e16 85.96%) !important;
        }

        main[data-source-game-category='casino'] [data-source-game-cover] {
          isolation: auto !important;
          background: transparent !important;
          background-color: transparent !important;
          background-image: none !important;
          box-shadow: none !important;
        }

        main[data-source-game-category='casino'] [data-source-game-cover]::before,
        main[data-source-game-category='casino'] [data-source-game-cover]::after {
          content: none !important;
          display: none !important;
        }

        main[data-source-game-category='casino'] [data-source-game-cover] > img:not([aria-hidden='true']) {
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
          mix-blend-mode: normal !important;
          filter: none !important;
          background: transparent !important;
        }
      `}</style>
    </>
  );
}
