import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { buildAdminAuditData } from '../../common/audit/admin-audit.builder';
import { DomainError } from '../../common/domain/domain-error';
import { lockAdminUserForUpdate } from '../../common/infrastructure/prisma-row-locks';
import { PrismaService } from '../../database/prisma.service';
import { AdminAuthService } from '../admin-auth/admin-auth.service';
import { AdminOwnershipPolicy } from './domain/admin-ownership.policy';

const SUPER_PERMISSION = '*';
const PROTECTED_ROLE_CODES = new Set(['owner', 'super_admin']);

@Injectable()
export class AdminOwnershipCommandService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly adminAuth: AdminAuthService,
  ) {}

  async transferOwnership(
    actorAdminId: string,
    targetAdminId: string,
    twoFactorCode: string,
    reasonInput: string,
    meta: { ipAddress?: string; userAgent?: string },
  ) {
    const reason = String(reasonInput ?? '').trim();
    if (reason.length < 5) {
      throw new BadRequestException('A reason of at least 5 characters is required');
    }

    await this.adminAuth.assertStepUp(actorAdminId, twoFactorCode, meta);

    return this.prisma.$transaction(async (tx) => {
      const lockOrder = [actorAdminId, targetAdminId].sort();
      for (const adminUserId of lockOrder) {
        const lockedId = await lockAdminUserForUpdate(tx, adminUserId);
        if (!lockedId) {
          if (adminUserId === actorAdminId) {
            throw new ForbiddenException('Acting admin account not found');
          }
          throw new NotFoundException('Target admin account not found');
        }
      }

      const [actor, target] = await Promise.all([
        tx.adminUser.findUnique({
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
        tx.adminUser.findUnique({
          where: { id: targetAdminId },
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

      if (!target.twoFactorEnabled) {
        throw new BadRequestException(
          'Target admin account must have 2FA enabled before ownership transfer',
        );
      }

      const targetAlreadyProtected = target.roles.some(
        (assignment) =>
          PROTECTED_ROLE_CODES.has(assignment.role.code) ||
          assignment.role.permissions.some(
            (permission) => permission.permission.code === SUPER_PERMISSION,
          ),
      );
      if (targetAlreadyProtected) {
        throw new ConflictException('Target admin already has protected access');
      }

      const ownershipAssignment = actor.roles.find(
        (assignment) =>
          PROTECTED_ROLE_CODES.has(assignment.role.code) ||
          assignment.role.permissions.some(
            (permission) => permission.permission.code === SUPER_PERMISSION,
          ),
      );
      if (!ownershipAssignment) {
        throw new ForbiddenException('No transferable owner role found');
      }

      await tx.adminUserRole.delete({
        where: {
          adminUserId_roleId: {
            adminUserId: actorAdminId,
            roleId: ownershipAssignment.role.id,
          },
        },
      });
      await tx.adminUserRole.create({
        data: {
          adminUserId: targetAdminId,
          roleId: ownershipAssignment.role.id,
        },
      });
      await tx.adminAuditLog.create({
        data: buildAdminAuditData({
          adminUserId: actorAdminId,
          action: 'TRANSFER_ADMIN_OWNERSHIP',
          module: 'admin-access',
          targetId: targetAdminId,
          oldData: {
            previousOwnerId: actorAdminId,
            roleId: ownershipAssignment.role.id,
            roleCode: ownershipAssignment.role.code,
          },
          newData: {
            newOwnerId: targetAdminId,
            stepUpVerified: true,
            reason,
          },
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
        }),
      });

      return {
        success: true,
        previousOwnerId: actorAdminId,
        newOwnerId: targetAdminId,
        transferredRole: {
          roleId: ownershipAssignment.role.id,
          roleCode: ownershipAssignment.role.code,
        },
      };
    });
  }
}
