'use client';

import SourceGameCategoryPage, { type SourceGameCategoryConfig } from './source-game-category-page';

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
  slug: 'sport', title: 'กีฬา', total: 5, resultUnit: 'ค่าย', mode: 'provider-cards',
  baseBackground: '/images/game/sport/bg_sport.webp', baseLogo: '/images/game/sport/logo_sport.webp',
  filters: [], providers,
  games: rows.map(([code, name, isNew]) => ({ id: code, name, image: `https://cdn.zabbet.com/providers/set/1_1_v/${code}.png`, provider: code, isNew, isHot: false, tags: isNew ? ['new'] : [] })),
};

export default function SportBrowseSource() { return <SourceGameCategoryPage config={config} />; }
