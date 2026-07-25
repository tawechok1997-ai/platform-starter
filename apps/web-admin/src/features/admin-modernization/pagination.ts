export type PaginationWindowOptions = {
  page: number;
  pageSize: number;
  totalItems: number;
  siblingCount?: number;
};

export type PaginationToken = number | 'ellipsis-start' | 'ellipsis-end';

export function getPageCount(totalItems: number, pageSize: number) {
  if (!Number.isFinite(totalItems) || totalItems <= 0) return 1;
  if (!Number.isFinite(pageSize) || pageSize <= 0) return 1;
  return Math.max(1, Math.ceil(totalItems / pageSize));
}

export function clampPage(page: number, pageCount: number) {
  const safeCount = Math.max(1, Math.trunc(pageCount || 1));
  const safePage = Number.isFinite(page) ? Math.trunc(page) : 1;
  return Math.min(safeCount, Math.max(1, safePage));
}

export function getVisibleItemRange(page: number, pageSize: number, totalItems: number) {
  if (totalItems <= 0) return { from: 0, to: 0 };
  const pageCount = getPageCount(totalItems, pageSize);
  const safePage = clampPage(page, pageCount);
  const from = (safePage - 1) * pageSize + 1;
  const to = Math.min(totalItems, safePage * pageSize);
  return { from, to };
}

export function getPaginationTokens({
  page,
  pageSize,
  totalItems,
  siblingCount = 1,
}: PaginationWindowOptions): PaginationToken[] {
  const pageCount = getPageCount(totalItems, pageSize);
  const current = clampPage(page, pageCount);
  const siblings = Math.max(0, Math.trunc(siblingCount));

  if (pageCount <= 7 + siblings * 2) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  const left = Math.max(2, current - siblings);
  const right = Math.min(pageCount - 1, current + siblings);
  const tokens: PaginationToken[] = [1];

  if (left > 2) tokens.push('ellipsis-start');
  for (let value = left; value <= right; value += 1) tokens.push(value);
  if (right < pageCount - 1) tokens.push('ellipsis-end');

  tokens.push(pageCount);
  return tokens;
}
