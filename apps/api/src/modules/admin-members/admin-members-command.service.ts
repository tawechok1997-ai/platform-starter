import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { AuthenticatedAdminActor } from '../../common/actors';
import { PrismaService } from '../../database/prisma.service';

const MEMBER_STATUSES = ['ACTIVE', 'SUSPENDED', 'LOCKED', 'CLOSED'] as const;
type MemberStatus = (typeof MEMBER_STATUSES)[number];
type RequestMeta = { ipAddress?: string; userAgent?: string };

@Injectable()
export class AdminMembersCommandService {
  constructor(private readonly prisma: PrismaService) {}

  async updateMemberStatus(
    id: string,
    status: string | undefined,
    reason: string | undefined,
    admin: AuthenticatedAdminActor,
    meta: RequestMeta,
  ) {
    if (!status || !MEMBER_STATUSES.includes(status as MemberStatus)) {
      throw new BadRequestException('Invalid member status');
    }

    const existing = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, username: true, status: true },
    });
    if (!existing) throw new NotFoundException('Member not found');

    const updated = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.update({ where: { id }, data: { status: status as MemberStatus } });
      await tx.adminAuditLog.create({
        data: {
          adminUserId: admin.id,
          module: 'members',
          action: 'UPDATE_MEMBER_STATUS',
          targetId: id,
          oldData: { status: existing.status },
          newData: { status: user.status, reason: reason ?? null },
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
        },
      });
      return user;
    });

    return {
      user: {
        id: updated.id,
        username: updated.username,
        status: updated.status,
        updatedAt: updated.updatedAt,
      },
    };
  }
}
