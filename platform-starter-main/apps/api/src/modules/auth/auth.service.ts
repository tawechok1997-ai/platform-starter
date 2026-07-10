import { BadRequestException, ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { MemberSignInDto } from './dto/member-sign-in.dto';
import { RefreshSessionDto } from './dto/refresh-session.dto';
import { UpdateMemberProfileDto } from './dto/update-member-profile.dto';
import { ChangeMemberPasswordDto } from './dto/change-member-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto, meta: RequestMeta = {}) {
    const rawSecret = dto.secret ?? dto.password;
    if (!rawSecret) throw new BadRequestException('กรุณากำหนดรหัสผ่าน');

    const fullName = this.cleanDisplayName(dto.fullName);
    const bankAccountName = this.cleanDisplayName(dto.bankAccountName);
    if (this.normalizePersonName(fullName) !== this.normalizePersonName(bankAccountName)) {
      throw new BadRequestException('ชื่อบัญชีธนาคารต้องตรงกับชื่อจริงที่ใช้สมัคร');
    }

    const exists = await this.prisma.user.findFirst({
      where: { OR: [{ username: dto.username }, dto.phone ? { phone: dto.phone } : undefined, dto.email ? { email: dto.email } : undefined].filter(Boolean) as any },
    });
    if (exists) throw new ConflictException('ชื่อผู้ใช้ เบอร์โทร หรืออีเมลนี้ถูกใช้แล้ว');

    const bankExists = await this.prisma.memberBankAccount.findFirst({
      where: { accountNumber: dto.bankAccountNumber },
      select: { id: true },
    });
    if (bankExists) throw new ConflictException('บัญชีธนาคารนี้ถูกใช้กับสมาชิกคนอื่นแล้ว');

    const hash = await argon2.hash(rawSecret);
    const user = await this.prisma.$transaction(async (tx) => {
      const duplicateBank = await tx.memberBankAccount.findFirst({
        where: { accountNumber: dto.bankAccountNumber },
        select: { id: true },
      });
      if (duplicateBank) throw new ConflictException('บัญชีธนาคารนี้ถูกใช้กับสมาชิกคนอื่นแล้ว');

      const createdUser = await tx.user.create({
        data: {
          username: dto.username,
          phone: dto.phone,
          email: dto.email,
          passwordHash: hash,
          profile: { create: { displayName: fullName } },
        },
      });

      await tx.wallet.create({ data: { userId: createdUser.id, currency: 'THB' } });
      await tx.memberBankAccount.create({
        data: {
          userId: createdUser.id,
          bankName: dto.bankName,
          accountName: bankAccountName,
          accountNumber: dto.bankAccountNumber,
          isPrimary: true,
          status: 'PENDING_REVIEW',
        },
      });

      return createdUser;
    });

    await this.safeWriteLoginHistory('MEMBER', user.id, true, meta);
    return this.createMemberSession(user.id, meta);
  }

  async signIn(dto: MemberSignInDto, meta: RequestMeta = {}) {
    const rawSecret = dto.secret ?? dto.password;
    if (!rawSecret) throw new BadRequestException('secret is required');

    const user = await this.prisma.user.findFirst({ where: { OR: [{ username: dto.identifier }, { phone: dto.identifier }, { email: dto.identifier }] } });
    if (!user || user.status !== 'ACTIVE') {
      await this.safeWriteLoginHistory('MEMBER', null, false, meta, 'MEMBER_NOT_FOUND_OR_INACTIVE');
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await argon2.verify(user.passwordHash, rawSecret);
    if (!valid) {
      await this.safeWriteLoginHistory('MEMBER', user.id, false, meta, 'INVALID_SECRET');
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.safeWriteLoginHistory('MEMBER', user.id, true, meta);
    return this.createMemberSession(user.id, meta);
  }

  async refreshSession(dto: RefreshSessionDto, meta: RequestMeta = {}) {
    const { sessionId, rawToken } = this.readRefreshTokenParts(dto.refreshToken);
    const session = await this.prisma.authSession.findFirst({ where: { id: sessionId, type: 'MEMBER', revokedAt: null, expiresAt: { gt: new Date() } } });
    if (!session?.userId) throw new UnauthorizedException('Invalid refresh session');
    const valid = await argon2.verify(session.refreshTokenHash, rawToken);
    if (!valid) throw new UnauthorizedException('Invalid refresh session');
    await this.prisma.authSession.update({ where: { id: session.id }, data: { revokedAt: new Date() } });
    return this.createMemberSession(session.userId, meta);
  }

  async signOut(sessionId: string) {
    await this.prisma.authSession.updateMany({ where: { id: sessionId, type: 'MEMBER', revokedAt: null }, data: { revokedAt: new Date() } });
    return { success: true };
  }

  async getMemberProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true, wallet: true },
    });
    if (!user) throw new NotFoundException('Member not found');
    return {
      id: user.id,
      username: user.username,
      phone: user.phone,
      email: user.email,
      status: user.status,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      phoneVerifiedAt: user.phoneVerifiedAt,
      emailVerifiedAt: user.emailVerifiedAt,
      displayName: user.profile?.displayName ?? user.username,
      avatarUrl: user.profile?.avatarUrl ?? null,
      wallet: user.wallet ? {
        currency: user.wallet.currency,
        availableBalance: user.wallet.balance.minus(user.wallet.lockedBalance).toString(),
        lockedBalance: user.wallet.lockedBalance.toString(),
        status: user.wallet.status,
      } : null,
    };
  }

  async updateMemberProfile(userId: string, dto: UpdateMemberProfileDto) {
    const duplicate = await this.prisma.user.findFirst({
      where: {
        id: { not: userId },
        OR: [dto.phone ? { phone: dto.phone } : undefined, dto.email ? { email: dto.email } : undefined].filter(Boolean) as any,
      },
      select: { id: true },
    });
    if (duplicate) throw new ConflictException('Phone or email already in use');

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: userId }, data: { phone: dto.phone, email: dto.email } });
      await tx.userProfile.upsert({
        where: { userId },
        create: { userId, displayName: dto.displayName },
        update: { displayName: dto.displayName },
      });
    });
    return this.getMemberProfile(userId);
  }

  async changeMemberPassword(userId: string, currentSessionId: string, dto: ChangeMemberPasswordDto) {
    if (dto.currentPassword === dto.newPassword) throw new BadRequestException('New password must be different');
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Member not found');
    const valid = await argon2.verify(user.passwordHash, dto.currentPassword);
    if (!valid) throw new UnauthorizedException('Current password is incorrect');
    const passwordHash = await argon2.hash(dto.newPassword);
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: userId }, data: { passwordHash } }),
      this.prisma.authSession.updateMany({
        where: { userId, type: 'MEMBER', id: { not: currentSessionId }, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
    return { success: true, revokedOtherSessions: true };
  }

  async listMemberSessions(userId: string, currentSessionId: string) {
    const items = await this.prisma.authSession.findMany({
      where: { userId, type: 'MEMBER', revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
      select: { id: true, ipAddress: true, userAgent: true, deviceId: true, createdAt: true, updatedAt: true, expiresAt: true },
    });
    return { items: items.map((item) => ({ ...item, current: item.id === currentSessionId })) };
  }

  async revokeMemberSession(userId: string, currentSessionId: string, sessionId: string) {
    if (sessionId === currentSessionId) throw new BadRequestException('Use logout to revoke the current session');
    await this.prisma.authSession.updateMany({ where: { id: sessionId, userId, type: 'MEMBER', revokedAt: null }, data: { revokedAt: new Date() } });
    return { success: true };
  }

  async revokeOtherMemberSessions(userId: string, currentSessionId: string) {
    const result = await this.prisma.authSession.updateMany({
      where: { userId, type: 'MEMBER', id: { not: currentSessionId }, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { success: true, revokedCount: result.count };
  }

  async getMemberSecurity(userId: string) {
    const [user, sessions, history] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId }, select: { status: true, updatedAt: true, lastLoginAt: true } }),
      this.prisma.authSession.count({ where: { userId, type: 'MEMBER', revokedAt: null, expiresAt: { gt: new Date() } } }),
      this.prisma.loginHistory.findMany({
        where: { userId, type: 'MEMBER' },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: { id: true, success: true, ipAddress: true, userAgent: true, reason: true, createdAt: true },
      }),
    ]);
    if (!user) throw new NotFoundException('Member not found');
    return {
      accountStatus: user.status,
      activeSessions: sessions,
      passwordUpdatedAt: user.updatedAt,
      lastLoginAt: user.lastLoginAt,
      failedLoginCount: history.filter((item) => !item.success).length,
      recentLogins: history,
      twoFactorEnabled: false,
    };
  }

  private async createMemberSession(userId: string, meta: RequestMeta = {}) {
    const rawToken = this.createRefreshToken();
    const refreshTokenHash = await argon2.hash(rawToken);
    const expiresAt = new Date(Date.now() + this.getRefreshTokenTtlMs());
    const session = await this.prisma.authSession.create({ data: { type: 'MEMBER', userId, refreshTokenHash, ipAddress: meta.ipAddress, userAgent: meta.userAgent, deviceId: meta.deviceId, expiresAt } });
    const accessToken = await this.jwtService.signAsync({ sub: userId, type: 'MEMBER', sessionId: session.id }, { secret: this.configService.get<string>('JWT_ACCESS_KEY') ?? 'local_access_key', expiresIn: (this.configService.get<string>('JWT_ACCESS_TTL') ?? '15m') as any });
    return { accessToken, refreshToken: `${session.id}.${rawToken}`, expiresAt };
  }

  private cleanDisplayName(value: string) {
    return value.normalize('NFKC').replace(/\s+/g, ' ').trim();
  }

  private normalizePersonName(value: string) {
    return this.cleanDisplayName(value)
      .toLocaleLowerCase('th-TH')
      .replace(/[\s.\-_'’]/g, '');
  }

  private createRefreshToken() { return randomBytes(48).toString('base64url'); }

  private readRefreshTokenParts(value: string) {
    const [sessionId, rawToken] = value.split('.');
    if (!sessionId || !rawToken) throw new UnauthorizedException('Invalid refresh token');
    return { sessionId, rawToken };
  }

  private getRefreshTokenTtlMs() {
    const days = Number(this.configService.get<string>('JWT_REFRESH_TTL_DAYS') ?? 30);
    return days * 24 * 60 * 60 * 1000;
  }

  private async safeWriteLoginHistory(type: 'MEMBER', userId: string | null, success: boolean, meta: RequestMeta, reason?: string) {
    try {
      await this.prisma.loginHistory.create({ data: { type, userId, success, ipAddress: meta.ipAddress, userAgent: meta.userAgent, reason } });
    } catch (error) {
      console.error('member login history write failed', error);
    }
  }
}

export type RequestMeta = { ipAddress?: string; userAgent?: string; deviceId?: string };
