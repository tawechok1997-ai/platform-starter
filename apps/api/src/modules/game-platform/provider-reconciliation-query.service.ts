import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ProviderReconciliationQueryService {
  constructor(private readonly prisma: PrismaService) {}

  async listSnapshots() {
    const items = await this.prisma.providerWalletSnapshot.findMany({
      orderBy: { checkedAt: 'desc' },
      take: 100,
      include: {
        user: { select: { id: true, username: true, phone: true } },
        provider: { select: { id: true, name: true, code: true } },
      },
    });
    return {
      items,
      summary: {
        total: items.length,
        matched: items.filter((item) => item.status === 'MATCHED').length,
        mismatch: items.filter((item) => item.status === 'MISMATCH').length,
        unknown: items.filter((item) => item.status === 'UNKNOWN').length,
      },
    };
  }

  async getSnapshot(id: string) {
    const item = await this.prisma.providerWalletSnapshot.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, username: true, phone: true } },
        provider: { select: { id: true, name: true, code: true } },
      },
    });
    if (!item) throw new NotFoundException('Provider wallet snapshot not found');
    return item;
  }
}
