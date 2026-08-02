import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { buildAdminAuditData } from '../../common/audit/admin-audit.builder';
import { PrismaService } from '../../database/prisma.service';
import {
  evaluateRoleGrant,
  normalizeRoleSelection,
  type AdminRolePolicyRole,
} from './admin-role-policy';

const PROTECTED_ROLE_CODES = new Set(['owner', 'super_admin']);
const MAX_ASSIGNED_ROLES = 8;

@Injectable()
export class AdminRoleAssignmentService {
  constructor(private readonly prisma: PrismaService) {}

  async preview(actorAdminId: string, roleIdsInput: string[], primaryRoleIdInput?: string | null) {
    const roleIds = this.normalizeRoleIds(roleIdsInput);
    const [actor, roles] = await Promise.all([
      this.findAdminWithPermissions(actorAdminId),
      this.findRolesWithPermissions(roleIds),
    ]);
    if (!actor) throw new ForbiddenException('Acting admin account not found');
    this.assertAllRolesFound(roleIds, roles);

    const policyRoles = roles.map((role) => this.toPolicyRole(role));
    const selection = this.resolveSelection(policyRoles, primaryRoleIdInput);
    const evaluation = evaluateRoleGrant(
      actor.roles.map((item) => this.toPolicyRole(item.role)),
      selection.roles,
    );

    return {
      grantable: evaluation.allowed,
      reason: evaluation.reason,
      missingPermissionCodes: evaluation.missingPermissionCodes,
      protectedRoleCodes: evaluation.protectedRoleCodes,
      primaryRole: this.presentRole(selection.primaryRole),
      roles: selection.roles.map((role) => this.presentRole(role)),
      permissionCodes: selection.permissionCodes,
      modules: selection.modules,
      permissionCount: selection.permissionCodes.length,
    };
  }

  async syncRoles(
    actorAdminId: string,
    targetAdminId: string,
    roleIdsInput: string[],
    primaryRoleIdInput: string | null | undefined,
    reasonInput: string,
  ) {
    const reason = String(reasonInput ?? '').trim();
    if (reason.length < 5) throw new BadRequestException('A reason of at least 5 characters is required');

    const roleIds = this.normalizeRoleIds(roleIdsInput);
    const [actor, target, roles] = await Promise.all([
      this.findAdminWithPermissions(actorAdminId),
      this.prisma.adminUser.findUnique({
        where: { id: targetAdminId },
        include: {
          roles: {
            include: {
              role: { include: { permissions: { include: { permission: true } } } },
            },
          },
        },
      }),
      this.findRolesWithPermissions(roleIds),
    ]);
    if (!actor) throw new ForbiddenException('Acting admin account not found');
    if (!target) throw new NotFoundException('Admin user not found');
    if (target.roles.some((item) => PROTECTED_ROLE_CODES.has(item.role.code))) {
      throw new ForbiddenException('Protected owner account cannot be modified through role synchronization');
    }
    this.assertAllRolesFound(roleIds, roles);

    const policyRoles = roles.map((role) => this.toPolicyRole(role));
    const selection = this.resolveSelection(policyRoles, primaryRoleIdInput);
    const evaluation = evaluateRoleGrant(
      actor.roles.map((item) => this.toPolicyRole(item.role)),
      selection.roles,
    );
    if (!evaluation.allowed) throw new ForbiddenException(evaluation.reason ?? 'Selected roles cannot be granted');

    const currentRoles = target.roles.map((item) => this.toPolicyRole(item.role));
    if (actorAdminId === targetAdminId) {
      const currentPermissionCodes = new Set(currentRoles.flatMap((role) => role.permissions.map((permission) => permission.code)));
      const nextPermissionCodes = new Set(selection.permissionCodes);
      if (currentPermissionCodes.has('admin.access.manage') && !nextPermissionCodes.has('admin.access.manage')) {
        throw new ForbiddenException('Cannot remove your own critical access management permission');
      }
    }

    const currentRoleIds = new Set(target.roles.map((item) => item.roleId));
    const nextRoleIds = new Set(selection.roles.map((role) => role.id));
    const addedRoleIds = selection.roles.map((role) => role.id).filter((roleId) => !currentRoleIds.has(roleId));
    const removedRoleIds = target.roles.map((item) => item.roleId).filter((roleId) => !nextRoleIds.has(roleId));

    await this.prisma.$transaction(async (tx) => {
      if (removedRoleIds.length > 0) {
        await tx.adminUserRole.deleteMany({
          where: { adminUserId: targetAdminId, roleId: { in: removedRoleIds } },
        });
      }
      if (addedRoleIds.length > 0) {
        await tx.adminUserRole.createMany({
          data: addedRoleIds.map((roleId) => ({ adminUserId: targetAdminId, roleId })),
          skipDuplicates: true,
        });
      }
      await tx.adminUser.update({
        where: { id: targetAdminId },
        data: { position: selection.primaryRole.code },
      });
      await tx.adminAuditLog.create({
        data: buildAdminAuditData({
          adminUserId: actorAdminId,
          action: 'SYNC_ADMIN_ROLES',
          module: 'admin-access',
          targetId: targetAdminId,
          oldData: {
            roleIds: target.roles.map((item) => item.roleId),
            roleCodes: currentRoles.map((role) => role.code),
            primaryRoleCode: target.position,
          } as Prisma.InputJsonObject,
          newData: {
            roleIds: selection.roles.map((role) => role.id),
            roleCodes: selection.roles.map((role) => role.code),
            primaryRoleId: selection.primaryRole.id,
            primaryRoleCode: selection.primaryRole.code,
            addedRoleIds,
            removedRoleIds,
            reason,
          } as Prisma.InputJsonObject,
        }),
      });
    });

    return {
      success: true,
      adminUserId: targetAdminId,
      addedRoleIds,
      removedRoleIds,
      primaryRole: this.presentRole(selection.primaryRole),
      roles: selection.roles.map((role) => this.presentRole(role)),
      permissionCodes: selection.permissionCodes,
      modules: selection.modules,
    };
  }

  private normalizeRoleIds(roleIdsInput: string[]) {
    const roleIds = Array.from(new Set((roleIdsInput ?? []).map((roleId) => String(roleId).trim()).filter(Boolean)));
    if (roleIds.length === 0) throw new BadRequestException('At least one role is required');
    if (roleIds.length > MAX_ASSIGNED_ROLES) {
      throw new BadRequestException(`An admin user can hold at most ${MAX_ASSIGNED_ROLES} roles`);
    }
    return roleIds;
  }

  private resolveSelection(roles: AdminRolePolicyRole[], primaryRoleIdInput?: string | null) {
    try {
      return normalizeRoleSelection(roles, primaryRoleIdInput);
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : 'Invalid role selection');
    }
  }

  private assertAllRolesFound(roleIds: string[], roles: Array<{ id: string }>) {
    if (roles.length === roleIds.length) return;
    const foundIds = new Set(roles.map((role) => role.id));
    const missingRoleIds = roleIds.filter((roleId) => !foundIds.has(roleId));
    throw new NotFoundException(`Role not found: ${missingRoleIds.join(', ')}`);
  }

  private findRolesWithPermissions(roleIds: string[]) {
    return this.prisma.role.findMany({
      where: { id: { in: roleIds } },
      include: { permissions: { include: { permission: true } } },
      orderBy: [{ level: 'asc' }, { code: 'asc' }],
    });
  }

  private findAdminWithPermissions(adminUserId: string) {
    return this.prisma.adminUser.findUnique({
      where: { id: adminUserId },
      include: {
        roles: {
          include: {
            role: { include: { permissions: { include: { permission: true } } } },
          },
        },
      },
    });
  }

  private toPolicyRole(role: {
    id: string;
    code: string;
    name: string;
    level: number;
    permissions: Array<{ permission: { code: string; module: string; name: string } }>;
  }): AdminRolePolicyRole {
    return {
      id: role.id,
      code: role.code,
      name: role.name,
      level: role.level,
      permissions: role.permissions.map((item) => ({
        code: item.permission.code,
        module: item.permission.module,
        name: item.permission.name,
      })),
    };
  }

  private presentRole(role: AdminRolePolicyRole) {
    return { id: role.id, code: role.code, name: role.name, level: role.level };
  }
}
