import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { mapAdminActivity } from '../activity/activity.mapper';

export type AdminActivityQuery = {
  module?: string;
  action?: string;
  adminUserId?: string;
  limit?: string | number;
};

@Injectable()
export class AdminActivityQueryService {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: AdminActivityQuery = {}) {
    const safeLimit = Math.min(Math.max(Number(query.limit) || 100, 1), 200);
    const where: Prisma.AdminAuditLogWhereInput = {};
    if (query.module) where.module = query.module;
    if (query.action) where.action = query.action;
    if (query.adminUserId) where.adminUserId = query.adminUserId;

    const items = await this.prisma.adminAuditLog.findMany({
      where,
      include: { adminUser: { select: { id: true, username: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: safeLimit,
    });

    return {
      items: items.map(mapAdminActivity),
      generatedAt: new Date().toISOString(),
    };
  }
}
