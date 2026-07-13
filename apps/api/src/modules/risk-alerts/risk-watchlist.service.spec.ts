import { ConflictException } from '@nestjs/common';
import { RiskWatchlistService } from './risk-watchlist.service';

describe('RiskWatchlistService', () => {
  const oldRiskSecret = process.env.RISK_MATCH_SECRET;

  beforeEach(() => {
    process.env.RISK_MATCH_SECRET = 'test-risk-secret-value-1234';
    jest.clearAllMocks();
  });

  afterAll(() => {
    process.env.RISK_MATCH_SECRET = oldRiskSecret;
  });

  function createService(overrides: Record<string, unknown> = {}) {
    const prisma: any = {
      $queryRaw: jest.fn(),
      $transaction: jest.fn(async (callback: any) => callback({
        $queryRaw: jest.fn(),
        adminAuditLog: { create: jest.fn().mockResolvedValue({}) },
      })),
      adminAuditLog: { create: jest.fn().mockResolvedValue({}) },
      ...overrides,
    };
    return { service: new RiskWatchlistService(prisma), prisma };
  }

  it('normalizes phone values before matching', async () => {
    const { service, prisma } = createService();
    prisma.$queryRaw.mockResolvedValue([]);

    await expect(service.match({ subjectType: 'PHONE', subjectValue: '+66 81-234-5678' })).resolves.toEqual({
      matched: false,
      blocked: false,
      items: [],
    });

    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
  });

  it('marks blacklist matches as blocked', async () => {
    const { service, prisma } = createService();
    prisma.$queryRaw.mockResolvedValue([
      {
        id: 'entry-1', subject_type: 'EMAIL', display_masked: 'ab***@example.com',
        list_type: 'BLACKLIST', reason_code: 'FRAUD_CONFIRMED', severity: 'HIGH',
        status: 'ACTIVE', version: 1,
      },
    ]);

    const result = await service.match({ subjectType: 'EMAIL', subjectValue: 'AB@example.com' });
    expect(result.matched).toBe(true);
    expect(result.blocked).toBe(true);
  });

  it('converts active duplicate database conflicts into a domain conflict', async () => {
    const error = Object.assign(new Error('duplicate'), { code: '23505' });
    const { service, prisma } = createService();
    prisma.$queryRaw.mockRejectedValue(error);

    await expect(service.create({
      subjectType: 'MEMBER', subjectValue: 'member-1', listType: 'WATCHLIST',
      reasonCode: 'MANUAL_REVIEW', severity: 'MEDIUM',
    }, { id: '00000000-0000-4000-8000-000000000001' })).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects stale release versions', async () => {
    const tx: any = {
      $queryRaw: jest.fn().mockResolvedValueOnce([
        { id: '00000000-0000-4000-8000-000000000010', status: 'ACTIVE', version: 2 },
      ]),
      adminAuditLog: { create: jest.fn() },
    };
    const prisma: any = {
      $queryRaw: jest.fn(),
      adminAuditLog: { create: jest.fn() },
      $transaction: jest.fn(async (callback: any) => callback(tx)),
    };
    const service = new RiskWatchlistService(prisma);

    await expect(service.release(
      '00000000-0000-4000-8000-000000000010',
      { reason: 'review completed', version: 1 },
      { id: '00000000-0000-4000-8000-000000000001' },
    )).rejects.toBeInstanceOf(ConflictException);
  });
});
