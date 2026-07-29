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

const LOCAL_PROVIDER_CARD_ROOT = '/assets/asset-pc/images/providers/set/1_1_v';

const providers = rows.map(([code, name]) => ({
  code,
  name,
  badge: `https://cdn.zabbet.com/providers/set/1_1_badge/${code}.png`,
  card: `${LOCAL_PROVIDER_CARD_ROOT}/${code}.png`,
  background: `https://cdn.zabbet.com/providers/set/1_1_bg/${code}.png`,
  title: `https://cdn.zabbet.com/providers/set/1_1_title/${code}.png`,
  avatar: `https://cdn.zabbet.com/providers/set/1_1_avatar/${code}.png`,
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

export default function CasinoSourcePage() {
  return (
    <>
      <SourceGameCategoryPage config={config} />
      <style>{`
        /* Keep the original casino background, fade and provider animation. */
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

        /* Casino had a local normal blend rule that overrode the working
         * transparent treatment used by Sport and Lotto. Apply that proven rule
         * only to the provider-card bitmap, never to the page artwork. */
        main[data-source-game-category='casino'] [data-source-game-cover] {
          background: transparent !important;
          background-color: transparent !important;
          background-image: none !important;
          box-shadow: none !important;
          isolation: auto !important;
        }

        main[data-source-game-category='casino'] [data-source-game-cover] > img:not([aria-hidden='true']) {
          mix-blend-mode: screen !important;
          background: transparent !important;
          filter: saturate(1.06) contrast(1.03) !important;
          opacity: 1 !important;
        }
      `}</style>
    </>
  );
}
