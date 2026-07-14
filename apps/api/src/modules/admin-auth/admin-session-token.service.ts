import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../../database/prisma.service';
import type { RequestMeta } from './admin-auth.types';

@Injectable()
export class AdminSessionTokenService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async create(adminUserId: string, meta: RequestMeta = {}) {
    const rawToken = randomBytes(48).toString('base64url');
    const refreshTokenHash = await argon2.hash(rawToken);
    const hours = Number(this.config.get<string>('ADMIN_REFRESH_TTL_HOURS') ?? 12);
    const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);
    const session = await this.prisma.authSession.create({
      data: {
        type: 'ADMIN',
        adminUserId,
        refreshTokenHash,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
        deviceId: meta.deviceId,
        expiresAt,
      },
    });
    const accessToken = await this.jwt.signAsync(
      { sub: adminUserId, type: 'ADMIN', sessionId: session.id },
      {
        secret: this.config.get<string>('JWT_ACCESS_KEY') ?? 'local_access_key',
        expiresIn: (this.config.get<string>('ADMIN_JWT_ACCESS_TTL') ?? '10m') as never,
      },
    );
    return { accessToken, refreshToken: `${session.id}.${rawToken}`, expiresAt };
  }
}
