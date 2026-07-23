import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import type { GameProviderQueryDto } from './dto/game-provider-query.dto';

const ATTENTION_STATUSES = ['MAINTENANCE', 'DEGRADED'] as const;

@Injectable()
export class GameProviderQueryService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: GameProviderQueryDto) {
    const page = Math.max(1, Number(query.page ?? 1));
    const pageSize = Math.min(Math.max(Number(query.take ?? 25), 1), 100);
    const searchWhere = this.searchWhere(query.search);
    const where = this.filteredWhere(query, searchWhere);

    const [items, total, summaryTotal, active, attention, games] = await this.prisma.$transaction([
      this.prisma.gameProvider.findMany({
        where,
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          _count: {
            select: {
              endpoints: true,
              credentials: true,
              games: true,
              sessions: true,
              transfers: true,
              webhookLogs: true,
            },
          },
        },
      }),
      this.prisma.gameProvider.count({ where }),
      this.prisma.gameProvider.count({ where: searchWhere }),
      this.prisma.gameProvider.count({ where: { ...searchWhere, status: 'ACTIVE' } }),
      this.prisma.gameProvider.count({ where: { ...searchWhere, status: { in: [...ATTENTION_STATUSES] } } }),
      this.prisma.game.count({ where: { provider: searchWhere } }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    return {
      items,
      total,
      page: Math.min(page, totalPages),
      pageSize,
      totalPages,
      summary: { total: summaryTotal, active, attention, games },
    };
  }

  private searchWhere(searchValue?: string): Prisma.GameProviderWhereInput {
    const search = searchValue?.trim();
    if (!search) return {};
    return {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ],
    };
  }

  private filteredWhere(query: GameProviderQueryDto, searchWhere: Prisma.GameProviderWhereInput): Prisma.GameProviderWhereInput {
    const where: Prisma.GameProviderWhereInput = { ...searchWhere };
    if (query.status) where.status = query.status as Prisma.EnumGameProviderStatusFilter;
    if (query.health === 'ATTENTION') where.status = { in: [...ATTENTION_STATUSES] };
    if (query.health === 'NORMAL') where.status = { notIn: [...ATTENTION_STATUSES] };
    return where;
  }
}
