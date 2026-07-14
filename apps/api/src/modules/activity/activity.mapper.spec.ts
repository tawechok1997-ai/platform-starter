import { mapAdminActivity } from './activity.mapper';

describe('mapAdminActivity', () => {
  it('preserves audit metadata and normalizes a missing admin identity', () => {
    const createdAt = new Date('2026-07-14T00:00:00.000Z');
    const result = mapAdminActivity({
      id: 'audit-1',
      adminUserId: null,
      action: 'LOGIN_FAILED',
      module: 'auth',
      targetId: 'member-1',
      oldData: null,
      newData: { reason: 'invalid_secret' },
      ipAddress: '127.0.0.1',
      userAgent: 'test-agent',
      createdAt,
    });

    expect(result).toEqual({
      id: 'audit-1',
      adminUserId: null,
      action: 'LOGIN_FAILED',
      module: 'auth',
      targetId: 'member-1',
      oldData: null,
      newData: { reason: 'invalid_secret' },
      ipAddress: '127.0.0.1',
      userAgent: 'test-agent',
      createdAt,
      adminUser: null,
    });
  });
});
