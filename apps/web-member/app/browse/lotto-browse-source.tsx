'use client';

import SourceGameCategoryPage, { type SourceGameCategoryConfig } from './source-game-category-page';

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
  slug: 'lotto', title: 'หวย', total: 2, resultUnit: 'ค่าย', mode: 'provider-cards',
  baseBackground: '/images/game/lotto/bg_lotto.webp', baseLogo: '/images/game/lotto/logo_lotto.webp',
  filters: [{ key: 'new', label: 'เกมส์ใหม่', count: 1 }], providers,
  games: rows.map(([code, name, isNew]) => ({ id: code, name, image: `https://cdn.zabbet.com/providers/set/1_1_v/${code}.png`, provider: code, isNew, isHot: false, tags: isNew ? ['new' as const] : [] })),
};

export default function LottoBrowseSource() { return <SourceGameCategoryPage config={config} />; }
