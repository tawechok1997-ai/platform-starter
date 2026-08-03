import { Injectable } from '@nestjs/common';
import { buildAdminAuditData } from '../../common/audit/admin-audit.builder';
import { PrismaService } from '../../database/prisma.service';

export type AdminPrivilegeChange =
  | 'ASSIGN_ROLE'
  | 'REMOVE_ROLE'
  | 'SYNC_ROLES'
  | 'REVOKE_DELEGATION'
  | 'SET_TEAM_MEMBER'
  | 'REMOVE_TEAM_MEMBER'
  | 'SET_REPORTING_LINE'
  | 'SET_PERMISSION_OVERRIDE'
  | 'DELETE_PERMISSION_OVERRIDE'
  | 'UPDATE_ACCESS_PROFILE'
  | 'TRANSFER_OWNERSHIP_OUT'
  | 'TRANSFER_OWNERSHIP_IN';

@Injectable()
export class AdminAccessSessionService {
  constructor(private readonly prisma: PrismaService) {}

  async revokeAfterPrivilegeChange(
    actorAdminId: string,
    targetAdminId: string,
    change: AdminPrivilegeChange,
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
