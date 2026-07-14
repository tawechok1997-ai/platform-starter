import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { buildAdminAuditData } from '../../common/audit/admin-audit.builder';
import { PrismaService } from '../../database/prisma.service';

const COUNTED_FAILURE_REASONS = ['ADMIN_NOT_ACTIVE', 'INVALID_SECRET', 'INVALID_CODE'] as const;
const WINDOW_MS = 60 * 60 * 1000;

@Injectable()
export class AdminLoginDefenseService {
  constructor(private readonly prisma: PrismaService) {}

  async assertAllowed(username: string, meta: { ipAddress?: string; userAgent?: string }) {
    const now = new Date();
    const windowStart = new Date(now.getTime() - WINDOW_MS);
    const normalizedUsername = String(username ?? '').trim();
    const ipAddress = String(meta.ipAddress ?? '').trim() || undefined;

    const admin = normalizedUsername
      ? await this.prisma.adminUser.findUnique({ where: { username: normalizedUsername }, select: { id: true } })
      : null;

    const lastSuccess = admin
      ? await this.prisma.loginHistory.findFirst({
          where: { type: 'ADMIN', adminUserId: admin.id, success: true },
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true },
        })
      : null;

    const accountWindowStart = lastSuccess?.createdAt && lastSuccess.createdAt > windowStart
      ? lastSuccess.createdAt
      : windowStart;

    const [accountFailures, latestAccountFailure, ipFailures, latestIpFailure] = await Promise.all([
      admin
        ? this.prisma.loginHistory.count({
            where: {
              type: 'ADMIN',
              adminUserId: admin.id,
              success: false,
              reason: { in: [...COUNTED_FAILURE_REASONS] },
              createdAt: { gt: accountWindowStart },
            },
          })
        : Promise.resolve(0),
      admin
        ? this.prisma.loginHistory.findFirst({
            where: {
              type: 'ADMIN',
              adminUserId: admin.id,
              success: false,
              reason: { in: [...COUNTED_FAILURE_REASONS] },
              createdAt: { gt: accountWindowStart },
            },
            orderBy: { createdAt: 'desc' },
            select: { createdAt: true },
          })
        : Promise.resolve(null),
      ipAddress
        ? this.prisma.loginHistory.count({
            where: {
              type: 'ADMIN',
              ipAddress,
              success: false,
              reason: { in: [...COUNTED_FAILURE_REASONS] },
              createdAt: { gt: windowStart },
            },
          })
        : Promise.resolve(0),
      ipAddress
        ? this.prisma.loginHistory.findFirst({
            where: {
              type: 'ADMIN',
              ipAddress,
              success: false,
              reason: { in: [...COUNTED_FAILURE_REASONS] },
              createdAt: { gt: windowStart },
            },
            orderBy: { createdAt: 'desc' },
            select: { createdAt: true },
          })
        : Promise.resolve(null),
    ]);

    const accountLockMs = this.accountLockDuration(accountFailures);
    const ipLockMs = this.ipLockDuration(ipFailures);
    const accountLockedUntil = latestAccountFailure && accountLockMs
      ? new Date(latestAccountFailure.createdAt.getTime() + accountLockMs)
      : null;
    const ipLockedUntil = latestIpFailure && ipLockMs
      ? new Date(latestIpFailure.createdAt.getTime() + ipLockMs)
      : null;
    const lockedUntil = [accountLockedUntil, ipLockedUntil]
      .filter((value): value is Date => Boolean(value && value > now))
      .sort((a, b) => b.getTime() - a.getTime())[0];

    if (!lockedUntil) return;

    await this.safeWriteBlockedAttempt(admin?.id ?? null, meta, {
      accountFailures,
      ipFailures,
      lockedUntil,
    });

    const retryAfterSeconds = Math.max(Math.ceil((lockedUntil.getTime() - now.getTime()) / 1000), 1);
    throw new HttpException(
      {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        code: 'ADMIN_LOGIN_TEMPORARILY_LOCKED',
        message: 'Too many sign-in attempts. Please try again later.',
        retryAfterSeconds,
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }

  private accountLockDuration(failures: number) {
    if (failures >= 12) return 30 * 60 * 1000;
    if (failures >= 8) return 15 * 60 * 1000;
    if (failures >= 5) return 5 * 60 * 1000;
    return 0;
  }

  private ipLockDuration(failures: number) {
    if (failures >= 40) return 30 * 60 * 1000;
    if (failures >= 25) return 15 * 60 * 1000;
    if (failures >= 15) return 5 * 60 * 1000;
    return 0;
  }

  private async safeWriteBlockedAttempt(
    adminUserId: string | null,
    meta: { ipAddress?: string; userAgent?: string },
    details: { accountFailures: number; ipFailures: number; lockedUntil: Date },
  ) {
    try {
      const auditData = {
        action: 'admin.login.throttled',
        module: 'auth',
        targetId: adminUserId ?? 'unknown-admin',
        newData: {
          accountFailures: details.accountFailures,
          ipFailures: details.ipFailures,
          lockedUntil: details.lockedUntil.toISOString(),
        },
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      };

      await this.prisma.$transaction([
        this.prisma.loginHistory.create({
          data: {
            type: 'ADMIN',
            adminUserId,
            success: false,
            ipAddress: meta.ipAddress,
            userAgent: meta.userAgent,
            reason: 'LOGIN_THROTTLED',
          },
        }),
        this.prisma.adminAuditLog.create({
          data: adminUserId
            ? buildAdminAuditData({ adminUserId, ...auditData })
            : { adminUserId: null, ...auditData },
        }),
      ]);
    } catch (error) {
      console.error('admin login throttle audit failed', error);
    }
  }
}
