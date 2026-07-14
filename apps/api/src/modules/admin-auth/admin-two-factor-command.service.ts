import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { buildAdminAuditData } from '../../common/audit/admin-audit.builder';
import { PrismaService } from '../../database/prisma.service';
import type { RequestMeta } from './admin-auth.types';
import {
  assertAdminTotp,
  generateAdminRecoveryCodes,
  generateAdminTwoFactorSecret,
  normalizeAdminRecoveryCode,
} from './admin-two-factor.util';

@Injectable()
export class AdminTwoFactorCommandService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async setup(adminUserId: string, meta: RequestMeta = {}) {
    const admin = await this.activeAdmin(adminUserId);
    const secret = generateAdminTwoFactorSecret();
    const issuer = this.config.get<string>('ADMIN_OTP_ISSUER') ?? 'Platform Admin';
    const label = `${issuer}:${admin.username}`;
    const otpAuthUrl = `otpauth://totp/${encodeURIComponent(label)}?secret=${encodeURIComponent(secret)}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;

    await this.prisma.$transaction(async (tx) => {
      await tx.adminUser.update({
        where: { id: admin.id },
        data: { twoFactorSecret: secret, twoFactorEnabled: false },
      });
      await tx.adminAuditLog.create({
        data: buildAdminAuditData({
          adminUserId: admin.id,
          module: 'auth',
          action: 'admin.otp.setup',
          targetId: admin.id,
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
        }),
      });
    });
    return { secret, otpAuthUrl };
  }

  async enable(adminUserId: string, code: string, meta: RequestMeta = {}) {
    const admin = await this.activeAdmin(adminUserId);
    if (!admin.twoFactorSecret) throw new UnauthorizedException('Two factor setup is not ready');
    assertAdminTotp(admin.twoFactorSecret, code);
    const recoveryCodes = generateAdminRecoveryCodes();
    const hashes = await Promise.all(recoveryCodes.map((value) => argon2.hash(normalizeAdminRecoveryCode(value))));

    await this.prisma.$transaction(async (tx) => {
      await tx.adminUser.update({ where: { id: admin.id }, data: { twoFactorEnabled: true } });
      await tx.adminRecoveryCode.deleteMany({ where: { adminUserId: admin.id } });
      for (const codeHash of hashes) {
        await tx.adminRecoveryCode.create({ data: { adminUserId: admin.id, codeHash } });
      }
      for (const action of ['admin.otp.enable', 'admin.recovery_codes.generate']) {
        await tx.adminAuditLog.create({
          data: buildAdminAuditData({
            adminUserId: admin.id,
            module: 'auth',
            action,
            targetId: admin.id,
            ipAddress: meta.ipAddress,
            userAgent: meta.userAgent,
          }),
        });
      }
    });
    return { success: true, recoveryCodes };
  }

  async disable(adminUserId: string, code: string, meta: RequestMeta = {}) {
    const admin = await this.activeAdmin(adminUserId);
    if (!admin.twoFactorEnabled || !admin.twoFactorSecret) throw new UnauthorizedException('Two factor is not enabled');
    assertAdminTotp(admin.twoFactorSecret, code);
    await this.prisma.$transaction(async (tx) => {
      await tx.adminUser.update({
        where: { id: admin.id },
        data: { twoFactorEnabled: false, twoFactorSecret: null },
      });
      await tx.adminRecoveryCode.deleteMany({ where: { adminUserId: admin.id } });
      await tx.adminAuditLog.create({
        data: buildAdminAuditData({
          adminUserId: admin.id,
          module: 'auth',
          action: 'admin.otp.disable',
          targetId: admin.id,
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
        }),
      });
    });
    return { success: true };
  }

  async regenerateRecoveryCodes(adminUserId: string, code: string, meta: RequestMeta = {}) {
    const admin = await this.activeAdmin(adminUserId);
    if (!admin.twoFactorEnabled || !admin.twoFactorSecret) throw new UnauthorizedException('Two factor is not enabled');
    assertAdminTotp(admin.twoFactorSecret, code);
    const recoveryCodes = generateAdminRecoveryCodes();
    const hashes = await Promise.all(recoveryCodes.map((value) => argon2.hash(normalizeAdminRecoveryCode(value))));
    await this.prisma.$transaction(async (tx) => {
      await tx.adminRecoveryCode.deleteMany({ where: { adminUserId: admin.id } });
      for (const codeHash of hashes) {
        await tx.adminRecoveryCode.create({ data: { adminUserId: admin.id, codeHash } });
      }
      await tx.adminAuditLog.create({
        data: buildAdminAuditData({
          adminUserId: admin.id,
          module: 'auth',
          action: 'admin.recovery_codes.regenerate',
          targetId: admin.id,
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
        }),
      });
    });
    return { success: true, recoveryCodes };
  }

  private async activeAdmin(adminUserId: string) {
    const admin = await this.prisma.adminUser.findUnique({ where: { id: adminUserId } });
    if (!admin || admin.status !== 'ACTIVE') throw new UnauthorizedException('Admin is not active');
    return admin;
  }
}
