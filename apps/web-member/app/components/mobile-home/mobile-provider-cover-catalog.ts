export type MobileProviderCoverBadge = 'HOT' | 'NEW' | '';
export type MobileProviderCoverLayout = 'full' | 'half';

type MobileProviderCoverSeed = {
  code: string;
  variant: '1_1_h' | '1_1_l';
  layout: MobileProviderCoverLayout;
  aspectRatio: 31 | 56;
  badge: MobileProviderCoverBadge;
};

export type MobileProviderCover = MobileProviderCoverSeed & {
  sourceUrl: string;
};

const SLOT_PROVIDER_COVERS: readonly MobileProviderCoverSeed[] = [
  { code: 'ygr', variant: '1_1_h', layout: 'full', aspectRatio: 56, badge: 'HOT' },
  { code: 'hotdog', variant: '1_1_l', layout: 'full', aspectRatio: 31, badge: 'NEW' },
  { code: 'misolt', variant: '1_1_h', layout: 'half', aspectRatio: 56, badge: '' },
  { code: 'jl', variant: '1_1_h', layout: 'half', aspectRatio: 56, badge: 'HOT' },
  { code: 'pp', variant: '1_1_h', layout: 'half', aspectRatio: 56, badge: '' },
  { code: 'kingm', variant: '1_1_h', layout: 'half', aspectRatio: 56, badge: '' },
  { code: 'spg', variant: '1_1_h', layout: 'half', aspectRatio: 56, badge: '' },
  { code: 'jkgx2', variant: '1_1_h', layout: 'half', aspectRatio: 56, badge: '' },
  { code: 'fachai', variant: '1_1_h', layout: 'half', aspectRatio: 56, badge: '' },
  { code: 'rsg', variant: '1_1_h', layout: 'half', aspectRatio: 56, badge: '' },
  { code: 'pgsoft', variant: '1_1_h', layout: 'half', aspectRatio: 56, badge: '' },
  { code: 'kaga', variant: '1_1_h', layout: 'half', aspectRatio: 56, badge: '' },
  { code: 'hacksaw', variant: '1_1_h', layout: 'half', aspectRatio: 56, badge: 'NEW' },
  { code: 'cq', variant: '1_1_h', layout: 'half', aspectRatio: 56, badge: '' },
  { code: 'redtiger', variant: '1_1_h', layout: 'half', aspectRatio: 56, badge: '' },
  { code: 'hbn', variant: '1_1_h', layout: 'half', aspectRatio: 56, badge: '' },
  { code: 'wmslot', variant: '1_1_h', layout: 'half', aspectRatio: 56, badge: '' },
  { code: 'evp', variant: '1_1_h', layout: 'half', aspectRatio: 56, badge: '' },
  { code: 'netent', variant: '1_1_h', layout: 'half', aspectRatio: 56, badge: '' },
  { code: 'ps', variant: '1_1_h', layout: 'half', aspectRatio: 56, badge: '' },
  { code: 'pokslot', variant: '1_1_h', layout: 'half', aspectRatio: 56, badge: '' },
  { code: 'edp', variant: '1_1_h', layout: 'half', aspectRatio: 56, badge: '' },
  { code: 'spp', variant: '1_1_h', layout: 'half', aspectRatio: 56, badge: '' },
  { code: 'ame', variant: '1_1_h', layout: 'half', aspectRatio: 56, badge: '' },
  { code: 'bng', variant: '1_1_h', layout: 'half', aspectRatio: 56, badge: '' },
  { code: 'r88', variant: '1_1_h', layout: 'half', aspectRatio: 56, badge: '' },
  { code: 'cala', variant: '1_1_h', layout: 'half', aspectRatio: 56, badge: '' },
  { code: 'glx', variant: '1_1_h', layout: 'half', aspectRatio: 56, badge: '' },
  { code: 'l22', variant: '1_1_h', layout: 'half', aspectRatio: 56, badge: '' },
  { code: 'reg', variant: '1_1_h', layout: 'half', aspectRatio: 56, badge: '' },
  { code: 'ygg', variant: '1_1_h', layout: 'half', aspectRatio: 56, badge: '' },
  { code: 'fs', variant: '1_1_h', layout: 'half', aspectRatio: 56, badge: '' },
  { code: 'pgsus', variant: '1_1_h', layout: 'half', aspectRatio: 56, badge: '' },
  { code: 'n2', variant: '1_1_h', layout: 'half', aspectRatio: 56, badge: '' },
  { code: 'ap', variant: '1_1_h', layout: 'half', aspectRatio: 56, badge: '' },
  { code: 'amb', variant: '1_1_h', layout: 'half', aspectRatio: 56, badge: '' },
  { code: 'ask', variant: '1_1_h', layout: 'half', aspectRatio: 56, badge: '' },
  { code: 'nlc', variant: '1_1_h', layout: 'half', aspectRatio: 56, badge: '' },
  { code: 'vp', variant: '1_1_h', layout: 'half', aspectRatio: 56, badge: 'NEW' },
  { code: 'drag', variant: '1_1_h', layout: 'half', aspectRatio: 56, badge: 'NEW' },
  { code: 'acewin', variant: '1_1_h', layout: 'half', aspectRatio: 56, badge: 'NEW' },
  { code: 'rb7slot', variant: '1_1_h', layout: 'half', aspectRatio: 56, badge: 'NEW' },
];

const SLOT_PROVIDER_BY_CODE = new Map(SLOT_PROVIDER_COVERS.map((item) => [item.code, item] as const));
const SLOT_PROVIDER_ORDER = new Map(SLOT_PROVIDER_COVERS.map((item, index) => [item.code, index] as const));

const MOBILE_WIDE_PROVIDER_KEYS = new Set([
  'casino:sexyd',
  'slot:hotdog',
  'fishing:misoltfish',
  'sport:lali',
  'card:amb',
]);

const PROVIDER_COVER_CODE_ALIASES: Record<string, string> = {
  cq9: 'cq',
  evolution: 'evp',
  jili: 'jl',
  joker: 'jkgx2',
  kingmaker: 'kingm',
  nolimit: 'nlc',
  nolimitcity: 'nlc',
  pragmatic: 'pp',
  pragmaticplay: 'pp',
  playstar: 'ps',
  pg: 'pgsoft',
};

export function resolveMobileProviderCover(category: string, providerCode: string): MobileProviderCover {
  const normalizedCategory = normalizeCategory(category);
  const normalizedCode = normalizeProviderCode(providerCode);
  const coverCode = PROVIDER_COVER_CODE_ALIASES[normalizedCode] ?? normalizedCode;
  const exact = normalizedCategory === 'slot' ? SLOT_PROVIDER_BY_CODE.get(coverCode) : undefined;
  const wide = MOBILE_WIDE_PROVIDER_KEYS.has(`${normalizedCategory}:${coverCode}`);
  const seed: MobileProviderCoverSeed = exact ?? {
    code: coverCode,
    variant: wide ? '1_1_l' : '1_1_h',
    layout: wide ? 'full' : 'half',
    aspectRatio: wide ? 31 : 56,
    badge: '',
  };

  return {
    ...seed,
    sourceUrl: `https://cdn.zabbet.com/providers/set/${seed.variant}/${seed.code}.png`,
  };
}

export function mobileProviderSortIndex(category: string, providerCode: string): number {
  if (normalizeCategory(category) !== 'slot') return Number.MAX_SAFE_INTEGER;
  const normalizedCode = normalizeProviderCode(providerCode);
  const coverCode = PROVIDER_COVER_CODE_ALIASES[normalizedCode] ?? normalizedCode;
  return SLOT_PROVIDER_ORDER.get(coverCode) ?? Number.MAX_SAFE_INTEGER;
}

function normalizeCategory(value: string) {
  const category = value.trim().toLowerCase();
  if (category === 'sports') return 'sport';
  if (category === 'fish') return 'fishing';
  if (category === 'table') return 'card';
  if (category === 'lotto') return 'lottery';
  return category;
}

function normalizeProviderCode(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\.(?:png|jpe?g|webp|svg)$/i, '')
    .replace(/[^a-z0-9_-]+/g, '');
}
