export const ADMIN_WIDGET_LAYOUT_VERSION = 1;
export const ADMIN_WIDGET_LAYOUT_STORAGE_PREFIX = 'admin_widget_layout_v1';

export type AdminChartKind = 'bar' | 'line' | 'area' | 'donut' | 'stacked-bar';
export type AdminWidgetDataState = 'ready' | 'loading' | 'empty' | 'error' | 'partial';
export type AdminWidgetExportFormat = 'csv' | 'png';
export type AdminDateRangePreset = 'today' | '7d' | '30d' | '90d' | 'custom';
export type AdminComparePeriod = 'none' | 'previous-period' | 'previous-year';
export type AdminWidgetColumnSpan = 1 | 2 | 3 | 4;
export type AdminWidgetRowSpan = 1 | 2 | 3;
export type AdminWidgetWorkspaceId = 'finance' | 'payments' | 'growth' | 'manager' | 'system';

export type AdminDateRange = {
  start: string;
  end: string;
};

export type AdminWidgetLayoutItem = {
  widgetId: string;
  order: number;
  columns: AdminWidgetColumnSpan;
  rows: AdminWidgetRowSpan;
  pinned: boolean;
  hidden: boolean;
};

export type AdminSavedWidgetLayout = {
  version: typeof ADMIN_WIDGET_LAYOUT_VERSION;
  adminUserId: string;
  updatedAt: string;
  items: AdminWidgetLayoutItem[];
};

export type AdminWidgetDefinition = {
  id: string;
  title: string;
  description?: string | undefined;
  chartKind?: AdminChartKind | undefined;
  requiredPermissions?: readonly string[] | undefined;
  workspaceIds?: readonly AdminWidgetWorkspaceId[] | undefined;
  defaultLayout: Omit<AdminWidgetLayoutItem, 'widgetId' | 'hidden'> & { hidden?: boolean | undefined };
  allowFullscreen?: boolean | undefined;
  allowDrillDown?: boolean | undefined;
  exportFormats?: readonly AdminWidgetExportFormat[] | undefined;
};

export type AdminWidgetRegistry = {
  definitions: readonly AdminWidgetDefinition[];
  get: (widgetId: string) => AdminWidgetDefinition | null;
  visibleTo: (permissions: readonly string[]) => readonly AdminWidgetDefinition[];
};

const WIDGET_ID_PATTERN = /^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function createAdminWidgetRegistry(definitions: readonly AdminWidgetDefinition[]): AdminWidgetRegistry {
  const seen = new Set<string>();
  const normalized = definitions.map((definition) => {
    if (!WIDGET_ID_PATTERN.test(definition.id)) {
      throw new Error(`Invalid Admin widget id: ${definition.id}`);
    }
    if (seen.has(definition.id)) {
      throw new Error(`Duplicate Admin widget id: ${definition.id}`);
    }
    seen.add(definition.id);

    return Object.freeze({
      ...definition,
      requiredPermissions: Object.freeze([...(definition.requiredPermissions ?? [])]),
      workspaceIds: Object.freeze([...(definition.workspaceIds ?? [])]),
      exportFormats: Object.freeze([...(definition.exportFormats ?? [])]),
      defaultLayout: Object.freeze({ ...definition.defaultLayout }),
    });
  });
  const byId = new Map(normalized.map((definition) => [definition.id, definition]));
  const frozenDefinitions = Object.freeze(normalized);

  return Object.freeze({
    definitions: frozenDefinitions,
    get: (widgetId: string) => byId.get(widgetId) ?? null,
    visibleTo: (permissions: readonly string[]) => frozenDefinitions.filter((definition) => canAccessAdminWidget(definition, permissions)),
  });
}

export function canAccessAdminWidget(definition: AdminWidgetDefinition, permissions: readonly string[]): boolean {
  const required = definition.requiredPermissions ?? [];
  if (required.length === 0) return true;
  const held = new Set(permissions);
  return held.has('*') || required.some((permission) => held.has(permission));
}

export function canShowAdminWidgetInWorkspace(
  definition: AdminWidgetDefinition,
  workspace: AdminWidgetWorkspaceId | 'all',
): boolean {
  if (workspace === 'all') return true;
  const workspaceIds = definition.workspaceIds ?? [];
  return workspaceIds.length === 0 || workspaceIds.includes(workspace);
}

export function restoreDefaultAdminWidgetLayout(registry: AdminWidgetRegistry): AdminWidgetLayoutItem[] {
  return registry.definitions
    .map((definition) => normalizeLayoutItem({
      widgetId: definition.id,
      ...definition.defaultLayout,
      hidden: definition.defaultLayout.hidden ?? false,
    }))
    .sort(compareLayoutItems);
}

export function normalizeAdminWidgetLayout(
  registry: AdminWidgetRegistry,
  savedItems: readonly Partial<AdminWidgetLayoutItem>[] | null | undefined,
): AdminWidgetLayoutItem[] {
  const defaults = new Map(restoreDefaultAdminWidgetLayout(registry).map((item) => [item.widgetId, item]));
  const seen = new Set<string>();
  const restored: AdminWidgetLayoutItem[] = [];

  for (const candidate of savedItems ?? []) {
    if (typeof candidate.widgetId !== 'string' || seen.has(candidate.widgetId)) continue;
    const fallback = defaults.get(candidate.widgetId);
    if (!fallback) continue;
    seen.add(candidate.widgetId);
    restored.push(normalizeLayoutItem({ ...fallback, ...candidate, widgetId: fallback.widgetId }));
  }

  for (const fallback of defaults.values()) {
    if (!seen.has(fallback.widgetId)) restored.push(fallback);
  }

  return restored.sort(compareLayoutItems).map((item, index) => ({ ...item, order: index }));
}

export function moveAdminWidget(
  items: readonly AdminWidgetLayoutItem[],
  widgetId: string,
  targetIndex: number,
): AdminWidgetLayoutItem[] {
  const currentIndex = items.findIndex((item) => item.widgetId === widgetId);
  if (currentIndex < 0) return items.map((item) => ({ ...item }));
  const next = items.map((item) => ({ ...item }));
  const moving = next[currentIndex];
  if (!moving) return next;
  next.splice(currentIndex, 1);
  const boundedIndex = clampInteger(targetIndex, 0, next.length, next.length);
  next.splice(boundedIndex, 0, moving);
  return next.map((item, index) => ({ ...item, order: index }));
}

export function updateAdminWidgetLayoutItem(
  items: readonly AdminWidgetLayoutItem[],
  widgetId: string,
  patch: Partial<Omit<AdminWidgetLayoutItem, 'widgetId'>>,
): AdminWidgetLayoutItem[] {
  return items
    .map((item) => item.widgetId === widgetId ? normalizeLayoutItem({ ...item, ...patch, widgetId }) : { ...item })
    .sort(compareLayoutItems)
    .map((item, index) => ({ ...item, order: index }));
}

export function getAdminWidgetLayoutStorageKey(adminUserId: string): string {
  const normalizedId = adminUserId.trim();
  if (!normalizedId) throw new Error('Admin user id is required for widget layout storage');
  return `${ADMIN_WIDGET_LAYOUT_STORAGE_PREFIX}:${encodeURIComponent(normalizedId)}`;
}

export function serializeAdminWidgetLayout(
  adminUserId: string,
  items: readonly AdminWidgetLayoutItem[],
  updatedAt = new Date().toISOString(),
): string {
  const payload: AdminSavedWidgetLayout = {
    version: ADMIN_WIDGET_LAYOUT_VERSION,
    adminUserId,
    updatedAt,
    items: items.map((item) => normalizeLayoutItem(item)),
  };
  return JSON.stringify(payload);
}

export function parseAdminWidgetLayout(value: string | null | undefined, adminUserId: string): AdminSavedWidgetLayout | null {
  if (!value) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    if (!isRecord(parsed) || parsed.version !== ADMIN_WIDGET_LAYOUT_VERSION || parsed.adminUserId !== adminUserId) return null;
    if (typeof parsed.updatedAt !== 'string' || !Array.isArray(parsed.items)) return null;
    const items = parsed.items.filter(isLayoutItemLike).map(normalizeLayoutItem);
    return {
      version: ADMIN_WIDGET_LAYOUT_VERSION,
      adminUserId,
      updatedAt: parsed.updatedAt,
      items,
    };
  } catch {
    return null;
  }
}

export function resolveAdminDateRange(
  preset: AdminDateRangePreset,
  options: { now?: Date | undefined; customStart?: string | undefined; customEnd?: string | undefined } = {},
): AdminDateRange {
  const now = options.now ?? new Date();
  const end = startOfUtcDay(now);

  if (preset === 'custom') {
    const startValue = options.customStart ?? '';
    const endValue = options.customEnd ?? '';
    if (!isIsoDate(startValue) || !isIsoDate(endValue) || startValue > endValue) {
      throw new Error('Invalid custom Admin dashboard date range');
    }
    return { start: startValue, end: endValue };
  }

  const dayCount = preset === 'today' ? 1 : preset === '7d' ? 7 : preset === '30d' ? 30 : 90;
  const start = addUtcDays(end, -(dayCount - 1));
  return { start: formatIsoDate(start), end: formatIsoDate(end) };
}

export function resolveAdminCompareRange(range: AdminDateRange, compare: AdminComparePeriod): AdminDateRange | null {
  if (compare === 'none') return null;
  const start = parseIsoDate(range.start);
  const end = parseIsoDate(range.end);
  if (!start || !end || start > end) throw new Error('Invalid Admin dashboard compare range');

  if (compare === 'previous-year') {
    return {
      start: formatIsoDate(shiftUtcYear(start, -1)),
      end: formatIsoDate(shiftUtcYear(end, -1)),
    };
  }

  const durationDays = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
  const previousEnd = addUtcDays(start, -1);
  const previousStart = addUtcDays(previousEnd, -(durationDays - 1));
  return { start: formatIsoDate(previousStart), end: formatIsoDate(previousEnd) };
}

function normalizeLayoutItem(item: Partial<AdminWidgetLayoutItem> & { widgetId: string }): AdminWidgetLayoutItem {
  return {
    widgetId: item.widgetId,
    order: clampInteger(item.order, 0, 10_000, 0),
    columns: clampInteger(item.columns, 1, 4, 1) as AdminWidgetColumnSpan,
    rows: clampInteger(item.rows, 1, 3, 1) as AdminWidgetRowSpan,
    pinned: item.pinned === true,
    hidden: item.hidden === true,
  };
}

function compareLayoutItems(left: AdminWidgetLayoutItem, right: AdminWidgetLayoutItem): number {
  if (left.pinned !== right.pinned) return left.pinned ? -1 : 1;
  if (left.order !== right.order) return left.order - right.order;
  return left.widgetId.localeCompare(right.widgetId);
}

function clampInteger(value: unknown, minimum: number, maximum: number, fallback: number): number {
  const numeric = typeof value === 'number' && Number.isFinite(value) ? Math.trunc(value) : fallback;
  return Math.min(maximum, Math.max(minimum, numeric));
}

function startOfUtcDay(value: Date): Date {
  if (!Number.isFinite(value.getTime())) throw new Error('Invalid Admin dashboard date');
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

function addUtcDays(value: Date, days: number): Date {
  const result = new Date(value.getTime());
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function shiftUtcYear(value: Date, years: number): Date {
  const result = new Date(value.getTime());
  result.setUTCFullYear(result.getUTCFullYear() + years);
  return result;
}

function formatIsoDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function parseIsoDate(value: string): Date | null {
  if (!isIsoDate(value)) return null;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && formatIsoDate(parsed) === value ? parsed : null;
}

function isIsoDate(value: string): boolean {
  return ISO_DATE_PATTERN.test(value) && parseIsoDateWithoutRecursion(value);
}

function parseIsoDateWithoutRecursion(value: string): boolean {
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && formatIsoDate(parsed) === value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isLayoutItemLike(value: unknown): value is Partial<AdminWidgetLayoutItem> & { widgetId: string } {
  return isRecord(value) && typeof value.widgetId === 'string';
}
