import { buildStructuredLogRecord, inferAction, inferModule } from './structured-log';

describe('structured log records', () => {
  it('adds the R-014 required request fields and redacts sensitive URLs', () => {
    const record = buildStructuredLogRecord({
      event: 'http_request',
      requestId: 'req-1',
      method: 'post',
      path: '/admin/auth/login?token=secret-token',
      statusCode: 201,
      durationMs: 42,
      ip: '127.0.0.1',
      userAgent: 'jest',
      actor: { id: 'admin-1', type: 'ADMIN' },
    });

    expect(record).toMatchObject({
      requestId: 'req-1',
      actorId: 'admin-1',
      actorType: 'ADMIN',
      module: 'admin.auth',
      action: 'POST admin.auth.login',
      durationMs: 42,
      result: 'success',
      path: '/admin/auth/login?token=[redacted]',
    });
  });

  it('classifies unauthenticated client errors without actor identity', () => {
    const record = buildStructuredLogRecord({ event: 'http_request', method: 'GET', path: '/member/topups', statusCode: 401 });
    expect(record).toMatchObject({ actorId: null, actorType: 'ANONYMOUS', module: 'member.topups', result: 'client_error' });
  });

  it('infers stable module and action names from routes', () => {
    expect(inferModule('/provider-webhooks/generic')).toBe('provider.webhooks');
    expect(inferAction('PATCH', '/admin/settings/cms-assets/123')).toBe('PATCH admin.settings.cms-assets');
  });
});
