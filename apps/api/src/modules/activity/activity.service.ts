import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ActivityService {
  constructor(private readonly prisma: PrismaService) {}

  async getAdminActivity(query: ActivityQuery = {}) {
    const safeLimit = Math.min(Math.max(Number(query.limit) || 100, 1), 200);
    const where: any = {};
    if (query.module) where.module = query.module;
    if (query.action) where.action = query.action;
    if (query.adminUserId) where.adminUserId = query.adminUserId;

    const items = await this.prisma.adminAuditLog.findMany({
      where,
      include: { adminUser: { select: { id: true, username: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: safeLimit,
    });

    return { items: items.map((item) => ({ id: item.id, adminUserId: item.adminUserId, action: item.action, module: item.module, targetId: item.targetId, oldData: item.oldData, newData: item.newData, ipAddress: item.ipAddress, userAgent: item.userAgent, createdAt: item.createdAt, adminUser: item.adminUser })), generatedAt: new Date().toISOString() };
  }
}

type ActivityQuery = { module?: string; action?: string; adminUserId?: string; limit?: string };
