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
  slug: 'casino', title: 'คาสิโน', total: 10, resultUnit: 'ค่าย', mode: 'provider-cards',
  baseBackground: '/images/game/casino/bg_casino.webp', baseLogo: '/images/game/casino/logo_casino.webp',
  filters: [{ key: 'new', label: 'เกมส์ใหม่', count: 1 }], providers,
  games: rows.map(([code, name, isNew]) => ({ id: code, name, image: `https://cdn.zabbet.com/providers/set/1_1_v/${code}.png`, provider: code, isNew, isHot: false, tags: isNew ? ['new' as const] : [] })),
};

export default function CasinoSourcePage() { return <SourceGameCategoryPage config={config} />; }
