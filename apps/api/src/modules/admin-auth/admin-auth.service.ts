import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { createHmac, randomBytes } from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { AdminSignInDto } from './dto/admin-sign-in.dto';
import { VerifyAdminTwoFactorDto } from './dto/verify-admin-2fa.dto';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const RECOVERY_CODE_COUNT = 10;

@Injectable()
export class AdminAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async signIn(dto: AdminSignInDto, meta: RequestMeta = {}) {
    const admin = await this.prisma.adminUser.findUnique({ where: { username: dto.username } });
    if (!admin || admin.status !== 'ACTIVE') {
      await this.safeWriteLoginHistory(null, false, meta, 'ADMIN_NOT_ACTIVE');
      throw new UnauthorizedException('Invalid admin credentials');
    }

    const valid = await argon2.verify(admin.passwordHash, dto.secret);
    if (!valid) {
      await this.safeWriteLoginHistory(admin.id, false, meta, 'INVALID_SECRET');
      throw new UnauthorizedException('Invalid admin credentials');
    }

    if (admin.twoFactorEnabled && !dto.twoFactorCode) return { requiresTwoFactor: true, challengeId: admin.id };
    if (admin.twoFactorEnabled) await this.assertTwoFactorOrRecovery(admin.id, admin.twoFactorSecret, dto.twoFactorCode ?? '', meta);

    await this.safeWriteLoginHistory(admin.id, true, meta);
    await this.safeWriteAudit(admin.id, 'admin.login', 'auth', admin.id, meta);
    return this.createAdminSession(admin.id, meta);
  }

  async setupTwoFactor(adminUserId: string, meta: RequestMeta = {}) {
    const admin = await this.prisma.adminUser.findUnique({ where: { id: adminUserId } });
    if (!admin || admin.status !== 'ACTIVE') throw new UnauthorizedException('Admin is not active');
    const secret = this.generateBase32Secret();
    const issuer = this.configService.get<string>('ADMIN_OTP_ISSUER') ?? 'Platform Admin';
    const label = `${issuer}:${admin.username}`;
    const otpAuthUrl = `otpauth://totp/${encodeURIComponent(label)}?secret=${encodeURIComponent(secret)}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
    await this.prisma.adminUser.update({ where: { id: admin.id }, data: { twoFactorSecret: secret, twoFactorEnabled: false } });
    await this.safeWriteAudit(admin.id, 'admin.otp.setup', 'auth', admin.id, meta);
    return { secret, otpAuthUrl };
  }

  async enableTwoFactor(adminUserId: string, code: string, meta: RequestMeta = {}) {
    const admin = await this.prisma.adminUser.findUnique({ where: { id: adminUserId } });
    if (!admin || admin.status !== 'ACTIVE' || !admin.twoFactorSecret) throw new UnauthorizedException('Two factor setup is not ready');
    this.assertTotp(admin.twoFactorSecret, code);
    const recoveryCodes = this.generateRecoveryCodes();
    const hashedCodes = await Promise.all(recoveryCodes.map((item) => argon2.hash(this.normalizeRecoveryCode(item))));
    await this.prisma.$transaction([
      this.prisma.adminUser.update({ where: { id: admin.id }, data: { twoFactorEnabled: true } }),
      this.prisma.adminRecoveryCode.deleteMany({ where: { adminUserId: admin.id } }),
      ...hashedCodes.map((codeHash) => this.prisma.adminRecoveryCode.create({ data: { adminUserId: admin.id, codeHash } })),
    ]);
    await this.safeWriteAudit(admin.id, 'admin.otp.enable', 'auth', admin.id, meta);
    await this.safeWriteAudit(admin.id, 'admin.recovery_codes.generate', 'auth', admin.id, meta);
    return { success: true, recoveryCodes };
  }

  async disableTwoFactor(adminUserId: string, code: string, meta: RequestMeta = {}) {
    const admin = await this.prisma.adminUser.findUnique({ where: { id: adminUserId } });
    if (!admin || admin.status !== 'ACTIVE' || !admin.twoFactorEnabled) throw new UnauthorizedException('Two factor is not enabled');
    await this.assertTwoFactorOrRecovery(admin.id, admin.twoFactorSecret, code, meta);
    await this.prisma.$transaction([
      this.prisma.adminUser.update({ where: { id: admin.id }, data: { twoFactorEnabled: false, twoFactorSecret: null } }),
      this.prisma.adminRecoveryCode.deleteMany({ where: { adminUserId: admin.id } }),
    ]);
    await this.safeWriteAudit(admin.id, 'admin.otp.disable', 'auth', admin.id, meta);
    return { success: true };
  }

  async regenerateRecoveryCodes(adminUserId: string, code: string, meta: RequestMeta = {}) {
    const admin = await this.prisma.adminUser.findUnique({ where: { id: adminUserId } });
    if (!admin || admin.status !== 'ACTIVE' || !admin.twoFactorEnabled) throw new UnauthorizedException('Two factor is not enabled');
    await this.assertTwoFactorOrRecovery(admin.id, admin.twoFactorSecret, code, meta);
    const recoveryCodes = this.generateRecoveryCodes();
    const hashedCodes = await Promise.all(recoveryCodes.map((item) => argon2.hash(this.normalizeRecoveryCode(item))));
    await this.prisma.$transaction([
      this.prisma.adminRecoveryCode.deleteMany({ where: { adminUserId: admin.id } }),
      ...hashedCodes.map((codeHash) => this.prisma.adminRecoveryCode.create({ data: { adminUserId: admin.id, codeHash } })),
    ]);
    await this.safeWriteAudit(admin.id, 'admin.recovery_codes.regenerate', 'auth', admin.id, meta);
    return { success: true, recoveryCodes };
  }

  async verifyTwoFactor(dto: VerifyAdminTwoFactorDto, meta: RequestMeta = {}) {
    const admin = await this.prisma.adminUser.findUnique({ where: { id: dto.challengeId } });
    if (!admin || admin.status !== 'ACTIVE' || !admin.twoFactorEnabled) throw new UnauthorizedException('Invalid challenge');
    await this.assertTwoFactorOrRecovery(admin.id, admin.twoFactorSecret, dto.code, meta);
    await this.safeWriteLoginHistory(admin.id, true, meta);
    await this.safeWriteAudit(admin.id, 'admin.otp.verify', 'auth', admin.id, meta);
    return this.createAdminSession(admin.id, meta);
  }

  async refreshSession(refreshToken: string, meta: RequestMeta = {}) {
    const { sessionId, rawToken } = this.readRefreshTokenParts(refreshToken);
    const session = await this.prisma.authSession.findFirst({ where: { id: sessionId, type: 'ADMIN' } });
    if (!session?.adminUserId) throw new UnauthorizedException('Invalid admin refresh session');
    const valid = await argon2.verify(session.refreshTokenHash, rawToken);
    if (!valid) throw new UnauthorizedException('Invalid admin refresh session');
    if (session.revokedAt || session.expiresAt <= new Date()) {
      if (session.revokedAt) await this.revokeRefreshFamily('ADMIN', session.adminUserId, session.id, meta);
      throw new UnauthorizedException('Invalid admin refresh session');
    }
    const rotated = await this.prisma.authSession.updateMany({ where: { id: session.id, type: 'ADMIN', revokedAt: null }, data: { revokedAt: new Date() } });
    if (rotated.count !== 1) {
      await this.revokeRefreshFamily('ADMIN', session.adminUserId, session.id, meta);
      throw new UnauthorizedException('Invalid admin refresh session');
    }
    return this.createAdminSession(session.adminUserId, meta);
  }

  async assertStepUp(adminUserId: string, code: string, meta: RequestMeta = {}) {
    const admin = await this.prisma.adminUser.findUnique({ where: { id: adminUserId } });
    if (!admin || admin.status !== 'ACTIVE' || !admin.twoFactorEnabled || !admin.twoFactorSecret) {
      throw new UnauthorizedException('Two-factor confirmation is required for this action');
    }
    await this.assertTwoFactorOrRecovery(admin.id, admin.twoFactorSecret, code, meta);
    await this.safeWriteAudit(admin.id, 'admin.step_up.verify', 'auth', admin.id, meta);
    return { success: true };
  }

  private async revokeRefreshFamily(type: 'ADMIN' | 'MEMBER', ownerId: string, sessionId: string, meta: RequestMeta) {
    await this.prisma.authSession.updateMany({ where: type === 'ADMIN' ? { adminUserId: ownerId, type, revokedAt: null } : { userId: ownerId, type, revokedAt: null }, data: { revokedAt: new Date() } });
    if (type === 'ADMIN') await this.safeWriteAudit(ownerId, 'admin.refresh.reuse_detected', 'auth', sessionId, meta);
  }

  async signOut(sessionId: string, adminUserId: string, meta: RequestMeta = {}) {
    await this.prisma.authSession.updateMany({ where: { id: sessionId, type: 'ADMIN', revokedAt: null }, data: { revokedAt: new Date() } });
    await this.safeWriteAudit(adminUserId, 'admin.logout', 'auth', adminUserId, meta);
    return { success: true };
  }

  async listSessions(adminUserId: string, currentSessionId: string) {
    const sessions = await this.prisma.authSession.findMany({ where: { adminUserId, type: 'ADMIN' }, orderBy: { createdAt: 'desc' }, take: 30 });
    const now = new Date();
    return { items: sessions.map((session) => ({ id: session.id, deviceId: session.deviceId, ipAddress: session.ipAddress, userAgent: session.userAgent, createdAt: session.createdAt, expiresAt: session.expiresAt, revokedAt: session.revokedAt, current: session.id === currentSessionId, active: !session.revokedAt && session.expiresAt > now })) };
  }

  async revokeSession(adminUserId: string, currentSessionId: string, sessionId: string, meta: RequestMeta = {}) {
    const session = await this.prisma.authSession.findFirst({ where: { id: sessionId, adminUserId, type: 'ADMIN' } });
    if (!session) throw new NotFoundException('Session not found');
    await this.prisma.authSession.updateMany({ where: { id: sessionId, adminUserId, type: 'ADMIN', revokedAt: null }, data: { revokedAt: new Date() } });
    await this.safeWriteAudit(adminUserId, sessionId === currentSessionId ? 'admin.session.revoke.current' : 'admin.session.revoke', 'auth', sessionId, meta);
    return { success: true, current: sessionId === currentSessionId };
  }

  async revokeOtherSessions(adminUserId: string, currentSessionId: string, meta: RequestMeta = {}) {
    const result = await this.prisma.authSession.updateMany({ where: { adminUserId, type: 'ADMIN', id: { not: currentSessionId }, revokedAt: null }, data: { revokedAt: new Date() } });
    await this.safeWriteAudit(adminUserId, 'admin.session.revoke_others', 'auth', adminUserId, meta);
    return { success: true, revoked: result.count };
  }

  async revokeAllSessions(adminUserId: string, meta: RequestMeta = {}) {
    const result = await this.prisma.authSession.updateMany({ where: { adminUserId, type: 'ADMIN', revokedAt: null }, data: { revokedAt: new Date() } });
    await this.safeWriteAudit(adminUserId, 'admin.session.revoke_all', 'auth', adminUserId, meta);
    return { success: true, revoked: result.count };
  }

  private async createAdminSession(adminUserId: string, meta: RequestMeta = {}) {
    const rawToken = randomBytes(48).toString('base64url');
    const refreshTokenHash = await argon2.hash(rawToken);
    const expiresAt = new Date(Date.now() + this.getRefreshTokenTtlMs());
    const session = await this.prisma.authSession.create({ data: { type: 'ADMIN', adminUserId, refreshTokenHash, ipAddress: meta.ipAddress, userAgent: meta.userAgent, deviceId: meta.deviceId, expiresAt } });
    const accessToken = await this.jwtService.signAsync({ sub: adminUserId, type: 'ADMIN', sessionId: session.id }, { secret: this.configService.get<string>('JWT_ACCESS_KEY') ?? 'local_access_key', expiresIn: (this.configService.get<string>('ADMIN_JWT_ACCESS_TTL') ?? '10m') as any });
    return { accessToken, refreshToken: `${session.id}.${rawToken}`, expiresAt };
  }

  private async assertTwoFactorOrRecovery(adminUserId: string, secret: string | null, code: string, meta: RequestMeta = {}) {
    try {
      this.assertTotp(secret, code);
      return 'totp';
    } catch {}
    const matchedRecoveryCode = await this.useRecoveryCode(adminUserId, code);
    if (!matchedRecoveryCode) throw new UnauthorizedException('Invalid code');
    await this.safeWriteAudit(adminUserId, 'admin.recovery_codes.use', 'auth', adminUserId, meta);
    return 'recovery_code';
  }

  private async useRecoveryCode(adminUserId: string, code: string) {
    const normalized = this.normalizeRecoveryCode(code);
    if (!/^[A-Z0-9]{12}$/.test(normalized)) return false;
    const rows = await this.prisma.adminRecoveryCode.findMany({ where: { adminUserId, usedAt: null }, orderBy: { createdAt: 'asc' } });
    for (const row of rows) {
      if (await argon2.verify(row.codeHash, normalized)) {
        const result = await this.prisma.adminRecoveryCode.updateMany({ where: { id: row.id, usedAt: null }, data: { usedAt: new Date() } });
        return result.count === 1;
      }
    }
    return false;
  }

  private assertTotp(secret: string | null, code: string) {
    if (!secret) throw new UnauthorizedException('Two factor secret is missing');
    const normalized = String(code ?? '').replace(/\s/g, '');
    if (!/^\d{6}$/.test(normalized)) throw new UnauthorizedException('Invalid code');
    const nowCounter = Math.floor(Date.now() / 1000 / 30);
    const valid = [-1, 0, 1].some((offset) => this.generateTotp(secret, nowCounter + offset) === normalized);
    if (!valid) throw new UnauthorizedException('Invalid code');
  }

  private generateTotp(secret: string, counter: number) {
    const key = this.base32Decode(secret);
    const buffer = Buffer.alloc(8);
    buffer.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
    buffer.writeUInt32BE(counter >>> 0, 4);
    const hmac = createHmac('sha1', key).update(buffer).digest();
    const offset = hmac[hmac.length - 1] & 0xf;
    const binary = ((hmac[offset] & 0x7f) << 24) | ((hmac[offset + 1] & 0xff) << 16) | ((hmac[offset + 2] & 0xff) << 8) | (hmac[offset + 3] & 0xff);
    return String(binary % 1_000_000).padStart(6, '0');
  }

  private generateBase32Secret() {
    const bytes = randomBytes(20);
    let bits = '';
    for (const byte of bytes) bits += byte.toString(2).padStart(8, '0');
    let output = '';
    for (let i = 0; i < bits.length; i += 5) {
      const chunk = bits.slice(i, i + 5).padEnd(5, '0');
      output += BASE32_ALPHABET[parseInt(chunk, 2)];
    }
    return output;
  }

  private generateRecoveryCodes() {
    return Array.from({ length: RECOVERY_CODE_COUNT }, () => {
      const value = randomBytes(9).toString('base64url').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().padEnd(12, '0').slice(0, 12);
      return `${value.slice(0, 4)}-${value.slice(4, 8)}-${value.slice(8, 12)}`;
    });
  }

  private normalizeRecoveryCode(value: string) {
    return String(value ?? '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  }

  private base32Decode(value: string) {
    const clean = value.toUpperCase().replace(/=+$/g, '').replace(/\s/g, '');
    let bits = '';
    for (const char of clean) {
      const index = BASE32_ALPHABET.indexOf(char);
      if (index < 0) throw new UnauthorizedException('Invalid two factor secret');
      bits += index.toString(2).padStart(5, '0');
    }
    const bytes: number[] = [];
    for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
    return Buffer.from(bytes);
  }

  private readRefreshTokenParts(value: string) {
    const [sessionId, rawToken] = value.split('.');
    if (!sessionId || !rawToken) throw new UnauthorizedException('Invalid refresh token');
    return { sessionId, rawToken };
  }

  private getRefreshTokenTtlMs() {
    const hours = Number(this.configService.get<string>('ADMIN_REFRESH_TTL_HOURS') ?? 12);
    return hours * 60 * 60 * 1000;
  }

  private async safeWriteLoginHistory(adminUserId: string | null, success: boolean, meta: RequestMeta, reason?: string) {
    try {
      await this.prisma.loginHistory.create({ data: { type: 'ADMIN', adminUserId, success, ipAddress: meta.ipAddress, userAgent: meta.userAgent, reason } });
    } catch (error) {
      console.error('admin login history write failed', error);
    }
  }

  private async safeWriteAudit(adminUserId: string, action: string, module: string, targetId: string, meta: RequestMeta) {
    try {
      await this.prisma.adminAuditLog.create({ data: { adminUserId, action, module, targetId, ipAddress: meta.ipAddress, userAgent: meta.userAgent } });
    } catch (error) {
      console.error('admin audit write failed', error);
    }
  }
}

export type RequestMeta = { ipAddress?: string; userAgent?: string; deviceId?: string };
