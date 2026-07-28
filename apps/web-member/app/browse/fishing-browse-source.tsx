'use client';

import { FISHING_FALLBACK_GAMES, FISHING_PROVIDERS } from './fishing-browse-data';
import SourceGameCategoryPage, { type SourceGameCategoryConfig, type SourceGameFilterKey } from './source-game-category-page';

const providers = FISHING_PROVIDERS.map((provider) => ({
  ...provider,
  card: `https://cdn.zabbet.com/providers/set/1_1_v/${provider.code}.png`,
  background: `https://cdn.zabbet.com/providers/set/1_1_bg/${provider.code}.png`,
  title: `https://cdn.zabbet.com/providers/set/1_1_title/${provider.code}.png`,
  avatar: `https://cdn.zabbet.com/providers/set/1_1_avatar/${provider.code}.png`,
}));

const config: SourceGameCategoryConfig = {
  slug: 'fishing', title: 'ยิงปลา', total: 129, resultUnit: 'เกม', mode: 'games',
  baseBackground: '/images/game/fishing/bg_fishing.webp', baseLogo: '/images/game/fishing/logo_fishing.webp',
  filters: [
    { key: 'hot', label: 'เกมส์ฮิต', count: 9 },
    { key: 'new', label: 'เกมส์ใหม่', count: 14 },
    { key: 'slot', label: 'เกมส์สล็อต', count: 2 },
  ],
  providers,
  showProviderStrip: true,
  games: FISHING_FALLBACK_GAMES.map((game) => ({
    id: game.id,
    name: game.name,
    image: game.image,
    provider: game.provider,
    providerBadge: game.providerLogo,
    isNew: Boolean(game.isNew),
    isHot: Boolean(game.isHot),
    tags: [...game.filters] as SourceGameFilterKey[],
  })),
};

export default function FishingBrowseSource() { return <SourceGameCategoryPage config={config} />; }
