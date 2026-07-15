import type { ApiErrorCode } from './error-codes';

export type DomainErrorCategory =
  | 'validation'
  | 'not_found'
  | 'conflict'
  | 'forbidden'
  | 'unauthorized'
  | 'rate_limited'
  | 'unavailable'
  | 'internal';

export type DomainErrorOptions = {
  code: ApiErrorCode | string;
  category: DomainErrorCategory;
  message: string;
  details?: Record<string, unknown>;
  cause?: unknown;
};

export class DomainError extends Error {
  readonly code: ApiErrorCode | string;
  readonly category: DomainErrorCategory;
  readonly details?: Record<string, unknown>;

  constructor(options: DomainErrorOptions) {
    super(options.message, { cause: options.cause });
    this.name = 'DomainError';
    this.code = options.code;
    this.category = options.category;
    this.details = options.details;
  }
}

export function isDomainError(value: unknown): value is DomainError {
  return value instanceof DomainError;
}
