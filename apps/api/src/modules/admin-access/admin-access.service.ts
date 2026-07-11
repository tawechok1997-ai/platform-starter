import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as argon2 from 'argon2';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../database/prisma.service';

const SUPER_PERMISSION = '*';
const PROTECTED_ROLE_CODES = new Set(['owner', 'super_admin']);
const ADMIN_INVITE_TARGET_PREFIX = 'ADMIN_INVITE:';
const MAX_DELEGATION_HOURS = 168;
const NON_DELEGABLE_PERMISSIONS = new Set([
  SUPER_PERMISSION,
  'admin.create',
  'admin.access.manage',
  'admin.access.delegate',
  'roles.update',
  'wallet.adjust',
  'withdraw.approve',
  'withdraw.success',
  'settings.security.update',
  'security.antibot.override',
]);

const GROWTH_PERMISSIONS = [
  { code: 'promotions.claims.view', name: 'View promotion claims', module: 'promotions', description: 'ดูคำขอรับโปรโมชัน' },
  { code: 'promotions.claims.review', name: 'Review promotion claims', module: 'promotions', description: 'อนุมัติหรือปฏิเสธคำขอรับโปรโมชัน' },
  { code: 'bonus.ledger.view', name: 'View bonus ledger', module: 'bonus', description: 'ดู bonus ledger และ turnover' },
  { code: 'bonus.turnover.update', name: 'Update bonus turnover', module: 'bonus', description: 'อัปเดต turnover progress ของโบนัส' },
  { code: 'bonus.lifecycle.update', name: 'Update bonus lifecycle', module: 'bonus', description: 'release, expire หรือ revoke bonus ledger' },
  { code: 'affiliate.view', name: 'View affiliates', module: 'affiliate', description: 'ดูตัวแทนและ downline' },
  { code: 'affiliate.review', name: 'Review affiliates', module: 'affiliate', description: 'อนุมัติหรือปฏิเสธตัวแทน' },
  { code: 'commission.view', name: 'View commission ledger', module: 'commission', description: 'ดู commission ledger' },
  { code: 'commission.create', name: 'Create commission ledger', module: 'commission', description: 'สร้าง commission ledger แบบ manual review' },
  { code: 'commission.review', name: 'Review commission ledger', module: 'commission', description: 'อนุมัติหรือปฏิเสธ commission ledger' },
  { code: 'admin.access.delegate', name: 'Delegate limited admin access', module: 'admin-access', description: 'มอบสิทธิ์แอดมินแบบจำกัดและมีวันหมดอายุ' },
];

@Injectable()
export class AdminAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async overview() {
    await this.ensureGrowthPermissions();
    const [roles, permissions, adminUsers] = await Promise.all([
      this.prisma.role.findMany({
        include: { permissions: { include: { permission: true }, orderBy: { permission: { module: 'asc' } } }, adminUsers: true },
        orderBy: [{ level: 'asc' }, { code: 'asc' }],
      }),
      this.prisma.permission.findMany({ orderBy: [{ module: 'asc' }, { code: 'asc' }] }),
      this.prisma.adminUser.findMany({
        select: {
          id: true,
          username: true,
          email: true,
          status: true,
          twoFactorEnabled: true,
          lastLoginAt: true,
          createdAt: true,
          roles: { include: { role: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      summary: {
        roleCount: roles.length,
        permissionCount: permissions.length,
        adminUserCount: adminUsers.length,
        wildcardRoleCount: roles.filter((role) => role.permissions.some((item) => item.permission.code === SUPER_PERMISSION)).length,
      },
      roles: roles.map((role) => ({
        id: role.id,
        code: role.code,
        name: role.name,
        description: role.description,
        level: role.level,
        adminUserCount: role.adminUsers.length,
        permissionCount: role.permissions.length,
        hasWildcard: role.permissions.some((item) => item.permission.code === SUPER_PERMISSION),
        permissions: role.permissions.map((item) => ({
          id: item.permission.id,
          code: item.permission.code,
          name: item.permission.name,
          module: item.permission.module,
          description: item.permission.description,
        })),
      })),
      permissions: permissions.map((permission) => ({
        id: permission.id,
        code: permission.code,
        name: permission.name,
        module: permission.module,
        description: permission.description,
      })),
      adminUsers: adminUsers.map((user) => ({
        id: user.id,
        username: user.username,
        email: user.email,
        status: user.status,
        twoFactorEnabled: user.twoFactorEnabled,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        protected: user.roles.some((item) => PROTECTED_ROLE_CODES.has(item.role.code)),
        roles: user.roles.map((item) => ({ id: item.role.id, code: item.role.code, name: item.role.name, level: item.role.level })),
      })),
    };
  }

  async createInvitation(actorAdminId: string, emailInput: string, roleId: string, expiresInHours = 24) {
    const email = String(emailInput ?? '').trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new BadRequestException('A valid email is required');
    if (!roleId) throw new BadRequestException('Role is required');

    const [actor, role, existing] = await Promise.all([
      this.findAdminWithPermissions(actorAdminId),
      this.prisma.role.findUnique({ where: { id: roleId }, include: { permissions: { include: { permission: true } } } }),
      this.prisma.adminUser.findUnique({ where: { email } }),
    ]);
    if (!actor) throw new ForbiddenException('Acting admin account not found');
    if (!role) throw new NotFoundException('Role not found');
    if (existing) throw new ConflictException('An admin account with this email already exists');

    this.assertCanGrantRole(actor, role);

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
          roles: { create: { roleId } },
        },
        select: { id: true, email: true, status: true, createdAt: true },
      });
      await tx.verificationToken.create({
        data: {
          type: 'PASSWORD_RESET',
          target: `${ADMIN_INVITE_TARGET_PREFIX}${admin.id}:${email}`,
          tokenHash,
          expiresAt,
        },
      });
      return admin;
    });

    await this.audit(actorAdminId, 'CREATE_ADMIN_INVITATION', created.id, {
      email,
      roleId,
      roleCode: role.code,
      expiresAt: expiresAt.toISOString(),
    });

    return {
      invitation: {
        adminUserId: created.id,
        email: created.email,
        status: created.status,
        role: { id: role.id, code: role.code, name: role.name },
        expiresAt,
      },
      token: rawToken,
      tokenVisibleOnce: true,
    };
  }

  async assignRole(actorAdminId: string, targetAdminId: string, roleId: string) {
    const [actor, target, role] = await Promise.all([
      this.findAdminWithPermissions(actorAdminId),
      this.prisma.adminUser.findUnique({ where: { id: targetAdminId }, include: { roles: { include: { role: true } } } }),
      this.prisma.role.findUnique({ where: { id: roleId }, include: { permissions: { include: { permission: true } } } }),
    ]);
    if (!actor) throw new ForbiddenException('Acting admin account not found');
    if (!target) throw new NotFoundException('Admin user not found');
    if (!role) throw new NotFoundException('Role not found');

    const targetProtected = target.roles.some((item) => PROTECTED_ROLE_CODES.has(item.role.code));
    if (targetProtected) throw new ForbiddenException('Protected owner account cannot be modified through role assignment');
    this.assertCanGrantRole(actor, role);

    await this.prisma.adminUserRole.upsert({
      where: { adminUserId_roleId: { adminUserId: targetAdminId, roleId } },
      update: {},
      create: { adminUserId: targetAdminId, roleId },
    });

    await this.audit(actorAdminId, 'ASSIGN_ROLE', targetAdminId, { roleId, roleCode: role.code, target: target.username });
    return this.overview();
  }

  async removeRole(actorAdminId: string, targetAdminId: string, roleId: string) {
    const [actor, target] = await Promise.all([
      this.findAdminWithPermissions(actorAdminId),
      this.prisma.adminUser.findUnique({ where: { id: targetAdminId }, include: { roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } } } }),
    ]);
    if (!actor) throw new ForbiddenException('Acting admin account not found');
    if (!target) throw new NotFoundException('Admin user not found');

    const assignment = target.roles.find((item) => item.roleId === roleId);
    if (!assignment) throw new BadRequestException('Role is not assigned to this admin user');

    if (PROTECTED_ROLE_CODES.has(assignment.role.code) || assignment.role.permissions.some((item) => item.permission.code === SUPER_PERMISSION)) {
      throw new ForbiddenException('Protected owner role cannot be removed through this endpoint');
    }
    if (target.roles.some((item) => PROTECTED_ROLE_CODES.has(item.role.code))) {
      throw new ForbiddenException('Protected owner account cannot be modified');
    }

    const actorPermissions = this.permissionCodes(actor);
    const actorHasWildcard = actorPermissions.has(SUPER_PERMISSION);
    if (!actorHasWildcard) {
      const missing = assignment.role.permissions.map((item) => item.permission.code).filter((permission) => !actorPermissions.has(permission));
      if (missing.length > 0) throw new ForbiddenException('Cannot remove a role containing permissions above the acting admin');
    }

    const isSelf = actorAdminId === targetAdminId;
    const isLastRole = target.roles.length <= 1;
    const roleHasAccessManage = assignment.role.permissions.some((item) => item.permission.code === 'admin.access.manage');
    if (isSelf && (isLastRole || roleHasAccessManage)) throw new ForbiddenException('Cannot remove your own critical access role');

    await this.prisma.adminUserRole.delete({ where: { adminUserId_roleId: { adminUserId: targetAdminId, roleId } } });
    await this.audit(actorAdminId, 'REMOVE_ROLE', targetAdminId, { roleId, roleCode: assignment.role.code, target: target.username });
    return this.overview();
  }

  async listDelegations(actorAdminId: string) {
    await this.prisma.adminDelegation.updateMany({
      where: { status: 'ACTIVE', revokedAt: null, expiresAt: { lte: new Date() } },
      data: { status: 'EXPIRED' },
    });

    return this.prisma.adminDelegation.findMany({
      where: { OR: [{ grantorAdminId: actorAdminId }, { delegateAdminId: actorAdminId }] },
      include: {
        grantor: { select: { id: true, username: true, email: true } },
        delegate: { select: { id: true, username: true, email: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createDelegation(
    actorAdminId: string,
    delegateAdminId: string,
    permissionCodesInput: string[],
    expiresInHoursInput: number,
    reasonInput: string,
  ) {
    const [actor, target] = await Promise.all([
      this.findAdminWithPermissions(actorAdminId),
      this.prisma.adminUser.findUnique({ where: { id: delegateAdminId }, include: { roles: { include: { role: true } } } }),
    ]);
    if (!actor) throw new ForbiddenException('Acting admin account not found');
    if (!target) throw new NotFoundException('Delegate admin user not found');
    if (target.status !== 'ACTIVE') throw new BadRequestException('Delegate admin must be active');
    if (actorAdminId === delegateAdminId) throw new BadRequestException('An admin cannot delegate to themselves');
    if (target.roles.some((item) => PROTECTED_ROLE_CODES.has(item.role.code))) {
      throw new ForbiddenException('Protected owner accounts cannot receive delegated access');
    }

    const existingDelegation = await this.prisma.adminDelegation.findFirst({
      where: { delegateAdminId: actorAdminId, status: 'ACTIVE', revokedAt: null, expiresAt: { gt: new Date() } },
      select: { id: true },
    });
    if (existingDelegation) throw new ForbiddenException('Delegated admins cannot create further delegations');

    const actorPermissions = this.permissionCodes(actor);
    if (!actorPermissions.has(SUPER_PERMISSION) && !actorPermissions.has('admin.access.delegate')) {
      throw new ForbiddenException('Delegated access permission is required');
    }

    const permissionCodes = Array.from(new Set((permissionCodesInput ?? []).map((code) => String(code).trim()).filter(Boolean)));
    if (permissionCodes.length === 0 || permissionCodes.length > 40) throw new BadRequestException('One to forty permissions are required');
    if (permissionCodes.some((code) => NON_DELEGABLE_PERMISSIONS.has(code))) {
      throw new ForbiddenException('One or more requested permissions cannot be delegated');
    }
    if (!actorPermissions.has(SUPER_PERMISSION)) {
      const missing = permissionCodes.filter((code) => !actorPermissions.has(code));
      if (missing.length > 0) throw new ForbiddenException(`Cannot delegate permissions not held by the acting admin: ${missing.join(', ')}`);
    }

    const hours = Number(expiresInHoursInput);
    if (!Number.isFinite(hours) || hours < 1 || hours > MAX_DELEGATION_HOURS) {
      throw new BadRequestException(`Delegation expiry must be between 1 and ${MAX_DELEGATION_HOURS} hours`);
    }
    const reason = String(reasonInput ?? '').trim();
    if (reason.length < 5) throw new BadRequestException('A reason of at least 5 characters is required');
    const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);

    const delegation = await this.prisma.$transaction(async (tx) => {
      const created = await tx.adminDelegation.create({
        data: { grantorAdminId: actorAdminId, delegateAdminId, permissionCodes, expiresAt, reason },
        include: {
          grantor: { select: { id: true, username: true, email: true } },
          delegate: { select: { id: true, username: true, email: true, status: true } },
        },
      });
      await tx.adminAuditLog.create({
        data: {
          adminUserId: actorAdminId,
          action: 'CREATE_ADMIN_DELEGATION',
          module: 'admin-access',
          targetId: delegateAdminId,
          newData: { delegationId: created.id, permissionCodes, expiresAt: expiresAt.toISOString(), reason },
        },
      });
      return created;
    });

    return { success: true, delegation };
  }

  async revokeDelegation(actorAdminId: string, delegationId: string, reasonInput: string) {
    const [actor, delegation] = await Promise.all([
      this.findAdminWithPermissions(actorAdminId),
      this.prisma.adminDelegation.findUnique({ where: { id: delegationId }, include: { grantor: { include: { roles: { include: { role: true } } } }, delegate: true } }),
    ]);
    if (!actor) throw new ForbiddenException('Acting admin account not found');
    if (!delegation) throw new NotFoundException('Delegation not found');
    const actorPermissions = this.permissionCodes(actor);
    const actorProtected = actor.roles.some((item) => PROTECTED_ROLE_CODES.has(item.role.code));
    if (delegation.grantorAdminId !== actorAdminId && (!actorProtected || !actorPermissions.has(SUPER_PERMISSION))) {
      throw new ForbiddenException('Only the grantor or an owner-level admin can revoke this delegation');
    }
    if (delegation.status !== 'ACTIVE' || delegation.revokedAt) return { success: true, changed: false, delegation };
    const reason = String(reasonInput ?? '').trim();
    if (reason.length < 5) throw new BadRequestException('A reason of at least 5 characters is required');

    const revoked = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.adminDelegation.update({
        where: { id: delegationId },
        data: { status: 'REVOKED', revokedAt: new Date(), revokedByAdminId: actorAdminId },
      });
      await tx.adminAuditLog.create({
        data: {
          adminUserId: actorAdminId,
          action: 'REVOKE_ADMIN_DELEGATION',
          module: 'admin-access',
          targetId: delegation.delegateAdminId,
          oldData: { delegationId, status: delegation.status, permissionCodes: delegation.permissionCodes },
          newData: { status: 'REVOKED', reason },
        },
      });
      return updated;
    });
    return { success: true, changed: true, delegation: revoked };
  }

  private assertCanGrantRole(
    actor: { roles: Array<{ role: { code: string; level: number; permissions: Array<{ permission: { code: string } }> } }> },
    role: { code: string; level: number; permissions: Array<{ permission: { code: string } }> },
  ) {
    const actorPermissions = this.permissionCodes(actor);
    const actorHasWildcard = actorPermissions.has(SUPER_PERMISSION);
    const actorProtected = actor.roles.some((item) => PROTECTED_ROLE_CODES.has(item.role.code));
    const assigningProtectedRole = PROTECTED_ROLE_CODES.has(role.code) || role.permissions.some((item) => item.permission.code === SUPER_PERMISSION);

    if (assigningProtectedRole && (!actorHasWildcard || !actorProtected)) {
      throw new ForbiddenException('Only a protected owner-level admin can assign this role');
    }
    if (!actorHasWildcard) {
      const missing = role.permissions.map((item) => item.permission.code).filter((permission) => !actorPermissions.has(permission));
      if (missing.length > 0) throw new ForbiddenException('Cannot grant permissions that the acting admin does not hold');
      const actorBestLevel = Math.min(...actor.roles.map((item) => item.role.level));
      if (role.level < actorBestLevel) throw new ForbiddenException('Cannot assign a role above the acting admin level');
    }
  }

  private findAdminWithPermissions(adminUserId: string) {
    return this.prisma.adminUser.findUnique({
      where: { id: adminUserId },
      include: { roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } } },
    });
  }

  private permissionCodes(admin: { roles: Array<{ role: { permissions: Array<{ permission: { code: string } }> } }> }) {
    return new Set(admin.roles.flatMap((item) => item.role.permissions.map((permission) => permission.permission.code)));
  }

  private async ensureGrowthPermissions() {
    await Promise.all(GROWTH_PERMISSIONS.map((permission) => this.prisma.permission.upsert({ where: { code: permission.code }, update: { name: permission.name, module: permission.module, description: permission.description }, create: permission })));
  }

  private async audit(actorAdminId: string, action: string, targetId: string, newData: Prisma.InputJsonObject) {
    await this.prisma.adminAuditLog.create({
      data: { adminUserId: actorAdminId, action, module: 'admin-access', targetId, newData },
    });
  }
}
