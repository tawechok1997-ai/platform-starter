import type { ApiErrorCode } from './error-codes';
import { resolveErrorMessageKey, type ErrorMessageKey } from './error-message-catalog';

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
  messageKey?: ErrorMessageKey | `errors.${string}`;
  details?: Record<string, unknown>;
  cause?: unknown;
};

export class DomainError extends Error {
  readonly code: ApiErrorCode | string;
  readonly category: DomainErrorCategory;
  readonly messageKey: ErrorMessageKey | `errors.${string}`;
  readonly details?: Record<string, unknown>;

  constructor(options: DomainErrorOptions) {
    super(options.message, { cause: options.cause });
    this.name = 'DomainError';
    this.code = options.code;
    this.category = options.category;
    this.messageKey = options.messageKey ?? resolveErrorMessageKey(options.code);
    this.details = options.details;
  }
}

export function isDomainError(value: unknown): value is DomainError {
  return value instanceof DomainError;
}
