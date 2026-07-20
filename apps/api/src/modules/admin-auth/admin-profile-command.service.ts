import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { UpdateAdminProfileDto } from './dto/update-admin-profile.dto';

interface RequestMeta {
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AdminProfileCommandService {
  constructor(private readonly prisma: PrismaService) {}

  async updateProfile(adminUserId: string, dto: UpdateAdminProfileDto, meta: RequestMeta) {
    const current = await this.prisma.adminUser.findUnique({
      where: { id: adminUserId },
      select: {
        displayName: true,
        firstName: true,
        lastName: true,
        position: true,
        department: true,
        avatarUrl: true,
      },
    });

    if (!current) throw new NotFoundException('Admin account not found');

    const next = {
      displayName: this.clean(dto.displayName, current.displayName),
      firstName: this.clean(dto.firstName, current.firstName),
      lastName: this.clean(dto.lastName, current.lastName),
      position: this.clean(dto.position, current.position),
      department: this.clean(dto.department, current.department),
      avatarUrl: this.clean(dto.avatarUrl, current.avatarUrl),
    };

    await this.prisma.$transaction(async (tx) => {
      await tx.adminUser.update({ where: { id: adminUserId }, data: next });

      await tx.adminAuditLog.create({
        data: {
          adminUserId,
          action: 'PROFILE_UPDATED',
          module: 'ADMIN_PROFILE',
          targetId: adminUserId,
          oldData: {
            displayName: current.displayName,
            firstName: current.firstName,
            lastName: current.lastName,
            position: current.position,
            department: current.department,
            avatarUrl: current.avatarUrl,
          },
          newData: next,
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
        },
      });
    });

    return next;
  }

  private clean(incoming: string | undefined, fallback: string | null) {
    if (incoming === undefined) return fallback;
    const value = incoming.trim();
    return value.length > 0 ? value : null;
  }
}
