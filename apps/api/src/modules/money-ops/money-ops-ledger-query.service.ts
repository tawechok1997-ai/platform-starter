import { Injectable } from '@nestjs/common';
import { Prisma, WalletLedgerDirection } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import type { MoneyOpsLedgerQueryDto } from './dto/money-ops.dto';

@Injectable()
export class MoneyOpsLedgerQueryService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: MoneyOpsLedgerQueryDto) {
    const page = Math.max(1, Number(query.page ?? 1));
    const pageSize = Math.min(Math.max(Number(query.take ?? 25), 1), 100);
    const where = this.buildWhere(query);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.walletLedger.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          user: { select: { id: true, username: true, phone: true } },
          wallet: { select: { id: true, currency: true, balance: true, lockedBalance: true } },
        },
      }),
      this.prisma.walletLedger.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    return {
      items,
      total,
      page: Math.min(page, totalPages),
      pageSize,
      totalPages,
    };
  }

  private buildWhere(query: MoneyOpsLedgerQueryDto): Prisma.WalletLedgerWhereInput {
    const where: Prisma.WalletLedgerWhereInput = {};
    if (query.userId) where.userId = query.userId;
    if (query.referenceType) where.referenceType = query.referenceType;
    if (query.referenceId) where.referenceId = query.referenceId;
    if (query.direction) where.direction = query.direction as WalletLedgerDirection;
    if (query.type) where.type = query.type as never;

    if (query.dateFrom || query.dateTo) {
      where.createdAt = {
        ...(query.dateFrom ? { gte: new Date(`${query.dateFrom}T00:00:00.000Z`) } : {}),
        ...(query.dateTo ? { lte: new Date(`${query.dateTo}T23:59:59.999Z`) } : {}),
      };
    }

    const search = query.search?.trim();
    if (search) {
      where.OR = [
        { referenceType: { contains: search, mode: 'insensitive' } },
        { referenceId: { contains: search, mode: 'insensitive' } },
        { idempotencyKey: { contains: search, mode: 'insensitive' } },
        { user: { is: { OR: [
          { username: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search } },
        ] } } },
      ];
    }
    return where;
  }
}
