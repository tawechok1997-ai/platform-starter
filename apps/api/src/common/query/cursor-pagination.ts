export type CursorPageInput = {
  cursor?: string | null;
  limit?: string | number | null;
};

export type CursorPageOptions = {
  defaultLimit: number;
  maxLimit: number;
  minLimit?: number;
};

export type CursorQueryArgs = {
  take: number;
  cursor?: { id: string };
  skip?: number;
};

export type CursorPage<T extends { id: string }> = {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
  limit: number;
};

export function parseCursorPage(input: CursorPageInput, options: CursorPageOptions) {
  const minLimit = options.minLimit ?? 1;
  const parsedLimit = Number(input.limit ?? options.defaultLimit);
  const normalizedLimit = Number.isFinite(parsedLimit) ? Math.trunc(parsedLimit) : options.defaultLimit;
  const limit = Math.min(Math.max(normalizedLimit || options.defaultLimit, minLimit), options.maxLimit);
  const cursor = String(input.cursor ?? '').trim() || null;

  const query: CursorQueryArgs = {
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  };

  return { cursor, limit, query };
}

export function buildCursorPage<T extends { id: string }>(rows: T[], limit: number): CursorPage<T> {
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;

  return {
    items,
    nextCursor: hasMore ? items.at(-1)?.id ?? null : null,
    hasMore,
    limit,
  };
}
