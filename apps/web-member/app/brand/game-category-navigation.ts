import type { PublicSiteSettings } from '../site-settings';
import { isSafeBrandIconValue, type ExtendedBrandIconKey } from './brand-icon-registry';
import { DEFAULT_REFERENCE_MENU_ICONS } from './reference-site-settings';

export type GameCategoryNavigationKey =
  | 'home'
  | 'casino'
  | 'slot'
  | 'live'
  | 'sport'
  | 'fishing'
  | 'lottery'
  | 'card'
  | 'arcade'
  | 'new'
  | 'popular'
  | 'other';

export type GameCategoryNavigationEntry = {
  key: GameCategoryNavigationKey;
  label: string;
  iconName: ExtendedBrandIconKey;
  iconValue: string;
  category?: string;
};

export type GameCategoryNavigationConfig = Record<
  GameCategoryNavigationKey,
  Omit<GameCategoryNavigationEntry, 'category'> & { aliases: string[] }
>;

type SettingsSource = Pick<PublicSiteSettings, 'website' | 'icons'>;

const DEFINITIONS: Array<{
  key: GameCategoryNavigationKey;
  label: string;
  iconName: ExtendedBrandIconKey;
  aliases: string[];
}> = [
  { key: 'home', label: 'หน้าหลัก', iconName: 'home', aliases: ['home', 'all', 'main'] },
  { key: 'casino', label: 'คาสิโน', iconName: 'casino', aliases: ['casino', 'casino-game', 'table'] },
  { key: 'slot', label: 'สล็อต', iconName: 'slot', aliases: ['slot', 'slots', 'slot-game'] },
  { key: 'live', label: 'คาสิโนสด', iconName: 'live', aliases: ['live', 'live-casino', 'livecasino'] },
  { key: 'sport', label: 'กีฬา', iconName: 'sport', aliases: ['sport', 'sports', 'sportbook', 'sportsbook'] },
  { key: 'fishing', label: 'เกมตกปลา', iconName: 'fishing', aliases: ['fishing', 'fish', 'shooting-fish'] },
  { key: 'lottery', label: 'หวย', iconName: 'lottery', aliases: ['lottery', 'lotto', 'หวย'] },
  { key: 'card', label: 'ไพ่', iconName: 'card', aliases: ['card', 'cards', 'poker'] },
  { key: 'arcade', label: 'อาร์เคด', iconName: 'arcade', aliases: ['arcade', 'mini-game', 'minigame'] },
  { key: 'new', label: 'เกมใหม่', iconName: 'new', aliases: ['new', 'newest', 'latest'] },
  { key: 'popular', label: 'ยอดนิยม', iconName: 'popular', aliases: ['popular', 'hot', 'trending'] },
  { key: 'other', label: 'เกมอื่น ๆ', iconName: 'games', aliases: [] },
];

const DEFAULT_ICONS: Record<GameCategoryNavigationKey, string> = {
  home: DEFAULT_REFERENCE_MENU_ICONS.home,
  casino: DEFAULT_REFERENCE_MENU_ICONS.casino,
  slot: DEFAULT_REFERENCE_MENU_ICONS.slot,
  live: DEFAULT_REFERENCE_MENU_ICONS.live,
  sport: DEFAULT_REFERENCE_MENU_ICONS.sport,
  fishing: DEFAULT_REFERENCE_MENU_ICONS.fishing,
  lottery: DEFAULT_REFERENCE_MENU_ICONS.lottery,
  card: DEFAULT_REFERENCE_MENU_ICONS.card,
  arcade: DEFAULT_REFERENCE_MENU_ICONS.arcade,
  new: DEFAULT_REFERENCE_MENU_ICONS.new,
  popular: DEFAULT_REFERENCE_MENU_ICONS.popular,
  other: DEFAULT_REFERENCE_MENU_ICONS.games,
};

export function createGameCategoryNavigationConfig(settings: SettingsSource): GameCategoryNavigationConfig {
  const website = settings.website ?? {};
  const icons = settings.icons ?? {};

  return Object.fromEntries(DEFINITIONS.map((definition) => {
    const labelKey = `game_category_${definition.key}_label`;
    const iconKey = `game_category_${definition.key}_icon`;
    const label = cleanLabel(website[labelKey], definition.label);
    const configuredIcon = icons[iconKey];
    const iconValue = isSafeBrandIconValue(configuredIcon)
      ? configuredIcon.trim()
      : DEFAULT_ICONS[definition.key];

    return [definition.key, {
      key: definition.key,
      label,
      iconName: definition.iconName,
      iconValue,
      aliases: definition.aliases,
    }];
  })) as GameCategoryNavigationConfig;
}

export function buildVisibleGameCategoryNavigation(
  categories: unknown,
  config: GameCategoryNavigationConfig,
): GameCategoryNavigationEntry[] {
  const source = Array.isArray(categories)
    ? categories.filter((item): item is string => typeof item === 'string' && Boolean(item.trim()))
    : [];
  const seenCategories = new Set<string>();
  const seenKeys = new Set<GameCategoryNavigationKey>(['home']);
  const entries: GameCategoryNavigationEntry[] = [{ ...config.home }];

  for (const rawCategory of source) {
    const normalized = normalizeCategory(rawCategory);
    if (!normalized || seenCategories.has(normalized)) continue;
    seenCategories.add(normalized);

    const known = DEFINITIONS.find((definition) =>
      definition.key !== 'home' && definition.key !== 'other'
      && definition.aliases.some((alias) => normalizeCategory(alias) === normalized),
    );

    if (known) {
      if (seenKeys.has(known.key)) continue;
      seenKeys.add(known.key);
      const item = config[known.key];
      entries.push({ ...item, category: rawCategory.trim() });
      continue;
    }

    entries.push({
      ...config.other,
      key: 'other',
      label: cleanLabel(rawCategory, config.other.label),
      category: rawCategory.trim(),
    });
  }

  return entries;
}

export function normalizeCategory(value: unknown) {
  if (typeof value !== 'string') return '';
  return value.trim().toLowerCase().replace(/[\s_]+/g, '-').replace(/[^a-z0-9ก-๙-]+/g, '');
}

function cleanLabel(value: unknown, fallback: string) {
  if (typeof value !== 'string') return fallback;
  const normalized = value.trim().replace(/\s+/g, ' ');
  return normalized ? normalized.slice(0, 40) : fallback;
}
