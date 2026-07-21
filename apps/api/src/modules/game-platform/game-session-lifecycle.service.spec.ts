import { UnauthorizedException } from '@nestjs/common';
import { GameSessionLifecycleService } from './game-session-lifecycle.service';

function session(overrides: Record<string, unknown> = {}) {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    userId: '22222222-2222-2222-2222-222222222222',
    status: 'LAUNCHED',
    launchTokenHash: 'hash',
    launchTokenExpiresAt: new Date(Date.now() + 60_000),
    launchTokenRevokedAt: null,
    lastHeartbeatAt: null,
    endedAt: null,
    closedReason: null,
    ...overrides,
  };
}

describe('GameSessionLifecycleService', () => {
  const prisma = {
    $queryRaw: jest.fn(),
    $executeRaw: jest.fn(),
  };
  const tokens = {
    issue: jest.fn(),
    verify: jest.fn(),
  };
  const service = new GameSessionLifecycleService(prisma as never, tokens as never);

  beforeEach(() => jest.clearAllMocks());

  it('issues and stores only a token hash', async () => {
    prisma.$queryRaw.mockResolvedValueOnce([session({ launchTokenHash: null, launchTokenExpiresAt: null })]);
    prisma.$executeRaw.mockResolvedValueOnce(1);
    tokens.issue.mockReturnValue({
      token: 'plain-token',
      tokenHash: 'stored-hash',
      expiresAt: new Date('2030-01-01T00:00:00.000Z'),
    });

    await expect(service.issueForMember(session().id, session().userId)).resolves.toEqual({
      sessionId: session().id,
      token: 'plain-token',
      expiresAt: '2030-01-01T00:00:00.000Z',
    });
    expect(prisma.$executeRaw).toHaveBeenCalledTimes(1);
  });

  it('verifies the token before accepting a heartbeat', async () => {
    prisma.$queryRaw
      .mockResolvedValueOnce([session()])
      .mockResolvedValueOnce([{ lastHeartbeatAt: new Date('2030-01-01T00:00:00.000Z') }]);
    tokens.verify.mockReturnValue(true);

    const result = await service.heartbeat(session().id, session().userId, 'plain-token');

    expect(tokens.verify).toHaveBeenCalledWith(
      'plain-token',
      'hash',
      expect.any(Date),
      null,
    );
    expect(result.status).toBe('ACTIVE');
  });

  it('rejects heartbeat before a token is issued', async () => {
    prisma.$queryRaw.mockResolvedValueOnce([
      session({ launchTokenHash: null, launchTokenExpiresAt: null }),
    ]);

    await expect(service.heartbeat(session().id, session().userId, 'token'))
      .rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('closes and revokes a session idempotently', async () => {
    prisma.$queryRaw.mockResolvedValueOnce([session()]);
    prisma.$executeRaw.mockResolvedValueOnce(1);

    await expect(service.close(session().id, session().userId, 'user exit')).resolves.toEqual({
      sessionId: session().id,
      status: 'ENDED',
      reason: 'user exit',
    });
  });

  it('expires stale sessions in one database operation', async () => {
    prisma.$executeRaw.mockResolvedValueOnce(3);
    const now = new Date('2030-01-01T00:00:00.000Z');

    await expect(service.expireStale(now)).resolves.toEqual({
      expired: 3,
      checkedAt: now.toISOString(),
    });
  });
});
