import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { buildAdminAuditData } from '../../common/audit/admin-audit.builder';
import { PrismaService } from '../../database/prisma.service';

export type AdminSessionCommandMeta = {
  ipAddress?: string;
  userAgent?: string;
};

@Injectable()
export class AdminSessionCommandService {
  constructor(private readonly prisma: PrismaService) {}

  async signOut(sessionId: string, adminUserId: string, meta: AdminSessionCommandMeta = {}) {
    await this.prisma.$transaction(async (tx) => {
      await tx.authSession.updateMany({
        where: { id: sessionId, type: 'ADMIN', revokedAt: null },
        data: { revokedAt: new Date() },
      });
      await tx.adminAuditLog.create({
        data: buildAdminAuditData({
          adminUserId,
          module: 'auth',
          action: 'admin.logout',
          targetId: adminUserId,
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
        }),
      });
    });
    return { success: true };
  }

  async revokeSession(
    adminUserId: string,
    currentSessionId: string,
    sessionId: string,
    meta: AdminSessionCommandMeta = {},
  ) {
    const session = await this.prisma.authSession.findFirst({
      where: { id: sessionId, adminUserId, type: 'ADMIN' },
      select: { id: true },
    });
    if (!session) throw new NotFoundException('Session not found');

    const current = sessionId === currentSessionId;
    await this.prisma.$transaction(async (tx) => {
      await tx.authSession.updateMany({
        where: { id: sessionId, adminUserId, type: 'ADMIN', revokedAt: null },
        data: { revokedAt: new Date() },
      });
      await tx.adminAuditLog.create({
        data: buildAdminAuditData({
          adminUserId,
          module: 'auth',
          action: current ? 'admin.session.revoke.current' : 'admin.session.revoke',
          targetId: sessionId,
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
        }),
      });
    });
    return { success: true, current };
  }

  async revokeOtherSessions(
    adminUserId: string,
    currentSessionId: string,
    meta: AdminSessionCommandMeta = {},
  ) {
    return this.revokeMany(
      adminUserId,
      { adminUserId, type: 'ADMIN', id: { not: currentSessionId }, revokedAt: null },
      'admin.session.revoke_others',
      meta,
    );
  }

  async revokeAllSessions(adminUserId: string, meta: AdminSessionCommandMeta = {}) {
    return this.revokeMany(
      adminUserId,
      { adminUserId, type: 'ADMIN', revokedAt: null },
      'admin.session.revoke_all',
      meta,
    );
  }

  private async revokeMany(
    adminUserId: string,
    where: Prisma.AuthSessionWhereInput,
    action: string,
    meta: AdminSessionCommandMeta,
  ) {
    const revoked = await this.prisma.$transaction(async (tx) => {
      const result = await tx.authSession.updateMany({ where, data: { revokedAt: new Date() } });
      await tx.adminAuditLog.create({
        data: buildAdminAuditData({
          adminUserId,
          module: 'auth',
          action,
          targetId: adminUserId,
          newData: { revoked: result.count },
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
        }),
      });
      return result.count;
    });
    return { success: true, revoked };
  }
}
