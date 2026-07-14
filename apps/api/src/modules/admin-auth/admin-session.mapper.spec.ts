import { mapAdminSession } from './admin-session.mapper';

describe('mapAdminSession', () => {
  const base = {
    id: 'session-1',
    deviceId: 'device-1',
    ipAddress: '127.0.0.1',
    userAgent: 'test-agent',
    createdAt: new Date('2026-07-14T00:00:00.000Z'),
    expiresAt: new Date('2026-07-15T00:00:00.000Z'),
    revokedAt: null,
  };

  it('marks the current unexpired session active', () => {
    expect(mapAdminSession(base, 'session-1', new Date('2026-07-14T12:00:00.000Z'))).toMatchObject({
      current: true,
      active: true,
    });
  });

  it('marks revoked or expired sessions inactive', () => {
    expect(
      mapAdminSession(
        { ...base, revokedAt: new Date('2026-07-14T10:00:00.000Z') },
        'other-session',
        new Date('2026-07-14T12:00:00.000Z'),
      ),
    ).toMatchObject({ current: false, active: false });

    expect(mapAdminSession(base, 'other-session', new Date('2026-07-16T00:00:00.000Z'))).toMatchObject({
      current: false,
      active: false,
    });
  });
});
