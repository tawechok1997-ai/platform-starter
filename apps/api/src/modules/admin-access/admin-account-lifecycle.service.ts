import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AdminStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

const PROTECTED_ROLE_CODES = new Set(['owner', 'super_admin']);
const ALLOWED_STATUSES = new Set<AdminStatus>(['ACTIVE', 'SUSPENDED', 'LOCKED']);

@Injectable()
export class AdminAccountLifecycleService {
  constructor(private readonly prisma: PrismaService) {}

  async changeStatus(actorAdminId: string, targetAdminId: string, statusInput: string, reasonInput: string) {
    const status = String(statusInput ?? '').trim().toUpperCase() as AdminStatus;
    const reason = String(reasonInput ?? '').trim();

    if (!ALLOWED_STATUSES.has(status)) throw new BadRequestException('Unsupported admin account status');
    if (reason.length < 5) throw new BadRequestException('A reason of at least 5 characters is required');
    if (actorAdminId === targetAdminId) throw new ForbiddenException('You cannot change your own account status');

    const target = await this.prisma.adminUser.findUnique({
      where: { id: targetAdminId },
      include: { roles: { include: { role: true } } },
    });

    if (!target) throw new NotFoundException('Admin user not found');
    if (target.roles.some((item) => PROTECTED_ROLE_CODES.has(item.role.code))) {
      throw new ForbiddenException('Protected owner accounts cannot be changed through the standard status endpoint');
    }
    if (target.status === status) return { success: true, changed: false, status: target.status, revokedSessions: 0 };

    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.adminUser.update({
        where: { id: targetAdminId },
        data: { status },
        select: { id: true, username: true, email: true, status: true },
      });

      const revoked = await tx.authSession.updateMany({
        where: { adminUserId: targetAdminId, type: 'ADMIN', revokedAt: null },
        data: { revokedAt: new Date() },
      });

      await tx.adminAuditLog.create({
        data: {
          adminUserId: actorAdminId,
          action: 'CHANGE_ADMIN_STATUS',
          module: 'admin-access',
          targetId: targetAdminId,
          oldData: { status: target.status } as Prisma.InputJsonObject,
          newData: {
            status,
            reason,
            revokedSessions: revoked.count,
            username: target.username,
            email: target.email,
          } as Prisma.InputJsonObject,
        },
      });

      return { updated, revokedSessions: revoked.count };
    });

    return {
      success: true,
      changed: true,
      status: result.updated.status,
      revokedSessions: result.revokedSessions,
      admin: result.updated,
    };
  }
}
