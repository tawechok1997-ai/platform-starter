import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { buildAdminAuditData } from '../../common/admin-audit';
import { PrismaService } from '../../database/prisma.service';

const ADMIN_INVITE_TARGET_PREFIX = 'ADMIN_INVITE:';
const USERNAME_PATTERN = /^[a-zA-Z0-9._-]{3,50}$/;

@Injectable()
export class AdminInvitationService {
  constructor(private readonly prisma: PrismaService) {}

  async inspect(rawTokenInput: string) {
    const match = await this.findValidInvitation(rawTokenInput);
    const admin = await this.prisma.adminUser.findUnique({
      where: { id: match.adminUserId },
      select: {
        id: true,
        email: true,
        status: true,
        roles: { select: { role: { select: { id: true, code: true, name: true } } } },
      },
    });

    if (!admin || admin.status !== 'LOCKED') {
      throw new UnauthorizedException('Invitation is no longer available');
    }

    return {
      email: admin.email,
      expiresAt: match.token.expiresAt,
      roles: admin.roles.map((item) => item.role),
    };
  }

  async accept(rawTokenInput: string, usernameInput: string, secretInput: string) {
    const rawToken = String(rawTokenInput ?? '').trim();
    const username = String(usernameInput ?? '').trim();
    const secret = String(secretInput ?? '');

    if (!USERNAME_PATTERN.test(username)) {
      throw new BadRequestException('Username must contain 3-50 letters, numbers, dots, underscores, or hyphens');
    }
    if (secret.length < 12) {
      throw new BadRequestException('Password must contain at least 12 characters');
    }
    if (!/[A-Za-z]/.test(secret) || !/\d/.test(secret)) {
      throw new BadRequestException('Password must contain letters and numbers');
    }

    const match = await this.findValidInvitation(rawToken);
    const passwordHash = await argon2.hash(secret);

    try {
      const activated = await this.prisma.$transaction(async (tx) => {
        const existingUsername = await tx.adminUser.findUnique({ where: { username } });
        if (existingUsername && existingUsername.id !== match.adminUserId) {
          throw new ConflictException('Username is already in use');
        }

        const consumed = await tx.verificationToken.updateMany({
          where: {
            id: match.token.id,
            usedAt: null,
            expiresAt: { gt: new Date() },
          },
          data: { usedAt: new Date() },
        });
        if (consumed.count !== 1) throw new UnauthorizedException('Invitation has expired or was already used');

        const admin = await tx.adminUser.findUnique({ where: { id: match.adminUserId } });
        if (!admin || admin.status !== 'LOCKED') {
          throw new UnauthorizedException('Invitation is no longer available');
        }

        const updated = await tx.adminUser.update({
          where: { id: admin.id },
          data: {
            username,
            passwordHash,
            status: 'ACTIVE',
          },
          select: { id: true, username: true, email: true, status: true },
        });

        await tx.adminAuditLog.create({
          data: buildAdminAuditData({
            adminUserId: updated.id,
            action: 'ACCEPT_ADMIN_INVITATION',
            module: 'admin-access',
            targetId: updated.id,
            newData: { username: updated.username, email: updated.email },
          }),
        });

        return updated;
      });

      return { success: true, admin: activated };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof ConflictException || error instanceof UnauthorizedException) {
        throw error;
      }
      if (String((error as { code?: string })?.code ?? '') === 'P2002') {
        throw new ConflictException('Username is already in use');
      }
      throw error;
    }
  }

  private async findValidInvitation(rawTokenInput: string) {
    const rawToken = String(rawTokenInput ?? '').trim();
    if (rawToken.length < 32) throw new UnauthorizedException('Invalid invitation');

    const candidates = await this.prisma.verificationToken.findMany({
      where: {
        type: 'PASSWORD_RESET',
        target: { startsWith: ADMIN_INVITE_TARGET_PREFIX },
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    for (const token of candidates) {
      if (!(await argon2.verify(token.tokenHash, rawToken))) continue;
      const target = token.target.slice(ADMIN_INVITE_TARGET_PREFIX.length);
      const separator = target.indexOf(':');
      const adminUserId = separator >= 0 ? target.slice(0, separator) : '';
      if (!adminUserId) break;
      return { token, adminUserId };
    }

    throw new UnauthorizedException('Invitation has expired or is invalid');
  }
}
