import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { MemberSignInDto } from './dto/member-sign-in.dto';
import { RefreshSessionDto } from './dto/refresh-session.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto, meta: RequestMeta = {}) {
    const rawSecret = dto.secret ?? dto.password;
    if (!rawSecret) throw new BadRequestException('secret is required');

    const exists = await this.prisma.user.findFirst({
      where: { OR: [{ username: dto.username }, dto.phone ? { phone: dto.phone } : undefined, dto.email ? { email: dto.email } : undefined].filter(Boolean) as any },
    });
    if (exists) throw new ConflictException('Member already exists');

    const hash = await argon2.hash(rawSecret);
    const user = await this.prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({ data: { username: dto.username, phone: dto.phone, email: dto.email, passwordHash: hash, profile: { create: { displayName: dto.username } } } });
      await tx.wallet.create({ data: { userId: createdUser.id, currency: 'THB' } });
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

  private async createMemberSession(userId: string, meta: RequestMeta = {}) {
    const rawToken = this.createRefreshToken();
    const refreshTokenHash = await argon2.hash(rawToken);
    const expiresAt = new Date(Date.now() + this.getRefreshTokenTtlMs());
    const session = await this.prisma.authSession.create({ data: { type: 'MEMBER', userId, refreshTokenHash, ipAddress: meta.ipAddress, userAgent: meta.userAgent, deviceId: meta.deviceId, expiresAt } });
    const accessToken = await this.jwtService.signAsync({ sub: userId, type: 'MEMBER', sessionId: session.id }, { secret: this.configService.get<string>('JWT_ACCESS_KEY') ?? 'local_access_key', expiresIn: (this.configService.get<string>('JWT_ACCESS_TTL') ?? '15m') as any });
    return { accessToken, refreshToken: `${session.id}.${rawToken}`, expiresAt };
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
