import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class WalletLedgerDetailService {
  constructor(private readonly prisma: PrismaService) {}

  async detail(id: string) {
    const item = await this.prisma.walletLedger.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, username: true, phone: true, email: true, status: true } },
        wallet: { select: { id: true, currency: true, balance: true, lockedBalance: true, status: true } },
      },
    });

    if (!item) throw new NotFoundException('Wallet ledger not found');

    const [gameTransfer, deposit, withdrawal, riskAlerts, auditLogs] = await Promise.all([
      item.referenceId && item.referenceType?.includes('GAME')
        ? this.prisma.gameTransfer.findFirst({
            where: { id: item.referenceId },
            include: {
              provider: { select: { id: true, name: true, code: true } },
              session: { select: { id: true, providerSessionId: true, game: { select: { name: true, providerGameCode: true } } } },
            },
          })
        : null,
      item.referenceId && item.referenceType?.includes('DEPOSIT')
        ? this.prisma.topUpRequest.findFirst({ where: { id: item.referenceId } })
        : null,
      item.referenceId && item.referenceType?.includes('WITHDRAW')
        ? this.prisma.withdrawalRequest.findFirst({ where: { id: item.referenceId } })
        : null,
      this.prisma.riskAlert.findMany({
        where: {
          OR: [{ refId: item.id }, ...(item.referenceId ? [{ refId: item.referenceId }] : [])],
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      this.prisma.adminAuditLog.findMany({
        where: { OR: [{ targetId: item.id }, ...(item.referenceId ? [{ targetId: item.referenceId }] : [])] },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    return {
      item,
      related: { gameTransfer, deposit, withdrawal, riskAlerts, auditLogs },
    };
  }
}
