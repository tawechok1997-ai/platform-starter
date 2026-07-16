import { BadRequestException } from '@nestjs/common';

type SortDirection = 'asc' | 'desc';

type QueryFieldOptions = {
  fieldName?: string;
};

export function normalizeOptionalText(
  value: unknown,
  maxLength: number,
  options: QueryFieldOptions = {},
): string | undefined {
  const normalized = String(value ?? '').trim();
  if (!normalized) return undefined;
  if (normalized.length > Math.max(maxLength, 0)) {
    throw new BadRequestException(`${options.fieldName ?? 'query'} exceeds the maximum allowed length`);
  }
  return normalized;
}

export function parseOptionalEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
  options: { allValue?: string; fieldName?: string } = {},
): T | undefined {
  const normalized = normalizeOptionalText(
    value,
    80,
    options.fieldName ? { fieldName: options.fieldName } : {},
  );
  if (!normalized || normalized === options.allValue) return undefined;
  if (!allowed.includes(normalized as T)) {
    throw new BadRequestException(`Invalid ${options.fieldName ?? 'filter'} value`);
  }
  return normalized as T;
}

export function parsePagination(
  pageInput: unknown,
  takeInput: unknown,
  options: { defaultTake?: number; maxTake?: number } = {},
): { page: number; take: number } {
  const defaultTake = options.defaultTake ?? 50;
  const maxTake = options.maxTake ?? 100;
  const page = Math.max(Number(pageInput ?? 1) || 1, 1);
  const take = Math.min(Math.max(Number(takeInput ?? defaultTake) || defaultTake, 1), maxTake);
  return { page, take };
}

export function parseSort<TField extends string>(
  fieldInput: unknown,
  directionInput: unknown,
  allowedFields: readonly TField[],
  defaults: { field: TField; direction: SortDirection },
): { field: TField; direction: SortDirection } {
  const field = normalizeOptionalText(fieldInput, 80, { fieldName: 'sortBy' });
  const direction = normalizeOptionalText(directionInput, 8, { fieldName: 'sortDirection' })?.toLowerCase();

  if (field && !allowedFields.includes(field as TField)) {
    throw new BadRequestException('Invalid sortBy value');
  }
  if (direction && direction !== 'asc' && direction !== 'desc') {
    throw new BadRequestException('Invalid sortDirection value');
  }

  return {
    field: field ? (field as TField) : defaults.field,
    direction: direction ? (direction as SortDirection) : defaults.direction,
  };
}
