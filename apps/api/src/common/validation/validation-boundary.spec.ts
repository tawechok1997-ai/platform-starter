import { assertBusinessRule, validationFailure } from './validation-boundary';

describe('validation boundary', () => {
  it.each([
    ['dto', 'VALIDATION_DTO_INVALID', 'validation'],
    ['business', 'VALIDATION_BUSINESS_RULE', 'validation'],
    ['persistence', 'VALIDATION_PERSISTENCE_CONSTRAINT', 'conflict'],
  ] as const)('maps %s failures deterministically', (layer, code, category) => {
    const error = validationFailure({
      layer,
      message: 'invalid value',
      field: 'amount',
      constraint: 'positive',
    });

    expect(error.code).toBe(code);
    expect(error.category).toBe(category);
    expect(error.details).toEqual({ layer, field: 'amount', constraint: 'positive' });
  });

  it('throws a business validation error when a rule fails', () => {
    expect(() => assertBusinessRule(false, 'amount must be positive', {
      field: 'amount',
      constraint: 'positive',
    })).toThrow(expect.objectContaining({
      code: 'VALIDATION_BUSINESS_RULE',
      category: 'validation',
    }));
  });
});
