import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { buildAdminAuditData } from '../../common/audit/admin-audit.builder';
import { PrismaService } from '../../database/prisma.service';
import type { RequestMeta } from './admin-auth.types';
import { AdminSessionTokenService } from './admin-session-token.service';

@Injectable()
export class AdminRefreshSessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: AdminSessionTokenService,
  ) {}

  async refresh(refreshToken: string, meta: RequestMeta = {}) {
    const { sessionId, rawToken } = this.readParts(refreshToken);
    const session = await this.prisma.authSession.findFirst({ where: { id: sessionId, type: 'ADMIN' } });
    if (!session?.adminUserId) throw new UnauthorizedException('Invalid admin refresh session');
    if (!(await argon2.verify(session.refreshTokenHash, rawToken))) {
      throw new UnauthorizedException('Invalid admin refresh session');
    }
    if (session.revokedAt || session.expiresAt <= new Date()) {
      if (session.revokedAt) await this.revokeFamily(session.adminUserId, session.id, meta);
      throw new UnauthorizedException('Invalid admin refresh session');
    }
    const rotated = await this.prisma.authSession.updateMany({
      where: { id: session.id, type: 'ADMIN', revokedAt: null },
      data: { revokedAt: new Date() },
    });
    if (rotated.count !== 1) {
      await this.revokeFamily(session.adminUserId, session.id, meta);
      throw new UnauthorizedException('Invalid admin refresh session');
    }
    return this.tokens.create(session.adminUserId, meta);
  }

  private async revokeFamily(adminUserId: string, sessionId: string, meta: RequestMeta) {
    await this.prisma.$transaction(async (tx) => {
      await tx.authSession.updateMany({
        where: { adminUserId, type: 'ADMIN', revokedAt: null },
        data: { revokedAt: new Date() },
      });
      await tx.adminAuditLog.create({
        data: buildAdminAuditData({
          adminUserId,
          module: 'auth',
          action: 'admin.refresh.reuse_detected',
          targetId: sessionId,
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
        }),
      });
    });
  }

  private readParts(value: string) {
    const [sessionId, rawToken] = String(value ?? '').split('.');
    if (!sessionId || !rawToken) throw new UnauthorizedException('Invalid refresh token');
    return { sessionId, rawToken };
  }
}
