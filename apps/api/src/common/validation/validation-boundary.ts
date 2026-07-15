import { DomainError } from '../errors/domain-error';

type ValidationLayer = 'dto' | 'business' | 'persistence';

const CODE_BY_LAYER: Record<ValidationLayer, string> = {
  dto: 'VALIDATION_DTO_INVALID',
  business: 'VALIDATION_BUSINESS_RULE',
  persistence: 'VALIDATION_PERSISTENCE_CONSTRAINT',
};

type ValidationFailureOptions = {
  layer: ValidationLayer;
  message: string;
  field?: string;
  constraint?: string;
  cause?: unknown;
};

export function validationFailure(options: ValidationFailureOptions): DomainError {
  return new DomainError({
    code: CODE_BY_LAYER[options.layer],
    category: options.layer === 'persistence' ? 'conflict' : 'validation',
    message: options.message,
    details: {
      layer: options.layer,
      ...(options.field ? { field: options.field } : {}),
      ...(options.constraint ? { constraint: options.constraint } : {}),
    },
    cause: options.cause,
  });
}

export function assertBusinessRule(
  condition: unknown,
  message: string,
  details: Omit<ValidationFailureOptions, 'layer' | 'message'> = {},
): asserts condition {
  if (!condition) {
    throw validationFailure({ layer: 'business', message, ...details });
  }
}
