import type { AdminTableQueryState } from './data-query-state';

export const ADMIN_DATA_VIEW_SCHEMA_VERSION = 1 as const;

export type AdminColumnPreference = {
  columnId: string;
  visible: boolean;
  order: number;
};

export type AdminSavedView = {
  id: string;
  name: string;
  query: AdminTableQueryState;
  columns: readonly AdminColumnPreference[];
  updatedAt: string;
};

export type AdminDataViewEnvelope = {
  version: typeof ADMIN_DATA_VIEW_SCHEMA_VERSION;
  activeViewId: string | null;
  views: readonly AdminSavedView[];
};

export function buildAdminDataViewStorageKey(userId: string, workspaceId: string) {
  return `admin_data_views_v${ADMIN_DATA_VIEW_SCHEMA_VERSION}:${sanitizeKey(userId)}:${sanitizeKey(workspaceId)}`;
}

export function normalizeColumnPreferences(
  availableColumnIds: readonly string[],
  preferences: readonly Partial<AdminColumnPreference>[] | null | undefined,
  requiredColumnIds: readonly string[] = [],
): readonly AdminColumnPreference[] {
  const available = new Set(availableColumnIds);
  const required = new Set(requiredColumnIds.filter((id) => available.has(id)));
  const seen = new Set<string>();
  const normalized: AdminColumnPreference[] = [];

  for (const preference of preferences ?? []) {
    const columnId = typeof preference.columnId === 'string' ? preference.columnId : '';
    if (!available.has(columnId) || seen.has(columnId)) continue;
    seen.add(columnId);
    normalized.push({
      columnId,
      visible: required.has(columnId) ? true : preference.visible !== false,
      order: normalizeOrder(preference.order, normalized.length),
    });
  }

  for (const columnId of availableColumnIds) {
    if (seen.has(columnId)) continue;
    normalized.push({ columnId, visible: true, order: normalized.length });
  }

  return Object.freeze(
    normalized
      .toSorted((left, right) => left.order - right.order || availableColumnIds.indexOf(left.columnId) - availableColumnIds.indexOf(right.columnId))
      .map((preference, order) => Object.freeze({ ...preference, order })),
  );
}

export function visibleColumnIds(preferences: readonly AdminColumnPreference[]) {
  return preferences.filter((preference) => preference.visible).map((preference) => preference.columnId);
}

export function upsertAdminSavedView(
  envelope: AdminDataViewEnvelope,
  view: AdminSavedView,
  maxViews = 20,
): AdminDataViewEnvelope {
  const sanitized = sanitizeSavedView(view);
  const views = [
    sanitized,
    ...envelope.views.filter((item) => item.id !== sanitized.id),
  ]
    .toSorted((left, right) => right.updatedAt.localeCompare(left.updatedAt))
    .slice(0, Math.max(1, maxViews));

  return Object.freeze({
    version: ADMIN_DATA_VIEW_SCHEMA_VERSION,
    activeViewId: sanitized.id,
    views: Object.freeze(views),
  });
}

export function removeAdminSavedView(envelope: AdminDataViewEnvelope, viewId: string): AdminDataViewEnvelope {
  const views = envelope.views.filter((view) => view.id !== viewId);
  return Object.freeze({
    version: ADMIN_DATA_VIEW_SCHEMA_VERSION,
    activeViewId: envelope.activeViewId === viewId ? null : envelope.activeViewId,
    views: Object.freeze(views),
  });
}

export function parseAdminDataViewEnvelope(raw: string | null | undefined): AdminDataViewEnvelope {
  if (!raw) return emptyEnvelope();
  try {
    const parsed = JSON.parse(raw) as Partial<AdminDataViewEnvelope>;
    if (parsed.version !== ADMIN_DATA_VIEW_SCHEMA_VERSION || !Array.isArray(parsed.views)) return emptyEnvelope();
    const views = parsed.views.flatMap((view) => {
      try {
        return [sanitizeSavedView(view as AdminSavedView)];
      } catch {
        return [];
      }
    });
    const activeViewId = typeof parsed.activeViewId === 'string' && views.some((view) => view.id === parsed.activeViewId)
      ? parsed.activeViewId
      : null;
    return Object.freeze({
      version: ADMIN_DATA_VIEW_SCHEMA_VERSION,
      activeViewId,
      views: Object.freeze(views),
    });
  } catch {
    return emptyEnvelope();
  }
}

export function serializeAdminDataViewEnvelope(envelope: AdminDataViewEnvelope) {
  return JSON.stringify({
    version: ADMIN_DATA_VIEW_SCHEMA_VERSION,
    activeViewId: envelope.activeViewId,
    views: envelope.views,
  });
}

export function emptyEnvelope(): AdminDataViewEnvelope {
  return Object.freeze({ version: ADMIN_DATA_VIEW_SCHEMA_VERSION, activeViewId: null, views: Object.freeze([]) });
}

function sanitizeSavedView(view: AdminSavedView): AdminSavedView {
  if (!view || typeof view.id !== 'string' || !view.id.trim()) throw new Error('Saved view id is required');
  if (typeof view.name !== 'string' || !view.name.trim()) throw new Error('Saved view name is required');
  if (!view.query || !Array.isArray(view.columns)) throw new Error('Saved view payload is invalid');
  const updatedAt = Number.isFinite(Date.parse(view.updatedAt)) ? new Date(view.updatedAt).toISOString() : new Date(0).toISOString();
  return Object.freeze({
    id: view.id.trim().slice(0, 80),
    name: view.name.trim().slice(0, 120),
    query: Object.freeze({
      ...view.query,
      filters: Object.freeze({ ...view.query.filters }),
      sort: view.query.sort ? Object.freeze({ ...view.query.sort }) : null,
    }),
    columns: Object.freeze(view.columns.map((column, index) => Object.freeze({
      columnId: String(column.columnId).trim(),
      visible: column.visible !== false,
      order: normalizeOrder(column.order, index),
    })).filter((column) => column.columnId)),
    updatedAt,
  });
}

function normalizeOrder(value: number | undefined, fallback: number) {
  return Number.isInteger(value) && Number(value) >= 0 ? Number(value) : fallback;
}

function sanitizeKey(value: string) {
  const sanitized = value.trim().replace(/[^a-zA-Z0-9_-]+/g, '_').slice(0, 100);
  return sanitized || 'anonymous';
}
