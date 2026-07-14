import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { buildAdminAuditData } from '../../common/audit/admin-audit.builder';
import { PrismaService } from '../../database/prisma.service';
import { AdminSessionTokenService } from './admin-session-token.service';
import { assertAdminTotp, normalizeAdminRecoveryCode } from './admin-two-factor.util';
import { AdminSignInDto } from './dto/admin-sign-in.dto';
import { VerifyAdminTwoFactorDto } from './dto/verify-admin-2fa.dto';

export type AdminLoginMeta = { ipAddress?: string; userAgent?: string; deviceId?: string };

@Injectable()
export class AdminLoginService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly sessions: AdminSessionTokenService,
  ) {}

  async signIn(dto: AdminSignInDto, meta: AdminLoginMeta = {}) {
    const admin = await this.prisma.adminUser.findUnique({ where: { username: dto.username } });
    if (!admin || admin.status !== 'ACTIVE') {
      await this.writeLoginHistory(null, false, meta, 'ADMIN_NOT_ACTIVE');
      throw new UnauthorizedException('Invalid admin credentials');
    }

    const valid = await argon2.verify(admin.passwordHash, dto.secret);
    if (!valid) {
      await this.writeLoginHistory(admin.id, false, meta, 'INVALID_SECRET');
      await this.lockAfterFailures(admin.id, meta);
      throw new UnauthorizedException('Invalid admin credentials');
    }

    if (admin.twoFactorEnabled && !dto.twoFactorCode) {
      return { requiresTwoFactor: true, challengeId: admin.id };
    }
    if (admin.twoFactorEnabled) {
      await this.assertTwoFactorOrRecovery(admin.id, admin.twoFactorSecret, dto.twoFactorCode ?? '', meta);
    }

    await this.auditSuspiciousDevice(admin.id, meta);
    await this.writeLoginHistory(admin.id, true, meta);
    await this.writeAudit(admin.id, 'admin.login', admin.id, meta);
    return this.sessions.create(admin.id, meta);
  }

  async verifyTwoFactor(dto: VerifyAdminTwoFactorDto, meta: AdminLoginMeta = {}) {
    const admin = await this.prisma.adminUser.findUnique({ where: { id: dto.challengeId } });
    if (!admin || admin.status !== 'ACTIVE' || !admin.twoFactorEnabled) {
      throw new UnauthorizedException('Invalid challenge');
    }
    await this.assertTwoFactorOrRecovery(admin.id, admin.twoFactorSecret, dto.code, meta);
    await this.auditSuspiciousDevice(admin.id, meta);
    await this.writeLoginHistory(admin.id, true, meta);
    await this.writeAudit(admin.id, 'admin.otp.verify', admin.id, meta);
    return this.sessions.create(admin.id, meta);
  }

  async assertStepUp(adminUserId: string, code: string, meta: AdminLoginMeta = {}) {
    const admin = await this.prisma.adminUser.findUnique({ where: { id: adminUserId } });
    if (!admin || admin.status !== 'ACTIVE' || !admin.twoFactorEnabled || !admin.twoFactorSecret) {
      throw new UnauthorizedException('Two-factor confirmation is required for this action');
    }
    await this.assertTwoFactorOrRecovery(admin.id, admin.twoFactorSecret, code, meta);
    await this.writeAudit(admin.id, 'admin.step_up.verify', admin.id, meta);
    return { success: true };
  }

  private async assertTwoFactorOrRecovery(adminUserId: string, secret: string | null, code: string, meta: AdminLoginMeta) {
    try {
      assertAdminTotp(secret, code);
      return;
    } catch {}
    const normalized = normalizeAdminRecoveryCode(code);
    if (!/^[A-Z0-9]{12}$/.test(normalized)) throw new UnauthorizedException('Invalid code');
    const rows = await this.prisma.adminRecoveryCode.findMany({ where: { adminUserId, usedAt: null }, orderBy: { createdAt: 'asc' } });
    for (const row of rows) {
      if (!(await argon2.verify(row.codeHash, normalized))) continue;
      const used = await this.prisma.adminRecoveryCode.updateMany({ where: { id: row.id, usedAt: null }, data: { usedAt: new Date() } });
      if (used.count === 1) {
        await this.writeAudit(adminUserId, 'admin.recovery_codes.use', adminUserId, meta);
        return;
      }
    }
    throw new UnauthorizedException('Invalid code');
  }

  private async auditSuspiciousDevice(adminUserId: string, meta: AdminLoginMeta) {
    const previous = await this.prisma.loginHistory.findMany({
      where: { adminUserId, type: 'ADMIN', success: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { ipAddress: true, userAgent: true },
    });
    if (previous.length === 0) return;
    const known = previous.some((item) => item.ipAddress === (meta.ipAddress ?? null) && item.userAgent === (meta.userAgent ?? null));
    if (!known) await this.writeAudit(adminUserId, 'admin.login.suspicious_device', adminUserId, meta);
  }

  private async lockAfterFailures(adminUserId: string, meta: AdminLoginMeta) {
    const threshold = this.positiveInt('ADMIN_LOCKOUT_FAILURES', 5);
    const minutes = this.positiveInt('ADMIN_LOCKOUT_WINDOW_MINUTES', 15);
    const recent = await this.prisma.loginHistory.findMany({
      where: { adminUserId, type: 'ADMIN', createdAt: { gte: new Date(Date.now() - minutes * 60_000) } },
      orderBy: { createdAt: 'desc' },
      take: threshold,
      select: { success: true },
    });
    if (recent.length < threshold || recent.some((item) => item.success)) return;
    const locked = await this.prisma.adminUser.updateMany({ where: { id: adminUserId, status: 'ACTIVE' }, data: { status: 'LOCKED' } });
    if (locked.count === 1) await this.writeAudit(adminUserId, 'admin.account.lockout', adminUserId, meta);
  }

  private positiveInt(name: string, fallback: number) {
    const value = Number(this.config.get<string>(name) ?? process.env[name] ?? fallback);
    return Number.isInteger(value) && value > 0 ? value : fallback;
  }

  private async writeLoginHistory(adminUserId: string | null, success: boolean, meta: AdminLoginMeta, reason?: string) {
    try {
      await this.prisma.loginHistory.create({ data: { type: 'ADMIN', adminUserId, success, ipAddress: meta.ipAddress, userAgent: meta.userAgent, reason } });
    } catch (error) {
      console.error('admin login history write failed', error);
    }
  }

  private async writeAudit(adminUserId: string, action: string, targetId: string, meta: AdminLoginMeta) {
    try {
      await this.prisma.adminAuditLog.create({ data: buildAdminAuditData({ adminUserId, module: 'auth', action, targetId, ipAddress: meta.ipAddress, userAgent: meta.userAgent }) });
    } catch (error) {
      console.error('admin audit write failed', error);
    }
  }
}
