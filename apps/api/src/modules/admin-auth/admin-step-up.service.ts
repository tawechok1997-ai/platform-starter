import { Injectable, UnauthorizedException } from '@nestjs/common';
import { buildAdminAuditData } from '../../common/audit/admin-audit.builder';
import { PrismaService } from '../../database/prisma.service';
import type { RequestMeta } from './admin-auth.service';
import { assertAdminTotp } from './admin-two-factor.util';

@Injectable()
export class AdminStepUpService {
  constructor(private readonly prisma: PrismaService) {}

  async verify(adminUserId: string, code: string, meta: RequestMeta = {}) {
    const admin = await this.prisma.adminUser.findUnique({ where: { id: adminUserId } });
    if (!admin || admin.status !== 'ACTIVE' || !admin.twoFactorEnabled || !admin.twoFactorSecret) {
      throw new UnauthorizedException('Two-factor confirmation is required for this action');
    }
    assertAdminTotp(admin.twoFactorSecret, code);
    await this.prisma.adminAuditLog.create({
      data: buildAdminAuditData({
        adminUserId,
        module: 'auth',
        action: 'admin.step_up.verify',
        targetId: adminUserId,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      }),
    });
    return { success: true };
  }
}
