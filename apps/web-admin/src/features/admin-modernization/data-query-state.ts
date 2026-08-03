export type AdminSortDirection = 'asc' | 'desc';

export type AdminTableSort = {
  columnId: string;
  direction: AdminSortDirection;
};

export type AdminTableQueryState = {
  page: number;
  pageSize: number;
  search: string;
  sort: AdminTableSort | null;
  filters: Readonly<Record<string, string>>;
};

export type AdminTableQueryDefaults = Partial<AdminTableQueryState> & {
  allowedPageSizes?: readonly number[];
  allowedSortColumns?: readonly string[];
  allowedFilterKeys?: readonly string[];
};

const DEFAULT_PAGE_SIZE = 20;

export function parseAdminTableQuery(
  source: URLSearchParams | Readonly<Record<string, string | string[] | undefined>>,
  defaults: AdminTableQueryDefaults = {},
): AdminTableQueryState {
  const read = createReader(source);
  const allowedPageSizes = defaults.allowedPageSizes ?? [20, 50, 100];
  const fallbackPageSize = normalizePageSize(defaults.pageSize ?? DEFAULT_PAGE_SIZE, allowedPageSizes, DEFAULT_PAGE_SIZE);
  const page = normalizePositiveInteger(read('page'), defaults.page ?? 1);
  const pageSize = normalizePageSize(read('take') ?? read('pageSize'), allowedPageSizes, fallbackPageSize);
  const search = normalizeSearch(read('q') ?? read('search') ?? defaults.search ?? '');
  const sort = normalizeSort(
    read('sort') ?? defaults.sort?.columnId,
    read('direction') ?? defaults.sort?.direction,
    defaults.allowedSortColumns,
  );
  const filters = normalizeFilters(source, defaults.filters, defaults.allowedFilterKeys);

  return { page, pageSize, search, sort, filters };
}

export function serializeAdminTableQuery(state: AdminTableQueryState): URLSearchParams {
  const params = new URLSearchParams();
  params.set('page', String(Math.max(1, Math.trunc(state.page))));
  params.set('take', String(Math.max(1, Math.trunc(state.pageSize))));
  if (state.search) params.set('q', state.search);
  if (state.sort) {
    params.set('sort', state.sort.columnId);
    params.set('direction', state.sort.direction);
  }
  for (const key of Object.keys(state.filters).sort()) {
    const value = state.filters[key];
    if (value) params.set(`filter.${key}`, value);
  }
  return params;
}

export function updateAdminTableQuery(
  state: AdminTableQueryState,
  patch: Partial<Omit<AdminTableQueryState, 'filters'>> & { filters?: Readonly<Record<string, string | null | undefined>> },
): AdminTableQueryState {
  const nextFilters = patch.filters
    ? Object.fromEntries(
      Object.entries(patch.filters)
        .filter((entry): entry is [string, string] => typeof entry[1] === 'string' && entry[1].trim().length > 0)
        .map(([key, value]) => [key, value.trim()]),
    )
    : state.filters;
  const next = {
    ...state,
    ...patch,
    search: patch.search === undefined ? state.search : normalizeSearch(patch.search),
    filters: nextFilters,
  };
  const queryChanged =
    patch.search !== undefined
    || patch.sort !== undefined
    || patch.filters !== undefined
    || patch.pageSize !== undefined;

  return {
    ...next,
    page: queryChanged && patch.page === undefined ? 1 : Math.max(1, Math.trunc(next.page)),
    pageSize: Math.max(1, Math.trunc(next.pageSize)),
  };
}

export function nextAdminSort(current: AdminTableSort | null, columnId: string): AdminTableSort | null {
  if (!current || current.columnId !== columnId) return { columnId, direction: 'asc' };
  if (current.direction === 'asc') return { columnId, direction: 'desc' };
  return null;
}

function createReader(source: URLSearchParams | Readonly<Record<string, string | string[] | undefined>>) {
  return (key: string) => {
    if (source instanceof URLSearchParams) return source.get(key) ?? undefined;
    const value = source[key];
    return Array.isArray(value) ? value[0] : value;
  };
}

function normalizePositiveInteger(value: string | number | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : Math.max(1, Math.trunc(fallback));
}

function normalizePageSize(value: string | number | undefined, allowed: readonly number[], fallback: number) {
  const parsed = normalizePositiveInteger(value, fallback);
  return allowed.includes(parsed) ? parsed : fallback;
}

function normalizeSearch(value: string) {
  return value.trim().replace(/\s+/g, ' ').slice(0, 200);
}

function normalizeSort(columnId: string | undefined, direction: string | undefined, allowedColumns?: readonly string[]): AdminTableSort | null {
  if (!columnId || (allowedColumns && !allowedColumns.includes(columnId))) return null;
  if (direction !== 'asc' && direction !== 'desc') return null;
  return { columnId, direction };
}

function normalizeFilters(
  source: URLSearchParams | Readonly<Record<string, string | string[] | undefined>>,
  defaults: Readonly<Record<string, string>> | undefined,
  allowedKeys: readonly string[] | undefined,
) {
  const filters: Record<string, string> = { ...(defaults ?? {}) };
  const entries = source instanceof URLSearchParams ? [...source.entries()] : Object.entries(source).flatMap(([key, value]) => {
    if (Array.isArray(value)) return value.map((item) => [key, item] as const);
    return value === undefined ? [] : [[key, value] as const];
  });
  for (const [rawKey, rawValue] of entries) {
    if (!rawKey.startsWith('filter.')) continue;
    const key = rawKey.slice('filter.'.length);
    if (!key || (allowedKeys && !allowedKeys.includes(key))) continue;
    const value = String(rawValue).trim().slice(0, 200);
    if (value) filters[key] = value;
    else delete filters[key];
  }
  return Object.freeze(filters);
}
