import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as argon2 from 'argon2';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../database/prisma.service';

const SUPER_PERMISSION = '*';
const PROTECTED_ROLE_CODES = new Set(['owner', 'super_admin']);
const ADMIN_INVITE_TARGET_PREFIX = 'ADMIN_INVITE:';

@Injectable()
export class AdminInvitationAdminService {
  constructor(private readonly prisma: PrismaService) {}

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
            createdAt: true,
            roles: { include: { role: true } },
          },
        });

    const now = new Date();
    return {
      items: admins.map((admin) => {
        const token = latestByAdmin.get(admin.id)!;
        const state = token.usedAt ? 'REVOKED_OR_USED' : token.expiresAt <= now ? 'EXPIRED' : 'ACTIVE';
        return {
          adminUserId: admin.id,
          email: admin.email,
          username: admin.username,
          accountStatus: admin.status,
          invitationStatus: state,
          createdAt: token.createdAt,
          expiresAt: token.expiresAt,
          usedAt: token.usedAt,
          protected: admin.roles.some((item) => PROTECTED_ROLE_CODES.has(item.role.code)),
          roles: admin.roles.map((item) => ({ id: item.role.id, code: item.role.code, name: item.role.name, level: item.role.level })),
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

    for (const item of target.roles) this.assertCanGrantRole(actor, item.role);

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
    });

    await this.audit(actorAdminId, 'REISSUE_ADMIN_INVITATION', adminUserId, {
      email: target.email,
      expiresAt: expiresAt.toISOString(),
    });

    return { adminUserId, email: target.email, expiresAt, token: rawToken, tokenVisibleOnce: true };
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

  private permissionCodes(admin: { roles: Array<{ role: { permissions: Array<{ permission: { code: string } }> } }> }) {
    return new Set(admin.roles.flatMap((item) => item.role.permissions.map((permission) => permission.permission.code)));
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
      throw new ForbiddenException('Only a protected owner-level admin can manage this invitation');
    }
    if (!actorHasWildcard) {
      const missing = role.permissions.map((item) => item.permission.code).filter((permission) => !actorPermissions.has(permission));
      if (missing.length > 0) throw new ForbiddenException('Cannot manage an invitation with permissions above the acting admin');
      const actorBestLevel = Math.min(...actor.roles.map((item) => item.role.level));
      if (role.level < actorBestLevel) throw new ForbiddenException('Cannot manage an invitation above the acting admin level');
    }
  }

  private async audit(actorAdminId: string, action: string, targetId: string, newData: Prisma.InputJsonObject) {
    await this.prisma.adminAuditLog.create({
      data: { adminUserId: actorAdminId, action, module: 'admin-access', targetId, newData },
    });
  }
}
