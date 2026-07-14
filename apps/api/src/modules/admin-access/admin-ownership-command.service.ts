import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DomainError } from '../../common/domain/domain-error';
import { PrismaService } from '../../database/prisma.service';
import { AdminAccessService } from './admin-access.service';
import { AdminOwnershipPolicy } from './domain/admin-ownership.policy';

const SUPER_PERMISSION = '*';
const PROTECTED_ROLE_CODES = new Set(['owner', 'super_admin']);

@Injectable()
export class AdminOwnershipCommandService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly adminAccess: AdminAccessService,
  ) {}

  async transferOwnership(
    actorAdminId: string,
    targetAdminId: string,
    twoFactorCode: string,
    reason: string,
    meta: { ipAddress?: string; userAgent?: string },
  ) {
    const [actor, target] = await Promise.all([
      this.prisma.adminUser.findUnique({
        where: { id: actorAdminId },
        include: {
          roles: {
            include: {
              role: {
                include: {
                  permissions: { include: { permission: true } },
                },
              },
            },
          },
        },
      }),
      this.prisma.adminUser.findUnique({
        where: { id: targetAdminId },
        select: { id: true, status: true },
      }),
    ]);

    if (!actor) throw new ForbiddenException('Acting admin account not found');
    if (!target) throw new NotFoundException('Target admin account not found');

    const actorIsOwner = actor.roles.some(
      (assignment) =>
        PROTECTED_ROLE_CODES.has(assignment.role.code) ||
        assignment.role.permissions.some(
          (permission) => permission.permission.code === SUPER_PERMISSION,
        ),
    );

    try {
      AdminOwnershipPolicy.assertCanTransfer({
        actorIsOwner,
        actorId: actorAdminId,
        targetId: targetAdminId,
        targetActive: target.status === 'ACTIVE',
      });
    } catch (error) {
      if (error instanceof DomainError && error.message.includes('Only an owner')) {
        throw new ForbiddenException(error.message);
      }
      if (error instanceof DomainError) throw new BadRequestException(error.message);
      throw error;
    }

    return this.adminAccess.transferOwnership(
      actorAdminId,
      targetAdminId,
      twoFactorCode,
      reason,
      meta,
    );
  }
}
