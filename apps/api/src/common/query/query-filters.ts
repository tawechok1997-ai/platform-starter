export type SortDirection = 'asc' | 'desc';

export function normalizeOptionalText(value: unknown, maxLength: number): string | undefined {
  const normalized = String(value ?? '').trim();
  if (!normalized) return undefined;
  return normalized.slice(0, Math.max(maxLength, 0));
}

export function parseOptionalEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
  options: { allValue?: string } = {},
): T | undefined {
  const normalized = normalizeOptionalText(value, 80);
  if (!normalized || normalized === options.allValue) return undefined;
  return allowed.includes(normalized as T) ? (normalized as T) : undefined;
}

export function parseSort<TField extends string>(
  fieldInput: unknown,
  directionInput: unknown,
  allowedFields: readonly TField[],
  defaults: { field: TField; direction: SortDirection },
): { field: TField; direction: SortDirection } {
  const field = normalizeOptionalText(fieldInput, 80);
  const direction = normalizeOptionalText(directionInput, 8)?.toLowerCase();
  return {
    field: field && allowedFields.includes(field as TField) ? (field as TField) : defaults.field,
    direction: direction === 'asc' || direction === 'desc' ? direction : defaults.direction,
  };
}
