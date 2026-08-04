import { PrismaClient } from '@prisma/client';
import { ADMIN_ROLE_TEMPLATES } from '../apps/api/src/modules/admin-access/admin-role-templates';

const prisma = new PrismaClient();

const ACCESS_PERMISSION_METADATA = [
  {
    code: 'admin.access.view',
    name: 'View access control',
    module: 'admin-access',
    description: 'Allow viewing admin roles, permissions, and effective access.',
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
    code: 'admin.teams.view',
    name: 'View admin teams',
    module: 'admin-access',
    description: 'Allow viewing admin teams and reporting lines.',
  },
  {
    code: 'admin.teams.manage',
    name: 'Manage admin teams',
    module: 'admin-access',
    description: 'Allow creating teams and managing team membership.',
  },
  {
    code: 'admin.subordinates.create',
    name: 'Create subordinate admins',
    module: 'admin-access',
    description: 'Allow inviting subordinate administrator accounts.',
  },
  {
    code: 'admin.subordinates.manage',
    name: 'Manage direct subordinates',
    module: 'admin-access',
    description: 'Allow managing direct reporting lines and subordinate access.',
  },
  {
    code: 'admin.permissions.override',
    name: 'Override admin permissions',
    module: 'admin-access',
    description: 'Allow explicit ALLOW or DENY overrides with audit evidence.',
  },
] as const;

function permissionName(code: string) {
  return code
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function permissionModule(code: string) {
  return code.split('.')[0] || 'admin-access';
}

async function main() {
  const metadataByCode = new Map(
    ACCESS_PERMISSION_METADATA.map((permission) => [permission.code, permission]),
  );
  const templatePermissionCodes = Array.from(
    new Set(ADMIN_ROLE_TEMPLATES.flatMap((template) => template.permissionCodes)),
  ).sort();
  const requiredPermissionCodes = Array.from(
    new Set([
      ...ACCESS_PERMISSION_METADATA.map((permission) => permission.code),
      ...templatePermissionCodes,
    ]),
  ).sort();

  for (const code of requiredPermissionCodes) {
    const metadata = metadataByCode.get(code);
    const permission = {
      code,
      name: metadata?.name ?? permissionName(code),
      module: metadata?.module ?? permissionModule(code),
      description:
        metadata?.description ?? `Permission required by the ${code} admin access template.`,
    };
    await prisma.permission.upsert({
      where: { code },
      update: permission,
      create: permission,
    });
  }

  const allPermissions = await prisma.permission.findMany({
    where: { code: { in: requiredPermissionCodes } },
    select: { id: true, code: true },
  });
  const permissionByCode = new Map(
    allPermissions.map((permission) => [permission.code, permission]),
  );

  for (const template of ADMIN_ROLE_TEMPLATES) {
    const missingPermissionCodes = template.permissionCodes.filter(
      (code) => !permissionByCode.has(code),
    );
    if (missingPermissionCodes.length > 0) {
      throw new Error(
        `Missing permissions for role template ${template.code}: ${missingPermissionCodes.join(', ')}`,
      );
    }

    const role = await prisma.role.upsert({
      where: { code: template.code },
      update: {
        name: template.name,
        description: template.description,
        level: template.level,
      },
      create: {
        code: template.code,
        name: template.name,
        description: template.description,
        level: template.level,
      },
    });

    await prisma.$transaction([
      prisma.rolePermission.deleteMany({ where: { roleId: role.id } }),
      prisma.rolePermission.createMany({
        data: template.permissionCodes.map((code) => ({
          roleId: role.id,
          permissionId: permissionByCode.get(code)!.id,
        })),
        skipDuplicates: true,
      }),
    ]);
  }

  const explicitAdminRole = await prisma.role.findFirst({
    where: { code: { in: ['super_admin', 'SUPER_ADMIN', 'owner', 'OWNER'] } },
  });
  const wildcardRole = await prisma.role.findFirst({
    where: { permissions: { some: { permission: { code: '*' } } } },
  });
  const protectedRole = explicitAdminRole ?? wildcardRole;

  if (protectedRole) {
    await prisma.rolePermission.createMany({
      data: ACCESS_PERMISSION_METADATA.map((permission) => ({
        roleId: protectedRole.id,
        permissionId: permissionByCode.get(permission.code)!.id,
      })),
      skipDuplicates: true,
    });
  }

  console.log(
    `Seeded ${requiredPermissionCodes.length} access permissions and ${ADMIN_ROLE_TEMPLATES.length} deterministic role templates.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
