import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

interface AdminProfileRow {
  id: string;
  username: string;
  email: string;
  status: string;
  two_factor_enabled: boolean;
  last_login_at: Date | null;
  created_at: Date;
  updated_at: Date;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  position: string | null;
  department: string | null;
  avatar_url: string | null;
}

@Injectable()
export class AdminProfileQueryService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(adminUserId: string, sessionPermissions: readonly string[] = []) {
    const [admin] = await this.prisma.$queryRaw<AdminProfileRow[]>(Prisma.sql`
      SELECT id, username, email, status, two_factor_enabled, last_login_at, created_at, updated_at,
             display_name, first_name, last_name, position, department, avatar_url
      FROM admin_users
      WHERE id = ${adminUserId}::uuid
      LIMIT 1
    `);

    if (!admin) throw new NotFoundException('Admin account not found');

    const assignedRoles = await this.prisma.adminUserRole.findMany({
      where: { adminUserId },
      select: {
        role: {
          select: {
            code: true,
            name: true,
            description: true,
            level: true,
            permissions: {
              select: { permission: { select: { code: true, module: true, name: true } } },
            },
          },
        },
      },
    });

    const sortedAdminRoles = [...assignedRoles].sort((left, right) => left.role.level - right.role.level);
    const roles = sortedAdminRoles.map(({ role }) => ({
      code: role.code,
      name: role.name,
      description: role.description,
      level: role.level,
    }));

    const rolePermissions = sortedAdminRoles.flatMap(({ role }) =>
      role.permissions.map(({ permission }) => permission.code),
    );
    const permissions = [...new Set([...sessionPermissions, ...rolePermissions])].sort();
    const primaryRole = roles[0];

    return {
      id: admin.id,
      username: admin.username,
      email: admin.email,
      displayName: admin.display_name ?? admin.username,
      firstName: admin.first_name,
      lastName: admin.last_name,
      position: admin.position ?? primaryRole?.name ?? 'Admin',
      department: admin.department ?? this.departmentFor(primaryRole?.code, permissions),
      avatarUrl: admin.avatar_url,
      status: admin.status,
      twoFactorEnabled: admin.two_factor_enabled,
      lastLoginAt: admin.last_login_at,
      createdAt: admin.created_at,
      updatedAt: admin.updated_at,
      roles,
      permissions,
    };
  }

  private departmentFor(roleCode: string | undefined, permissions: readonly string[]) {
    const value = String(roleCode ?? '').toLowerCase();
    if (value.includes('finance') || permissions.some((code) => /^(wallet|deposit|withdraw|topups)\./.test(code))) return 'Finance Operations';
    if (value.includes('risk') || permissions.some((code) => code.startsWith('risk.'))) return 'Risk & Compliance';
    if (value.includes('support')) return 'Customer Operations';
    if (value.includes('content') || value.includes('marketing')) return 'Growth & Content';
    if (value.includes('audit')) return 'Audit & Compliance';
    if (permissions.includes('*') || value.includes('super')) return 'Platform Administration';
    return 'Operations';
  }
}
