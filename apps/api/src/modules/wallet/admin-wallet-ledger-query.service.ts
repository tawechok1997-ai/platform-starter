import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AdminWalletLedgerQueryService {
  constructor(private readonly prisma: PrismaService) {}

  async getLedger(id: string) {
    const item = await this.prisma.walletLedger.findUnique({
      where: { id },
      include: {
        wallet: { select: { id: true, currency: true, status: true, balance: true, lockedBalance: true } },
        user: { select: { id: true, username: true, phone: true, email: true } },
      },
    });

    const relatedTransfer = item?.referenceType?.includes('GAME') && item.referenceId
      ? await this.prisma.gameTransfer.findUnique({
          where: { id: item.referenceId },
          include: {
            provider: { select: { id: true, name: true, code: true } },
            session: { select: { id: true, providerSessionId: true } },
          },
        }).catch(() => null)
      : null;

    const auditLogs = item
      ? await this.prisma.adminAuditLog.findMany({
          where: {
            OR: [
              { targetId: item.id },
              item.referenceId ? { targetId: item.referenceId } : { targetId: item.id },
            ],
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        })
      : [];

    return { item, relatedTransfer, auditLogs };
  }
}
