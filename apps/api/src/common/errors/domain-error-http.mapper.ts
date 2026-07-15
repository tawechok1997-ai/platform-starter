import { HttpStatus } from '@nestjs/common';
import { DomainError, DomainErrorCategory } from './domain-error';

const STATUS_BY_CATEGORY: Record<DomainErrorCategory, number> = {
  validation: HttpStatus.BAD_REQUEST,
  not_found: HttpStatus.NOT_FOUND,
  conflict: HttpStatus.CONFLICT,
  forbidden: HttpStatus.FORBIDDEN,
  unauthorized: HttpStatus.UNAUTHORIZED,
  rate_limited: HttpStatus.TOO_MANY_REQUESTS,
  unavailable: HttpStatus.SERVICE_UNAVAILABLE,
  internal: HttpStatus.INTERNAL_SERVER_ERROR,
};

type DomainErrorHttpPayload = {
  status: number;
  code: string;
  messageKey: string;
  message: string;
  details?: Record<string, unknown>;
};

export function mapDomainErrorToHttp(error: DomainError): DomainErrorHttpPayload {
  return {
    status: STATUS_BY_CATEGORY[error.category],
    code: error.code,
    messageKey: error.messageKey,
    message: error.message,
    ...(error.details ? { details: error.details } : {}),
  };
}
