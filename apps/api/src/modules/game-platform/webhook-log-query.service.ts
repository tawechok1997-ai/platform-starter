import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import type { WebhookLogQueryDto } from './dto/webhook-log-query.dto';

@Injectable()
export class WebhookLogQueryService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: WebhookLogQueryDto) {
    const page = Math.max(1, Number(query.page ?? 1));
    const pageSize = Math.min(Math.max(Number(query.take ?? 25), 1), 100);
    const where = this.buildWhere(query);

    const [items, total, processed, failed, duplicate] = await this.prisma.$transaction([
      this.prisma.webhookLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { provider: { select: { name: true, code: true } } },
      }),
      this.prisma.webhookLog.count({ where }),
      this.prisma.webhookLog.count({ where: { ...where, status: 'PROCESSED' } }),
      this.prisma.webhookLog.count({ where: { ...where, status: 'FAILED' } }),
      this.prisma.webhookLog.count({ where: { ...where, status: 'DUPLICATE' } }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    return {
      items,
      total,
      page: Math.min(page, totalPages),
      pageSize,
      totalPages,
      summary: { total, processed, failed, duplicate },
    };
  }

  private buildWhere(query: WebhookLogQueryDto): Prisma.WebhookLogWhereInput {
    const where: Prisma.WebhookLogWhereInput = {};
    if (query.status) where.status = query.status;
    const search = query.search?.trim();
    if (search) {
      where.OR = [
        { eventType: { contains: search, mode: 'insensitive' } },
        { idempotencyKey: { contains: search, mode: 'insensitive' } },
        { providerTransactionId: { contains: search, mode: 'insensitive' } },
        { provider: { is: { OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
        ] } } },
      ];
    }
    return where;
  }
}
