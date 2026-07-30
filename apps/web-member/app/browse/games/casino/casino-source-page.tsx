'use client';

import SourceGameCategoryPage, { type SourceGameCategoryConfig } from '../../source-game-category-page';

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
const LOCAL_PROVIDER_CARD_ROOT = '/assets/asset-pc/images/providers/set/1_1_v';

const providers = rows.map(([code, name]) => ({
  code,
  name,
  badge: `${PROVIDER_ROOT}/1_1_badge/${code}.png`,
  card: `${LOCAL_PROVIDER_CARD_ROOT}/${code}.png`,
  background: `${PROVIDER_ROOT}/1_1_bg/${code}.png`,
  title: `${PROVIDER_ROOT}/1_1_title/${code}.png`,
  avatar: `${PROVIDER_ROOT}/1_1_avatar/${code}.png`,
}));

const config: SourceGameCategoryConfig = {
  slug: 'casino',
  title: 'คาสิโน',
  total: 10,
  resultUnit: 'ค่าย',
  mode: 'provider-cards',
  baseBackground: '/assets/asset-pc/images/game/casino/bg_casino.webp',
  baseLogo: '/assets/asset-pc/images/game/casino/logo_casino.webp',
  filters: [{ key: 'new', label: 'เกมส์ใหม่', count: 1 }],
  providers,
  games: rows.map(([code, name, isNew]) => ({
    id: code,
    name,
    image: `${LOCAL_PROVIDER_CARD_ROOT}/${code}.png`,
    provider: code,
    isNew,
    isHot: false,
    tags: isNew ? ['new' as const] : [],
  })),
};

const transparentProviderLayers = rows.map(([code, name]) => `
  main[data-source-game-category='casino'] [data-source-game-cover][aria-label='เปิด ${name}'] {
    --casino-provider-avatar: url('${PROVIDER_ROOT}/1_1_avatar/${code}.png');
    --casino-provider-title: url('${PROVIDER_ROOT}/1_1_title/${code}.png');
  }
`).join('');

export default function CasinoSourcePage() {
  return (
    <>
      <SourceGameCategoryPage config={config} />
      <style>{`
        /* Keep the existing casino page background, fade and hover animation. */
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

        /* The old 1_1_v bitmap contains a complete coloured scene. Hide it and
         * build the card from the already-transparent avatar and title layers. */
        main[data-source-game-category='casino'] [data-source-game-cover] {
          isolation: isolate !important;
          background: transparent !important;
          background-color: transparent !important;
          background-image: none !important;
          box-shadow: none !important;
        }

        main[data-source-game-category='casino'] [data-source-game-cover] > img:not([aria-hidden='true']) {
          visibility: hidden !important;
          opacity: 0 !important;
        }

        main[data-source-game-category='casino'] [data-source-game-cover]::before {
          content: '' !important;
          position: absolute !important;
          inset: 0 !important;
          z-index: 1 !important;
          display: block !important;
          border-radius: inherit !important;
          background-color: transparent !important;
          background-image: var(--casino-provider-title), var(--casino-provider-avatar) !important;
          background-repeat: no-repeat, no-repeat !important;
          background-position: center calc(100% - 9px), center bottom !important;
          background-size: 78% auto, auto 100% !important;
          box-shadow: none !important;
          pointer-events: none !important;
        }

        main[data-source-game-category='casino'] [data-source-game-cover]::after {
          content: none !important;
          display: none !important;
        }

        ${transparentProviderLayers}
      `}</style>
    </>
  );
}
