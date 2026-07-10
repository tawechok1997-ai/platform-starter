import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

const GROWTH_PERMISSIONS = [
  { code: 'promotions.claims.view', name: 'View promotion claims', module: 'promotions', description: 'ดูคำขอรับโปรโมชัน' },
  { code: 'promotions.claims.review', name: 'Review promotion claims', module: 'promotions', description: 'อนุมัติหรือปฏิเสธคำขอรับโปรโมชัน' },
  { code: 'bonus.ledger.view', name: 'View bonus ledger', module: 'bonus', description: 'ดู bonus ledger และ turnover' },
  { code: 'bonus.turnover.update', name: 'Update bonus turnover', module: 'bonus', description: 'อัปเดต turnover progress ของโบนัส' },
  { code: 'bonus.lifecycle.update', name: 'Update bonus lifecycle', module: 'bonus', description: 'release, expire หรือ revoke bonus ledger' },
  { code: 'affiliate.view', name: 'View affiliates', module: 'affiliate', description: 'ดูตัวแทนและ downline' },
  { code: 'affiliate.review', name: 'Review affiliates', module: 'affiliate', description: 'อนุมัติหรือปฏิเสธตัวแทน' },
  { code: 'commission.view', name: 'View commission ledger', module: 'commission', description: 'ดู commission ledger' },
  { code: 'commission.create', name: 'Create commission ledger', module: 'commission', description: 'สร้าง commission ledger แบบ manual review' },
  { code: 'commission.review', name: 'Review commission ledger', module: 'commission', description: 'อนุมัติหรือปฏิเสธ commission ledger' },
];

@Injectable()
export class AdminAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async overview() {
    await this.ensureGrowthPermissions();
    const [roles, permissions, adminUsers] = await Promise.all([
      this.prisma.role.findMany({
        include: { permissions: { include: { permission: true }, orderBy: { permission: { module: 'asc' } } }, adminUsers: true },
        orderBy: [{ level: 'asc' }, { code: 'asc' }],
      }),
      this.prisma.permission.findMany({ orderBy: [{ module: 'asc' }, { code: 'asc' }] }),
      this.prisma.adminUser.findMany({
        select: {
          id: true,
          username: true,
          email: true,
          status: true,
          twoFactorEnabled: true,
          lastLoginAt: true,
          createdAt: true,
          roles: { include: { role: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      summary: {
        roleCount: roles.length,
        permissionCount: permissions.length,
        adminUserCount: adminUsers.length,
        wildcardRoleCount: roles.filter((role) => role.permissions.some((item) => item.permission.code === '*')).length,
      },
      roles: roles.map((role) => ({
        id: role.id,
        code: role.code,
        name: role.name,
        description: role.description,
        level: role.level,
        adminUserCount: role.adminUsers.length,
        permissionCount: role.permissions.length,
        hasWildcard: role.permissions.some((item) => item.permission.code === '*'),
        permissions: role.permissions.map((item) => ({
          id: item.permission.id,
          code: item.permission.code,
          name: item.permission.name,
          module: item.permission.module,
          description: item.permission.description,
        })),
      })),
      permissions: permissions.map((permission) => ({
        id: permission.id,
        code: permission.code,
        name: permission.name,
        module: permission.module,
        description: permission.description,
      })),
      adminUsers: adminUsers.map((user) => ({
        id: user.id,
        username: user.username,
        email: user.email,
        status: user.status,
        twoFactorEnabled: user.twoFactorEnabled,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        roles: user.roles.map((item) => ({ id: item.role.id, code: item.role.code, name: item.role.name, level: item.role.level })),
      })),
    };
  }

  async assignRole(actorAdminId: string, targetAdminId: string, roleId: string) {
    const [target, role] = await Promise.all([
      this.prisma.adminUser.findUnique({ where: { id: targetAdminId }, include: { roles: { include: { role: true } } } }),
      this.prisma.role.findUnique({ where: { id: roleId }, include: { permissions: { include: { permission: true } } } }),
    ]);
    if (!target) throw new NotFoundException('Admin user not found');
    if (!role) throw new NotFoundException('Role not found');

    await this.prisma.adminUserRole.upsert({
      where: { adminUserId_roleId: { adminUserId: targetAdminId, roleId } },
      update: {},
      create: { adminUserId: targetAdminId, roleId },
    });

    await this.audit(actorAdminId, 'ASSIGN_ROLE', targetAdminId, { roleId, roleCode: role.code, target: target.username });
    return this.overview();
  }

  async removeRole(actorAdminId: string, targetAdminId: string, roleId: string) {
    const target = await this.prisma.adminUser.findUnique({ where: { id: targetAdminId }, include: { roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } } } });
    if (!target) throw new NotFoundException('Admin user not found');
    const assignment = target.roles.find((item) => item.roleId === roleId);
    if (!assignment) throw new BadRequestException('Role is not assigned to this admin user');

    const isSelf = actorAdminId === targetAdminId;
    const isLastRole = target.roles.length <= 1;
    const roleHasWildcard = assignment.role.permissions.some((item) => item.permission.code === '*');
    const roleHasAccessManage = assignment.role.permissions.some((item) => item.permission.code === 'admin.access.manage');
    if (isSelf && (isLastRole || roleHasWildcard || roleHasAccessManage)) {
      throw new ForbiddenException('Cannot remove your own critical access role');
    }

    await this.prisma.adminUserRole.delete({ where: { adminUserId_roleId: { adminUserId: targetAdminId, roleId } } });
    await this.audit(actorAdminId, 'REMOVE_ROLE', targetAdminId, { roleId, roleCode: assignment.role.code, target: target.username });
    return this.overview();
  }

  private async ensureGrowthPermissions() {
    await Promise.all(GROWTH_PERMISSIONS.map((permission) => this.prisma.permission.upsert({ where: { code: permission.code }, update: { name: permission.name, module: permission.module, description: permission.description }, create: permission })));
  }

  private async audit(actorAdminId: string, action: string, targetId: string, newData: Prisma.InputJsonObject) {
    await this.prisma.adminAuditLog.create({
      data: {
        adminUserId: actorAdminId,
        action,
        module: 'admin-access',
        targetId,
        newData,
      },
    });
  }
}
