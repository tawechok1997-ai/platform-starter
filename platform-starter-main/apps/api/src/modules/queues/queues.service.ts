import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class QueuesService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary() {
    const [topUps, withdrawals] = await Promise.all([
      this.prisma.topUpRequest.aggregate({ where: { status: 'PENDING' }, _count: { _all: true }, _sum: { amount: true } }),
      this.prisma.withdrawalRequest.aggregate({ where: { status: 'PENDING' }, _count: { _all: true }, _sum: { amount: true } }),
    ]);

    return {
      topUps: { count: topUps._count._all, amount: topUps._sum.amount?.toString() ?? '0' },
      withdrawals: { count: withdrawals._count._all, amount: withdrawals._sum.amount?.toString() ?? '0' },
      total: { count: topUps._count._all + withdrawals._count._all, amount: ((Number(topUps._sum.amount ?? 0) + Number(withdrawals._sum.amount ?? 0))).toFixed(2) },
      generatedAt: new Date().toISOString(),
    };
  }
}
