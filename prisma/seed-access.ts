import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PERMISSIONS = [
  {
    code: 'admin.access.view',
    name: 'View access control',
    module: 'admin-access',
    description: 'Allow viewing admin roles, permissions, and admin user role assignments.',
  },
  {
    code: 'admin.access.manage',
    name: 'Manage admin access',
    module: 'admin-access',
    description: 'Allow assigning and removing roles from admin users.',
  },
  {
    code: 'admin.access.delegate',
    name: 'Delegate limited admin access',
    module: 'admin-access',
    description: 'Allow creating and revoking time-limited permission delegations.',
  },
  {
    code: 'admin.reports.view',
    name: 'View admin reports',
    module: 'reports',
    description: 'Allow viewing finance reports, trends, and reconciliation pages.',
  },
  {
    code: 'admin.activity.view',
    name: 'View admin activity',
    module: 'activity',
    description: 'Allow viewing the admin activity timeline.',
  },
];

async function main() {
  for (const permission of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code: permission.code },
      update: permission,
      create: permission,
    });
  }

  const savedPermissions = await prisma.permission.findMany({ where: { code: { in: PERMISSIONS.map((item) => item.code) } } });
  const explicitAdminRole = await prisma.role.findFirst({ where: { code: { in: ['super_admin', 'SUPER_ADMIN', 'owner', 'OWNER'] } } });
  const wildcardRole = await prisma.role.findFirst({ where: { permissions: { some: { permission: { code: '*' } } } } });
  const targetRole = explicitAdminRole ?? wildcardRole;

  if (targetRole) {
    for (const permission of savedPermissions) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: targetRole.id, permissionId: permission.id } },
        update: {},
        create: { roleId: targetRole.id, permissionId: permission.id },
      });
    }
    console.log(`Seeded admin access permissions and attached them to role ${targetRole.code}`);
    return;
  }

  console.log('Seeded admin access permissions. No default admin or wildcard role was found, so no role permissions were attached.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
