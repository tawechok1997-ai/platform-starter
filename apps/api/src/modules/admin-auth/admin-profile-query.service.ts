import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AdminProfileQueryService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(adminUserId: string, sessionPermissions: readonly string[] = []) {
    const admin = await this.prisma.adminUser.findUnique({
      where: { id: adminUserId },
      select: {
        id: true,
        username: true,
        email: true,
        status: true,
        twoFactorEnabled: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        roles: {
          orderBy: { role: { level: 'asc' } },
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
        },
      },
    });

    if (!admin) throw new NotFoundException('Admin account not found');

    const roles = admin.roles.map(({ role }) => ({
      code: role.code,
      name: role.name,
      description: role.description,
      level: role.level,
    }));

    const rolePermissions = admin.roles.flatMap(({ role }) =>
      role.permissions.map(({ permission }) => permission.code),
    );
    const permissions = [...new Set([...sessionPermissions, ...rolePermissions])].sort();
    const primaryRole = roles[0];

    return {
      id: admin.id,
      username: admin.username,
      email: admin.email,
      displayName: admin.username,
      firstName: null,
      lastName: null,
      position: primaryRole?.name ?? 'Admin',
      department: this.departmentFor(primaryRole?.code, permissions),
      avatarUrl: null,
      status: admin.status,
      twoFactorEnabled: admin.twoFactorEnabled,
      lastLoginAt: admin.lastLoginAt,
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt,
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
