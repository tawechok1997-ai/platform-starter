import { BadRequestException } from '@nestjs/common';
import { normalizeOptionalText, parseOptionalEnum, parseSort } from './query-filters';

describe('query filter boundaries', () => {
  it('keeps defaults only when sort input is absent', () => {
    expect(parseSort(undefined, undefined, ['createdAt', 'status'] as const, {
      field: 'createdAt',
      direction: 'desc',
    })).toEqual({ field: 'createdAt', direction: 'desc' });
  });

  it('accepts allowlisted sort input', () => {
    expect(parseSort('status', 'asc', ['createdAt', 'status'] as const, {
      field: 'createdAt',
      direction: 'desc',
    })).toEqual({ field: 'status', direction: 'asc' });
  });

  it.each([
    ['unknown', 'desc', 'Invalid sortBy value'],
    ['createdAt', 'sideways', 'Invalid sortDirection value'],
  ])('rejects arbitrary sort input', (field, direction, message) => {
    expect(() => parseSort(field, direction, ['createdAt', 'status'] as const, {
      field: 'createdAt',
      direction: 'desc',
    })).toThrow(new BadRequestException(message));
  });

  it('rejects arbitrary enum filters while preserving ALL semantics', () => {
    expect(parseOptionalEnum('ALL', ['OPEN', 'CLOSED'] as const, {
      allValue: 'ALL',
      fieldName: 'status',
    })).toBeUndefined();
    expect(() => parseOptionalEnum('DELETED', ['OPEN', 'CLOSED'] as const, {
      allValue: 'ALL',
      fieldName: 'status',
    })).toThrow(new BadRequestException('Invalid status value'));
  });

  it('rejects oversized text instead of truncating it', () => {
    expect(() => normalizeOptionalText('123456', 5, { fieldName: 'search' }))
      .toThrow(new BadRequestException('search exceeds the maximum allowed length'));
  });
});
