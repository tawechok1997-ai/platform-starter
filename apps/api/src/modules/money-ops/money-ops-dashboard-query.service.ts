import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class MoneyOpsDashboardQueryService {
  constructor(private readonly prisma: PrismaService) {}

  async getControlCenter() {
    const [
      walletCount,
      ledgers,
      failedTransfers,
      pendingTransfers,
      mismatchSnapshots,
      webhookFailed,
      duplicateWebhooks,
      openRiskAlerts,
      recentLedgers,
      recentTransfers,
      recentSnapshots,
      recentAlerts,
    ] = await Promise.all([
      this.prisma.wallet.count(),
      this.prisma.walletLedger.findMany({
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { id: true },
      }),
      this.prisma.gameTransfer.count({ where: { status: 'FAILED' } }),
      this.prisma.gameTransfer.count({ where: { status: 'PENDING' } }),
      this.prisma.providerWalletSnapshot.count({
        where: { status: { in: ['MISMATCH', 'UNKNOWN'] } },
      }),
      this.prisma.webhookLog.count({ where: { status: 'FAILED' } }),
      this.prisma.webhookLog.count({ where: { status: 'DUPLICATE' } }),
      this.prisma.riskAlert.count({
        where: { status: { in: ['OPEN', 'REVIEWING'] } },
      }),
      this.prisma.walletLedger.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          user: { select: { id: true, username: true, phone: true } },
        },
      }),
      this.prisma.gameTransfer.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          provider: { select: { name: true, code: true } },
          user: { select: { username: true, phone: true } },
        },
      }),
      this.prisma.providerWalletSnapshot.findMany({
        orderBy: { checkedAt: 'desc' },
        take: 10,
        include: {
          provider: { select: { name: true, code: true } },
          user: { select: { username: true, phone: true } },
        },
      }),
      this.prisma.riskAlert.findMany({
        where: { status: { in: ['OPEN', 'REVIEWING'] } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    const queues = {
      failedTransfers,
      pendingTransfers,
      mismatchSnapshots,
      webhookFailed,
      duplicateWebhooks,
      openRiskAlerts,
    };

    return {
      summary: {
        walletCount,
        ledgerActivity: ledgers.length,
        ...queues,
      },
      queues,
      recent: {
        ledgers: recentLedgers,
        transfers: recentTransfers,
        snapshots: recentSnapshots,
        alerts: recentAlerts,
      },
      realLedgerMutationEnabled: process.env.REAL_LEDGER_MUTATION_ENABLED === 'true',
    };
  }
}
