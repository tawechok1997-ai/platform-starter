import type { MemberLocale } from './member-locale-provider';
import type {
  MemberFeatureVisibilityRuntime,
  MemberIconRuntime,
  MemberNavigationItem,
} from './member-runtime-contract';
import { buildMemberNavigationRuntime } from './member-runtime-contract';
import type { TypedPublicSiteSettings } from './site-settings-types';

export function buildConfiguredMemberNavigation(
  settings: TypedPublicSiteSettings,
  locale: MemberLocale,
  features: MemberFeatureVisibilityRuntime,
  icons: MemberIconRuntime,
): MemberNavigationItem[] {
  const fallback = buildMemberNavigationRuntime(locale, features, icons);
  const configured = readItems(
    (settings.features as Record<string, unknown>).navigation_items,
    (settings.features as Record<string, unknown>).navigation_items_json,
  );
  if (!configured.length) return fallback;

  const fallbackById = new Map(fallback.map((item) => [item.id, item]));
  return configured
    .map((raw, index) => normalizeItem(raw, index, locale, features, icons, fallbackById))
    .filter((item): item is MemberNavigationItem & { order: number } => item !== null)
    .sort((left, right) => left.order - right.order)
    .map(({ order: _order, ...item }) => item);
}

function normalizeItem(
  raw: Record<string, unknown>,
  index: number,
  locale: MemberLocale,
  features: MemberFeatureVisibilityRuntime,
  icons: MemberIconRuntime,
  fallbackById: Map<string, MemberNavigationItem>,
): (MemberNavigationItem & { order: number }) | null {
  const id = slug(raw.id ?? raw.key ?? `nav-${index + 1}`);
  const fallback = fallbackById.get(id);
  const enabled = raw.enabled !== false;
  if (!enabled) return null;

  const feature = featureKey(raw.feature);
  if (feature && !features[feature]) return null;

  const label = locale === 'th'
    ? firstText(raw.labelTh, raw.label_th, raw.label, fallback?.label, id)
    : firstText(raw.labelEn, raw.label_en, raw.label, fallback?.label, id);
  const href = safeHref(raw.href) || fallback?.href || '/';
  const icon = resolveIcon(raw.iconKey ?? raw.icon_key ?? raw.icon, icons, fallback?.icon ?? icons.home);

  return {
    id,
    label,
    href,
    icon,
    feature,
    desktop: boolean(raw.desktop, fallback?.desktop ?? true),
    mobile: boolean(raw.mobile, fallback?.mobile ?? true),
    requiresAuth: boolean(raw.requiresAuth ?? raw.requires_auth, fallback?.requiresAuth ?? false),
    badge: optionalText(raw.badge),
    order: finite(raw.order ?? raw.sequence, index),
  };
}

function readItems(...values: unknown[]) {
  for (const value of values) {
    if (Array.isArray(value)) return value.map(record).filter((item) => Object.keys(item).length > 0);
    if (typeof value === 'string' && value.trim()) {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed.map(record).filter((item) => Object.keys(item).length > 0);
      } catch {
        // Keep the built-in navigation when JSON is invalid.
      }
    }
  }
  return [];
}

function resolveIcon(value: unknown, icons: MemberIconRuntime, fallback: string) {
  const key = typeof value === 'string' ? value.trim() : '';
  if (key && key in icons) return icons[key as keyof MemberIconRuntime];
  if (/^(?:https?:\/\/|\/)/i.test(key)) return key;
  return fallback;
}

function featureKey(value: unknown): keyof MemberFeatureVisibilityRuntime | undefined {
  if (typeof value !== 'string' || !value.trim()) return undefined;
  const key = value.trim() as keyof MemberFeatureVisibilityRuntime;
  return key;
}

function safeHref(value: unknown) {
  if (typeof value !== 'string') return '';
  const href = value.trim();
  return href.startsWith('/') || /^https?:\/\//i.test(href) ? href : '';
}

function boolean(value: unknown, fallback: boolean) {
  return typeof value === 'boolean' ? value : fallback;
}

function finite(value: unknown, fallback: number) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function optionalText(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function firstText(...values: unknown[]) {
  return values.find((value): value is string => typeof value === 'string' && Boolean(value.trim()))?.trim() ?? '';
}

function slug(value: unknown) {
  const source = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return source.replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || 'navigation-item';
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
