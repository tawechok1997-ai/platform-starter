import { useMemo, useState } from 'react';

export type AdminListPayload<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type AdminListContractOptions = {
  initialPageSize?: number;
  allowedPageSizes?: readonly number[];
};

export function normalizeAdminListPayload<T>(
  payload: unknown,
  fallbackPage = 1,
  fallbackPageSize = 25,
): AdminListPayload<T> {
  const source = payload && typeof payload === 'object' ? payload as Record<string, unknown> : {};
  const items = Array.isArray(source.items) ? source.items as T[] : [];
  const pageSize = positiveInteger(source.pageSize) ?? positiveInteger(source.take) ?? fallbackPageSize;
  const total = positiveInteger(source.total) ?? items.length;
  const page = positiveInteger(source.page) ?? fallbackPage;
  const totalPages = positiveInteger(source.totalPages) ?? Math.max(1, Math.ceil(total / Math.max(1, pageSize)));
  return {
    items,
    total,
    page: Math.min(Math.max(1, page), totalPages),
    pageSize,
    totalPages,
  };
}

export function paginateAdminItems<T>(items: readonly T[], page: number, pageSize: number) {
  const safePageSize = Math.max(1, pageSize);
  const totalPages = Math.max(1, Math.ceil(items.length / safePageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * safePageSize;
  return {
    items: items.slice(start, start + safePageSize),
    page: safePage,
    pageSize: safePageSize,
    total: items.length,
    totalPages,
  };
}

export function buildAdminListQuery(params: Record<string, string | number | boolean | null | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '' || value === false) continue;
    search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : '';
}

export function useAdminListContract(options: AdminListContractOptions = {}) {
  const allowedPageSizes = useMemo(() => options.allowedPageSizes ?? [10, 25, 50, 100] as const, [options.allowedPageSizes]);
  const initialPageSize = allowedPageSizes.includes(options.initialPageSize ?? 25)
    ? options.initialPageSize ?? 25
    : allowedPageSizes[0] ?? 25;
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(initialPageSize);

  function resetPage() { setPage(1); }
  function setPageSize(value: number) {
    const next = allowedPageSizes.includes(value) ? value : initialPageSize;
    setPageSizeState(next);
    setPage(1);
  }

  return { page, pageSize, allowedPageSizes, setPage, setPageSize, resetPage };
}

function positiveInteger(value: unknown) {
  const number = typeof value === 'number' ? value : Number(value);
  return Number.isInteger(number) && number > 0 ? number : undefined;
}
