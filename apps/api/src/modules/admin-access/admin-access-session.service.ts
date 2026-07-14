import { Injectable } from '@nestjs/common';
import { buildAdminAuditData } from '../../common/audit/admin-audit-data';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AdminAccessSessionService {
  constructor(private readonly prisma: PrismaService) {}

  async revokeAfterPrivilegeChange(
    actorAdminId: string,
    targetAdminId: string,
    change: 'ASSIGN_ROLE' | 'REMOVE_ROLE' | 'REVOKE_DELEGATION' | 'TRANSFER_OWNERSHIP_OUT' | 'TRANSFER_OWNERSHIP_IN',
  ) {
    const revokedAt = new Date();
    const result = await this.prisma.authSession.updateMany({
      where: {
        adminUserId: targetAdminId,
        type: 'ADMIN',
        revokedAt: null,
      },
      data: { revokedAt },
    });

    await this.prisma.adminAuditLog.create({
      data: buildAdminAuditData({
        adminUserId: actorAdminId,
        action: 'REVOKE_ADMIN_SESSIONS_AFTER_PRIVILEGE_CHANGE',
        module: 'admin-access',
        targetId: targetAdminId,
        newData: {
          change,
          revokedSessions: result.count,
          revokedAt: revokedAt.toISOString(),
        },
      }),
    });

    return { revokedSessions: result.count, revokedAt };
  }
}
