import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { UpdateAdminProfileDto } from './dto/update-admin-profile.dto';

interface AdminProfileRow {
  id: string;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  position: string | null;
  department: string | null;
  avatar_url: string | null;
}

interface RequestMeta {
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AdminProfileCommandService {
  constructor(private readonly prisma: PrismaService) {}

  async updateProfile(adminUserId: string, dto: UpdateAdminProfileDto, meta: RequestMeta) {
    const [current] = await this.prisma.$queryRaw<AdminProfileRow[]>(Prisma.sql`
      SELECT id, display_name, first_name, last_name, position, department, avatar_url
      FROM admin_users
      WHERE id = ${adminUserId}::uuid
      LIMIT 1
    `);

    if (!current) throw new NotFoundException('Admin account not found');

    const next = {
      displayName: this.clean(dto.displayName, current.display_name),
      firstName: this.clean(dto.firstName, current.first_name),
      lastName: this.clean(dto.lastName, current.last_name),
      position: this.clean(dto.position, current.position),
      department: this.clean(dto.department, current.department),
      avatarUrl: this.clean(dto.avatarUrl, current.avatar_url),
    };

    await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw(Prisma.sql`
        UPDATE admin_users
        SET display_name = ${next.displayName},
            first_name = ${next.firstName},
            last_name = ${next.lastName},
            position = ${next.position},
            department = ${next.department},
            avatar_url = ${next.avatarUrl},
            updated_at = NOW()
        WHERE id = ${adminUserId}::uuid
      `);

      await tx.adminAuditLog.create({
        data: {
          adminUserId,
          action: 'PROFILE_UPDATED',
          module: 'ADMIN_PROFILE',
          targetId: adminUserId,
          oldData: {
            displayName: current.display_name,
            firstName: current.first_name,
            lastName: current.last_name,
            position: current.position,
            department: current.department,
            avatarUrl: current.avatar_url,
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
