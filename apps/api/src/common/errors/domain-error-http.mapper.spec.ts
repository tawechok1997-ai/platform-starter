import { HttpStatus } from '@nestjs/common';
import { DomainError, DomainErrorCategory } from './domain-error';
import { mapDomainErrorToHttp } from './domain-error-http.mapper';

const CASES: Array<[DomainErrorCategory, number]> = [
  ['validation', HttpStatus.BAD_REQUEST],
  ['not_found', HttpStatus.NOT_FOUND],
  ['conflict', HttpStatus.CONFLICT],
  ['forbidden', HttpStatus.FORBIDDEN],
  ['unauthorized', HttpStatus.UNAUTHORIZED],
  ['rate_limited', HttpStatus.TOO_MANY_REQUESTS],
  ['unavailable', HttpStatus.SERVICE_UNAVAILABLE],
  ['internal', HttpStatus.INTERNAL_SERVER_ERROR],
];

describe('mapDomainErrorToHttp', () => {
  it.each(CASES)('maps %s to HTTP %s', (category, status) => {
    const error = new DomainError({
      code: 'TEST_ERROR',
      category,
      message: 'test message',
      details: { field: 'value' },
    });

    expect(mapDomainErrorToHttp(error)).toEqual({
      status,
      code: 'TEST_ERROR',
      message: 'test message',
      details: { field: 'value' },
    });
  });

  it('omits details when none are supplied', () => {
    const error = new DomainError({
      code: 'TEST_ERROR',
      category: 'conflict',
      message: 'test message',
    });

    expect(mapDomainErrorToHttp(error)).toEqual({
      status: HttpStatus.CONFLICT,
      code: 'TEST_ERROR',
      message: 'test message',
    });
  });
});
