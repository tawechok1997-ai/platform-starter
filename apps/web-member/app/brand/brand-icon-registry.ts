import type { IconKey, SiteIconSettings } from '../site-settings';

export type ExtendedBrandIconKey =
  | IconKey
  | 'search'
  | 'close'
  | 'back'
  | 'forward'
  | 'menu'
  | 'language'
  | 'refresh'
  | 'showPassword'
  | 'hidePassword'
  | 'check'
  | 'error'
  | 'warning'
  | 'upload'
  | 'download'
  | 'copy'
  | 'calendar'
  | 'time'
  | 'casino'
  | 'slot'
  | 'fishing'
  | 'sport'
  | 'card'
  | 'lottery'
  | 'live'
  | 'arcade'
  | 'favorite'
  | 'new'
  | 'popular';

export type ExtendedBrandIconSettings = Partial<Record<ExtendedBrandIconKey, string>>;

export const EXTENDED_ICON_FALLBACKS: Readonly<Record<Exclude<ExtendedBrandIconKey, IconKey>, string>> = {
  search: '⌕', close: '×', back: '←', forward: '→', menu: '☰', language: '文', refresh: '↻',
  showPassword: '◉', hidePassword: '⊘', check: '✓', error: '!', warning: '△', upload: '↑', download: '↓',
  copy: '▣', calendar: '□', time: '◷', casino: '♠', slot: '▦', fishing: '◁', sport: '⚽', card: '♣',
  lottery: '◎', live: '●', arcade: '◆', favorite: '♡', new: 'N', popular: '★',
};

export function resolveBrandIcon(
  key: ExtendedBrandIconKey,
  configured: ExtendedBrandIconSettings,
  existing: SiteIconSettings,
): string {
  const value = configured[key];
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (key in existing) return existing[key as IconKey];
  return EXTENDED_ICON_FALLBACKS[key as Exclude<ExtendedBrandIconKey, IconKey>];
}

export function isSafeBrandIconValue(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const candidate = value.trim();
  if (!candidate || candidate.length > 500) return false;
  if (/javascript:|data:text\/html|<script|onerror\s*=|onload\s*=/i.test(candidate)) return false;
  return true;
}
