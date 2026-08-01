'use client';

import {
  extractAssetBasename,
  resolveLocalAssetByBasename,
  resolveLocalAssetOrSource,
} from '../lib/local-asset-by-basename';
import { FISHING_SOURCE_ROWS } from './data/fishing-source-games';
import SourceGameCategoryPage, {
  type SourceGameCategoryConfig,
  type SourceGameFilterKey,
} from './source-game-category-page';

const FISHING_LABEL = '\u0e22\u0e34\u0e07\u0e1b\u0e25\u0e32';
const PROVIDER_ROOT = 'https://cdn.zabbet.com/providers/set';
const TRANSPARENT_IMAGE =
  'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%221%22 height=%221%22/%3E';

const PROVIDER_NAMES: Record<string, string> = {
  acewinfish: 'AceWin',
  askfish: 'AskMeSlot',
  cqfish: 'CQ9',
  fachaifish: 'Fa Chai',
  fsfish: 'FastSpin',
  jkgx2fish: 'Joker',
  jlfish: 'JILI',
  kagafish: 'KA Gaming',
  misoltfish: 'Miso',
  r88fish: 'Rich88',
  rsgfish: 'RSG',
  spgfish: 'Spadegaming',
  sppfish: 'SimplePlay',
  wmfish: 'WM',
  ygrfish: 'YGR',
};

const games = FISHING_SOURCE_ROWS.map((row) => {
  const provider = providerCodeFromImage(row.providerImage);
  const tags = normalizeFishingTags(row.tags);
  return {
    id: row.id,
    name: row.name,
    image: resolveLocalAssetOrSource(row.image, 'pc'),
    provider,
    providerBadge: resolveLocalAssetOrSource(row.providerImage, 'pc'),
    isNew: tags.includes('new'),
    isHot: tags.includes('hot'),
    tags,
    origin: 'catalog' as const,
  };
});

const providers = Array.from(new Map(
  FISHING_SOURCE_ROWS.map((row) => {
    const code = providerCodeFromImage(row.providerImage);
    const badge = resolveLocalAssetOrSource(row.providerImage, 'pc');
    return [code, {
      code,
      name: PROVIDER_NAMES[code] ?? code.toUpperCase(),
      badge,
      card: providerLocalAsset('card', code) || badge,
      background: providerLocalAsset('bg', code) || TRANSPARENT_IMAGE,
      title: providerLocalAsset('title', code) || TRANSPARENT_IMAGE,
      avatar: providerLocalAsset('avatar', code) || TRANSPARENT_IMAGE,
    }] as const;
  }),
).values());

const config: SourceGameCategoryConfig = {
  slug: 'fishing',
  title: FISHING_LABEL,
  total: games.length,
  resultUnit: 'เกม',
  mode: 'games',
  baseBackground: '/assets/asset-pc/images/game/fishing/bg_fishing.webp',
  baseLogo: '/assets/asset-pc/images/game/fishing/logo_fishing.webp',
  filters: [
    { key: 'new', label: 'เกมส์ใหม่', count: games.filter((game) => game.tags.includes('new')).length },
    { key: 'slot', label: 'เกมส์สล็อต', count: games.filter((game) => game.tags.includes('slot')).length },
  ],
  providers,
  showProviderStrip: true,
  showAllProviders: true,
  games,
};

export default function FishingBrowseSource() {
  return <SourceGameCategoryPage config={config} />;
}

function providerCodeFromImage(providerImage: string) {
  return extractAssetBasename(providerImage)
    .replace(/\.(?:png|jpe?g|webp|svg)$/i, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '');
}

function providerLocalAsset(kind: 'card' | 'bg' | 'title' | 'avatar', code: string) {
  const set = kind === 'card' ? '1_1_v' : `1_1_${kind}`;
  return resolveLocalAssetByBasename(`${PROVIDER_ROOT}/${set}/${code}.png`, 'pc');
}

function normalizeFishingTags(rawTags: readonly string[]): SourceGameFilterKey[] {
  const tags = new Set<SourceGameFilterKey>();
  for (const rawTag of rawTags) {
    const tag = rawTag.trim().toLocaleLowerCase('th');
    if (tag.includes('ใหม่') || tag === 'new') tags.add('new');
    if (tag.includes('สล็อต') || tag.includes('ยล็อต') || tag.includes('slot')) tags.add('slot');
    if (tag.includes('ฮิต') || tag.includes('hot') || tag.includes('popular')) tags.add('hot');
  }
  return Array.from(tags);
}
