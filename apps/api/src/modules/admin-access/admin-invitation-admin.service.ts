import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as argon2 from 'argon2';
import { randomBytes } from 'crypto';
import { buildAdminAuditData } from '../../common/audit/admin-audit.builder';
import { PrismaService } from '../../database/prisma.service';
import {
  evaluateRoleGrant,
  normalizeRoleSelection,
  type AdminRolePolicyRole,
} from './admin-role-policy';
import { ADMIN_ROLE_TEMPLATE_CODE_SET } from './admin-role-templates';

const PROTECTED_ROLE_CODES = new Set(['owner', 'super_admin']);
const ADMIN_INVITE_TARGET_PREFIX = 'ADMIN_INVITE:';
const MAX_ASSIGNED_ROLES = 8;

type CreateInvitationOptions = {
  primaryRoleId?: string;
  department?: string;
};

@Injectable()
export class AdminInvitationAdminService {
  constructor(private readonly prisma: PrismaService) {}

  async listAssignableRoles(actorAdminId: string) {
    const [actor, roles] = await Promise.all([
      this.findAdminWithPermissions(actorAdminId),
      this.prisma.role.findMany({
        include: { permissions: { include: { permission: true } } },
        orderBy: [{ level: 'asc' }, { code: 'asc' }],
      }),
    ]);
    if (!actor) throw new ForbiddenException('Acting admin account not found');

    const actorRoles = actor.roles.map((item) => this.toPolicyRole(item.role));
    const items = roles
      .filter((role) => !PROTECTED_ROLE_CODES.has(role.code))
      .filter((role) => evaluateRoleGrant(actorRoles, [this.toPolicyRole(role)]).allowed)
      .map((role) => ({
        id: role.id,
        code: role.code,
        name: role.name,
        level: role.level,
        template: ADMIN_ROLE_TEMPLATE_CODE_SET.has(role.code),
        positionLabel: role.name,
        hasWildcard: role.permissions.some((item) => item.permission.code === '*'),
      }));

    return { items, maxAssignedRoles: MAX_ASSIGNED_ROLES };
  }

  async create(
    actorAdminId: string,
    emailInput: string,
    roleIdOrIds: string | string[],
    expiresInHours = 24,
    options: CreateInvitationOptions = {},
  ) {
    const email = String(emailInput ?? '').trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new BadRequestException('A valid email is required');

    const roleIds = this.normalizeRoleIds(Array.isArray(roleIdOrIds) ? roleIdOrIds : [roleIdOrIds]);
    const [actor, roles, existing] = await Promise.all([
      this.findAdminWithPermissions(actorAdminId),
      this.prisma.role.findMany({
        where: { id: { in: roleIds } },
        include: { permissions: { include: { permission: true } } },
        orderBy: [{ level: 'asc' }, { code: 'asc' }],
      }),
      this.prisma.adminUser.findUnique({ where: { email } }),
    ]);
    if (!actor) throw new ForbiddenException('Acting admin account not found');
    if (roles.length !== roleIds.length) {
      const foundIds = new Set(roles.map((role) => role.id));
      throw new NotFoundException(`Role not found: ${roleIds.filter((roleId) => !foundIds.has(roleId)).join(', ')}`);
    }
    if (existing) throw new ConflictException('An admin account with this email already exists');

    const selection = this.resolveSelection(roles.map((role) => this.toPolicyRole(role)), options.primaryRoleId);
    const evaluation = evaluateRoleGrant(
      actor.roles.map((item) => this.toPolicyRole(item.role)),
      selection.roles,
    );
    if (!evaluation.allowed) throw new ForbiddenException(evaluation.reason ?? 'Selected roles cannot be granted');

    const department = this.normalizeDepartment(options.department);
    const safeHours = Math.min(Math.max(Number(expiresInHours) || 24, 1), 168);
    const expiresAt = new Date(Date.now() + safeHours * 60 * 60 * 1000);
    const rawToken = randomBytes(48).toString('base64url');
    const tokenHash = await argon2.hash(rawToken);
    const placeholderUsername = `invite_${randomBytes(10).toString('hex')}`;
    const unusablePasswordHash = await argon2.hash(randomBytes(48).toString('base64url'));

    const created = await this.prisma.$transaction(async (tx) => {
      const admin = await tx.adminUser.create({
        data: {
          username: placeholderUsername,
          email,
          passwordHash: unusablePasswordHash,
          status: 'LOCKED',
          position: selection.primaryRole.code,
          department,
          roles: { create: selection.roles.map((role) => ({ roleId: role.id })) },
        },
        select: { id: true, email: true, status: true, createdAt: true, position: true, department: true },
      });
      await tx.verificationToken.create({
        data: {
          type: 'PASSWORD_RESET',
          target: `${ADMIN_INVITE_TARGET_PREFIX}${admin.id}:${email}`,
          tokenHash,
          expiresAt,
        },
      });
      await tx.adminAuditLog.create({
        data: buildAdminAuditData({
          adminUserId: actorAdminId,
          action: 'CREATE_ADMIN_INVITATION',
          module: 'admin-access',
          targetId: admin.id,
          newData: {
            email,
            roleIds: selection.roles.map((role) => role.id),
            roleCodes: selection.roles.map((role) => role.code),
            primaryRoleId: selection.primaryRole.id,
            primaryRoleCode: selection.primaryRole.code,
            department,
            createdByManagerAdminId: actorAdminId,
            expiresAt: expiresAt.toISOString(),
          } as Prisma.InputJsonObject,
        }),
      });
      return admin;
    });

    return {
      invitation: {
        adminUserId: created.id,
        email: created.email,
        status: created.status,
        department: created.department,
        primaryRole: this.presentRole(selection.primaryRole),
        roles: selection.roles.map((role) => this.presentRole(role)),
        permissionCodes: selection.permissionCodes,
        expiresAt,
      },
      token: rawToken,
      tokenVisibleOnce: true,
    };
  }

  async list() {
    const tokens = await this.prisma.verificationToken.findMany({
      where: { type: 'PASSWORD_RESET', target: { startsWith: ADMIN_INVITE_TARGET_PREFIX } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const latestByAdmin = new Map<string, (typeof tokens)[number]>();
    for (const token of tokens) {
      const adminUserId = this.readAdminUserId(token.target);
      if (adminUserId && !latestByAdmin.has(adminUserId)) latestByAdmin.set(adminUserId, token);
    }

    const adminIds = [...latestByAdmin.keys()];
    const admins = adminIds.length === 0
      ? []
      : await this.prisma.adminUser.findMany({
          where: { id: { in: adminIds } },
          select: {
            id: true,
            email: true,
            username: true,
            status: true,
            position: true,
            department: true,
            createdAt: true,
            roles: { include: { role: true } },
          },
        });

    const now = new Date();
    return {
      items: admins.map((admin) => {
        const token = latestByAdmin.get(admin.id)!;
        const state = token.usedAt ? 'REVOKED_OR_USED' : token.expiresAt <= now ? 'EXPIRED' : 'ACTIVE';
        const orderedRoles = [...admin.roles].sort((left, right) => left.role.level - right.role.level || left.role.code.localeCompare(right.role.code));
        const primaryRole = orderedRoles.find((item) => item.role.code === admin.position)?.role ?? orderedRoles[0]?.role ?? null;
        return {
          adminUserId: admin.id,
          email: admin.email,
          username: admin.username,
          accountStatus: admin.status,
          invitationStatus: state,
          position: admin.position,
          department: admin.department,
          primaryRole: primaryRole ? { id: primaryRole.id, code: primaryRole.code, name: primaryRole.name, level: primaryRole.level } : null,
          createdAt: token.createdAt,
          expiresAt: token.expiresAt,
          usedAt: token.usedAt,
          protected: admin.roles.some((item) => PROTECTED_ROLE_CODES.has(item.role.code)),
          roles: orderedRoles.map((item) => ({ id: item.role.id, code: item.role.code, name: item.role.name, level: item.role.level })),
        };
      }),
    };
  }

  async revoke(actorAdminId: string, adminUserId: string) {
    const target = await this.prisma.adminUser.findUnique({
      where: { id: adminUserId },
      include: { roles: { include: { role: true } } },
    });
    if (!target) throw new NotFoundException('Invited admin account not found');
    if (target.status !== 'LOCKED') throw new BadRequestException('Only pending invited accounts can be revoked');
    if (target.roles.some((item) => PROTECTED_ROLE_CODES.has(item.role.code))) {
      throw new ForbiddenException('Protected owner account cannot be revoked');
    }

    const result = await this.prisma.verificationToken.updateMany({
      where: {
        type: 'PASSWORD_RESET',
        target: { startsWith: `${ADMIN_INVITE_TARGET_PREFIX}${adminUserId}:` },
        usedAt: null,
      },
      data: { usedAt: new Date() },
    });

    await this.audit(actorAdminId, 'REVOKE_ADMIN_INVITATION', adminUserId, { revokedTokens: result.count, email: target.email });
    return { success: true, revokedTokens: result.count };
  }

  async reissue(actorAdminId: string, adminUserId: string, expiresInHours = 24) {
    const [actor, target] = await Promise.all([
      this.findAdminWithPermissions(actorAdminId),
      this.prisma.adminUser.findUnique({
        where: { id: adminUserId },
        include: { roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } } },
      }),
    ]);
    if (!actor) throw new ForbiddenException('Acting admin account not found');
    if (!target) throw new NotFoundException('Invited admin account not found');
    if (target.status !== 'LOCKED') throw new BadRequestException('Only pending invited accounts can be reissued');
    if (target.roles.length === 0) throw new BadRequestException('Invited admin account has no role');
    if (target.roles.some((item) => PROTECTED_ROLE_CODES.has(item.role.code))) {
      throw new ForbiddenException('Protected owner invitation cannot be reissued here');
    }

    const evaluation = evaluateRoleGrant(
      actor.roles.map((item) => this.toPolicyRole(item.role)),
      target.roles.map((item) => this.toPolicyRole(item.role)),
    );
    if (!evaluation.allowed) throw new ForbiddenException(evaluation.reason ?? 'Invitation roles are above the acting admin');

    const safeHours = Math.min(Math.max(Number(expiresInHours) || 24, 1), 168);
    const expiresAt = new Date(Date.now() + safeHours * 60 * 60 * 1000);
    const rawToken = randomBytes(48).toString('base64url');
    const tokenHash = await argon2.hash(rawToken);

    await this.prisma.$transaction(async (tx) => {
      await tx.verificationToken.updateMany({
        where: {
          type: 'PASSWORD_RESET',
          target: { startsWith: `${ADMIN_INVITE_TARGET_PREFIX}${adminUserId}:` },
          usedAt: null,
        },
        data: { usedAt: new Date() },
      });
      await tx.verificationToken.create({
        data: {
          type: 'PASSWORD_RESET',
          target: `${ADMIN_INVITE_TARGET_PREFIX}${adminUserId}:${target.email.toLowerCase()}`,
          tokenHash,
          expiresAt,
        },
      });
      await tx.adminAuditLog.create({
        data: buildAdminAuditData({
          adminUserId: actorAdminId,
          action: 'REISSUE_ADMIN_INVITATION',
          module: 'admin-access',
          targetId: adminUserId,
          newData: { email: target.email, expiresAt: expiresAt.toISOString() },
        }),
      });
    });

    return { adminUserId, email: target.email, expiresAt, token: rawToken, tokenVisibleOnce: true };
  }

  private normalizeRoleIds(roleIdsInput: string[]) {
    const roleIds = Array.from(new Set((roleIdsInput ?? []).map((roleId) => String(roleId).trim()).filter(Boolean)));
    if (roleIds.length === 0) throw new BadRequestException('At least one role is required');
    if (roleIds.length > MAX_ASSIGNED_ROLES) {
      throw new BadRequestException(`An admin user can hold at most ${MAX_ASSIGNED_ROLES} roles`);
    }
    return roleIds;
  }

  private normalizeDepartment(departmentInput?: string) {
    const department = String(departmentInput ?? '').trim();
    if (!department) return null;
    if (department.length > 120) throw new BadRequestException('Department must not exceed 120 characters');
    return department;
  }

  private resolveSelection(roles: AdminRolePolicyRole[], primaryRoleIdInput?: string) {
    try {
      return normalizeRoleSelection(roles, primaryRoleIdInput);
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : 'Invalid role selection');
    }
  }

  private readAdminUserId(target: string) {
    if (!target.startsWith(ADMIN_INVITE_TARGET_PREFIX)) return null;
    return target.slice(ADMIN_INVITE_TARGET_PREFIX.length).split(':')[0] || null;
  }

  private findAdminWithPermissions(adminUserId: string) {
    return this.prisma.adminUser.findUnique({
      where: { id: adminUserId },
      include: { roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } } },
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

  private async audit(actorAdminId: string, action: string, targetId: string, newData: Prisma.InputJsonObject) {
    await this.prisma.adminAuditLog.create({
      data: buildAdminAuditData({ adminUserId: actorAdminId, action, module: 'admin-access', targetId, newData }),
    });
  }
}
