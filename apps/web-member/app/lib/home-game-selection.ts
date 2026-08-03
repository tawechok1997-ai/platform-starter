import { randomizeGameCatalog } from './randomize-game-catalog';

export const HOME_GAME_SETTINGS_KEY = 'home_game_sections_json';

export type HomeGameSectionKey = 'featured' | 'popular' | 'online' | 'classic';
export type HomeGamePlatform = 'pc' | 'mobile';
export type HomeGameSelectionMode = 'auto' | 'manual' | 'hybrid';

export type HomeGameSelectionCandidate = {
  id: string;
  providerGameCode?: string;
  name: string;
  provider?: string;
  category?: string;
  tags?: readonly string[];
  players?: number;
  popular?: boolean;
  fresh?: boolean;
  badge?: string;
};

export type HomeGameSectionSelection = {
  mode: HomeGameSelectionMode;
  pc: string[];
  mobile: string[];
  limitPc: number;
  limitMobile: number;
};

export type HomeGameSelectionConfig = {
  version: 1;
  sections: Record<HomeGameSectionKey, HomeGameSectionSelection>;
};

const SECTION_KEYS: HomeGameSectionKey[] = ['featured', 'popular', 'online', 'classic'];
const DEFAULT_LIMITS: Record<HomeGameSectionKey, { pc: number; mobile: number }> = {
  featured: { pc: 8, mobile: 8 },
  popular: { pc: 10, mobile: 10 },
  online: { pc: 6, mobile: 6 },
  classic: { pc: 6, mobile: 12 },
};

// These names are only priority hints. The runtime still serves games from the
// connected catalog and never creates games that do not exist in the API.
const INTERNET_POPULAR_NAMES = [
  'Gates of Olympus',
  'Gates of Olympus 1000',
  'Sweet Bonanza',
  'Sweet Bonanza 1000',
  'Fortune Tiger',
  'Mahjong Ways 2',
  'Mahjong Ways',
  'Crazy Time',
  'Lightning Roulette',
  'Monopoly Live',
  'Aviator',
  'Big Bass Bonanza',
  'The Dog House Megaways',
  'Sugar Rush 1000',
  'Starlight Princess',
  'Mega Moolah',
  'Book of Dead',
  'Starburst',
  "Fishin' Frenzy",
  'Ocean King 3',
] as const;

const CLASSIC_NAMES = [
  'Mega Moolah',
  'Book of Dead',
  'Starburst',
  "Fishin' Frenzy",
  'Blackjack',
  'Roulette',
  'Baccarat',
  'Mahjong Ways',
  'Fortune Tiger',
] as const;

export function defaultHomeGameSelectionConfig(): HomeGameSelectionConfig {
  return {
    version: 1,
    sections: Object.fromEntries(SECTION_KEYS.map((section) => [section, {
      mode: 'hybrid',
      pc: [],
      mobile: [],
      limitPc: DEFAULT_LIMITS[section].pc,
      limitMobile: DEFAULT_LIMITS[section].mobile,
    }])) as HomeGameSelectionConfig['sections'],
  };
}

export function parseHomeGameSelectionConfig(value: unknown): HomeGameSelectionConfig {
  const defaults = defaultHomeGameSelectionConfig();
  const source = parseRecord(value);
  const sections = parseRecord(source.sections);

  for (const section of SECTION_KEYS) {
    const item = parseRecord(sections[section]);
    defaults.sections[section] = {
      mode: selectionMode(item.mode),
      pc: stringList(item.pc),
      mobile: stringList(item.mobile),
      limitPc: boundedLimit(item.limitPc, DEFAULT_LIMITS[section].pc),
      limitMobile: boundedLimit(item.limitMobile, DEFAULT_LIMITS[section].mobile),
    };
  }

  return defaults;
}

export function homeGameSelectionFromFeatures(features: Record<string, unknown> | null | undefined) {
  return parseHomeGameSelectionConfig(features?.[HOME_GAME_SETTINGS_KEY]);
}

export function selectHomeGameSection<T extends HomeGameSelectionCandidate>(
  items: readonly T[],
  section: HomeGameSectionKey,
  platform: HomeGamePlatform,
  features: Record<string, unknown> | null | undefined,
  explicitLimit?: number,
  random: () => number = Math.random,
): T[] {
  const config = homeGameSelectionFromFeatures(features);
  const sectionConfig = config.sections[section];
  const configuredRefs = sectionConfig[platform];
  const limit = boundedLimit(
    explicitLimit,
    platform === 'pc' ? sectionConfig.limitPc : sectionConfig.limitMobile,
  );
  const configured = configuredRefs
    .map((reference) => items.find((item) => matchesReference(item, reference)))
    .filter((item): item is T => Boolean(item));
  const automatic = automaticSelection(items, section, random);

  if (sectionConfig.mode === 'manual') return uniqueGames(configured).slice(0, limit);
  if (sectionConfig.mode === 'auto') return automatic.slice(0, limit);
  return uniqueGames([...configured, ...automatic]).slice(0, limit);
}

export function homeGameReference(item: HomeGameSelectionCandidate) {
  const provider = normalize(item.provider ?? '');
  const code = normalize(item.providerGameCode ?? item.id);
  return provider && code ? `${provider}:${code}` : normalize(item.id);
}

function automaticSelection<T extends HomeGameSelectionCandidate>(
  items: readonly T[],
  section: HomeGameSectionKey,
  random: () => number,
) {
  const shuffled = randomizeGameCatalog(items, random);
  const eligible = section === 'classic'
    ? shuffled.filter(isClassic)
    : section === 'online'
      ? shuffled.filter((item) => finite(item.players) > 0)
      : shuffled;
  const source = eligible.length > 0 ? eligible : shuffled;

  return source.sort((left, right) => {
    const rightScore = automaticScore(right, section);
    const leftScore = automaticScore(left, section);
    return rightScore - leftScore;
  });
}

function automaticScore(item: HomeGameSelectionCandidate, section: HomeGameSectionKey) {
  const popularRank = namePriority(item.name, INTERNET_POPULAR_NAMES);
  const classicRank = namePriority(item.name, CLASSIC_NAMES);
  const tags = (item.tags ?? []).map(normalize);
  const isHot = tags.includes('hot') || tags.includes('popular') || normalize(item.badge ?? '') === 'hot';
  const players = finite(item.players);

  if (section === 'online') return players * 100 + popularRank;
  if (section === 'classic') {
    return classicRank * 1_000_000
      + (item.popular || isHot ? 100_000 : 0)
      + players;
  }
  if (section === 'featured') {
    return popularRank * 1_000_000
      + (item.popular || isHot ? 150_000 : 0)
      + (item.fresh || normalize(item.badge ?? '') === 'new' ? 20_000 : 0)
      + players;
  }
  return popularRank * 1_000_000
    + (item.popular || isHot ? 150_000 : 0)
    + players;
}

function isClassic(item: HomeGameSelectionCandidate) {
  const category = normalize(item.category ?? '');
  const tags = (item.tags ?? []).map(normalize);
  return ['arcade', 'classic', 'card', 'table', 'baccarat', 'roulette'].includes(category)
    || tags.some((tag) => ['arcade', 'classic', 'card', 'table', 'baccarat', 'roulette'].includes(tag))
    || namePriority(item.name, CLASSIC_NAMES) > 0;
}

function matchesReference(item: HomeGameSelectionCandidate, reference: string) {
  const normalized = normalize(reference);
  if (!normalized) return false;
  const candidates = [
    normalize(item.id),
    normalize(item.providerGameCode ?? ''),
    homeGameReference(item),
    normalize(item.name),
  ];
  return candidates.includes(normalized);
}

function namePriority(name: string, names: readonly string[]) {
  const normalizedName = normalize(name);
  const index = names.findIndex((candidate) => {
    const normalizedCandidate = normalize(candidate);
    return normalizedName === normalizedCandidate
      || normalizedName.includes(normalizedCandidate)
      || normalizedCandidate.includes(normalizedName);
  });
  return index < 0 ? 0 : names.length - index;
}

function uniqueGames<T extends HomeGameSelectionCandidate>(items: readonly T[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = homeGameReference(item) || normalize(item.id);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function parseRecord(value: unknown): Record<string, unknown> {
  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? parsed as Record<string, unknown>
        : {};
    } catch {
      return {};
    }
  }
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function stringList(value: unknown) {
  const values = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(/[\n,]+/)
      : [];
  return [...new Set(values
    .filter((item): item is string => typeof item === 'string')
    .map((item) => normalize(item))
    .filter(Boolean))].slice(0, 40);
}

function selectionMode(value: unknown): HomeGameSelectionMode {
  return value === 'auto' || value === 'manual' || value === 'hybrid' ? value : 'hybrid';
}

function boundedLimit(value: unknown, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(30, Math.max(1, Math.round(parsed)));
}

function finite(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function normalize(value: string) {
  return value
    .toLocaleLowerCase('en-US')
    .replace(/[^a-z0-9ก-๙]+/g, ' ')
    .trim();
}
