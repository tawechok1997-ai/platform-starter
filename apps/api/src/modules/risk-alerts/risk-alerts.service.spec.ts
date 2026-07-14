import { BadRequestException } from '@nestjs/common';
import type { PrismaService } from '../../database/prisma.service';
import { RiskAlertsService } from './risk-alerts.service';

function createPrismaMock() {
  return {
    riskAlert: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      findUnique: jest.fn(),
      update: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    riskAlertNote: { create: jest.fn() },
    adminUser: { findMany: jest.fn().mockResolvedValue([]), findFirst: jest.fn() },
    topUpRequest: {
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
    withdrawalRequest: {
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
    memberBankAccount: { findMany: jest.fn().mockResolvedValue([]) },
    wallet: { findMany: jest.fn().mockResolvedValue([]) },
    adminAuditLog: { create: jest.fn().mockResolvedValue(null) },
  };
}

function createService() {
  const prisma = createPrismaMock();
  return {
    prisma,
    service: new RiskAlertsService(prisma as unknown as PrismaService),
  };
}

const actor = {
  id: '22222222-2222-4222-8222-222222222222',
  sessionId: 'risk-alerts-test-session',
  permissions: ['risk.view', 'risk.assign', 'risk.note', 'risk.resolve'],
};

describe('RiskAlertsService', () => {
  it('filters by member id and duplicate-slip type', async () => {
    const { prisma, service } = createService();
    const memberId = '11111111-1111-4111-8111-111111111111';

    await service.list({ memberId, type: 'DUPLICATE_DEPOSIT_SLIP', page: '1', take: '20' });

    expect(prisma.riskAlert.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ memberId, type: 'DUPLICATE_DEPOSIT_SLIP' }),
      skip: 0,
      take: 20,
    }));
  });

  it('rejects malformed filters instead of silently ignoring them', async () => {
    const { service } = createService();

    await expect(service.list({ memberId: 'not-a-uuid' })).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.list({ type: 'NOT_A_REAL_TYPE' })).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.list({ status: 'UNKNOWN' })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects invalid and reversed date ranges', async () => {
    const { service } = createService();

    await expect(service.list({ createdFrom: 'bad-date' })).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.list({ createdFrom: '2026-07-12', createdTo: '2026-07-11' })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('scans staged withdrawal statuses and completed deposits', async () => {
    const { prisma, service } = createService();

    await service.scan(actor);

    expect(prisma.topUpRequest.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ status: 'COMPLETED' }),
    }));
    expect(prisma.withdrawalRequest.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        status: expect.objectContaining({
          in: expect.arrayContaining(['PENDING_REVIEW', 'APPROVED_FOR_PAYMENT', 'PAYMENT_PROOF_UPLOADED']),
        }),
      }),
    }));
  });

  it('rejects assignment to an inactive or unknown admin', async () => {
    const { prisma, service } = createService();
    prisma.riskAlert.findUnique.mockResolvedValue({ id: 'alert-1', assignedToAdminId: null });
    prisma.adminUser.findFirst.mockResolvedValue(null);

    await expect(service.assign('alert-1', 'admin-1', actor)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects empty investigation notes', async () => {
    const { service } = createService();

    await expect(service.addNote('alert-1', '   ', actor)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects status jumps that bypass investigation', async () => {
    const { prisma, service } = createService();
    prisma.riskAlert.findUnique.mockResolvedValue({ id: 'alert-1', status: 'OPEN' });

    await expect(service.updateStatus('alert-1', 'RESOLVED', actor)).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.riskAlert.update).not.toHaveBeenCalled();
  });

  it('returns a provider auto-close suggestion from typed metadata', async () => {
    const { prisma, service } = createService();
    prisma.riskAlert.findMany.mockResolvedValue([
      {
        id: 'risk-1',
        status: 'OPEN',
        type: 'WALLET_LEDGER_MISMATCH',
        refType: 'provider',
        refId: 'provider-1',
        metadata: { providerStatus: 'RESOLVED' },
      },
    ]);

    await expect(service.autoCloseSuggestions(10)).resolves.toEqual({
      items: [
        {
          id: 'risk-1',
          reason: 'related finance/provider record is terminal',
          status: 'OPEN',
          refType: 'provider',
          refId: 'provider-1',
        },
      ],
    });
  });
});