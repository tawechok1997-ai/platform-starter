import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

const READ_ONLY_PERMISSION_CODES = [
  'admin.access.view',
  'admin.reports.view',
  'reports.view',
  'users.view',
  'wallet.view',
  'bank_accounts.view',
  'support.view',
  'topups.view',
  'deposit.view',
  'withdraw.view',
  'risk.view',
  'provider.view',
  'game.providers.view',
  'promotion.view',
  'seo.view',
  'settings.website.view',
  'settings.branding.view',
  'settings.theme.view',
  'settings.seo.view',
  'settings.contact.view',
  'settings.maintenance.view',
  'settings.scripts.view',
  'settings.features.view',
  'settings.legal.view',
  'security.anti_bot.view',
] as const;

type AccountConfig = {
  fullAdmin: { email: string; username: string; password: string };
  readOnlyAdmin: { email: string; username: string; password: string };
  member: { email: string; username: string; password: string; displayName: string };
};

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function username(name: string, fallback: string) {
  const value = process.env[name]?.trim() || fallback;
  if (!/^[A-Za-z0-9_.-]{3,50}$/.test(value)) {
    throw new Error(`${name} must be 3-50 characters using letters, numbers, dot, underscore, or hyphen`);
  }
  return value;
}

function email(name: string) {
  const value = required(name).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) throw new Error(`${name} must be a valid email address`);
  return value;
}

function password(name: string) {
  const value = required(name);
  if (value.length < 12) throw new Error(`${name} must contain at least 12 characters`);
  return value;
}

function readConfig(): AccountConfig {
  if (process.env.NODE_ENV === 'production' && process.env.P6_ALLOW_PRODUCTION_ACCOUNT_SEED !== 'true') {
    throw new Error('Refusing to seed P6 accounts in production without P6_ALLOW_PRODUCTION_ACCOUNT_SEED=true');
  }

  const config = {
    fullAdmin: {
      email: email('P6_ADMIN_EMAIL'),
      username: username('P6_ADMIN_USERNAME', 'p6-admin'),
      password: password('P6_ADMIN_PASSWORD'),
    },
    readOnlyAdmin: {
      email: email('P6_READONLY_ADMIN_EMAIL'),
      username: username('P6_READONLY_ADMIN_USERNAME', 'p6-readonly'),
      password: password('P6_READONLY_ADMIN_PASSWORD'),
    },
    member: {
      email: email('P6_MEMBER_EMAIL'),
      username: username('P6_MEMBER_USERNAME', 'p6-member'),
      password: password('P6_MEMBER_PASSWORD'),
      displayName: process.env.P6_MEMBER_DISPLAY_NAME?.trim() || 'P6 Test Member',
    },
  };

  const emails = [config.fullAdmin.email, config.readOnlyAdmin.email, config.member.email];
  if (new Set(emails).size !== emails.length) throw new Error('P6 account email addresses must be unique');

  const usernames = [config.fullAdmin.username, config.readOnlyAdmin.username, config.member.username];
  if (new Set(usernames).size !== usernames.length) throw new Error('P6 account usernames must be unique');

  return config;
}

async function seedAdmin(
  account: AccountConfig['fullAdmin'],
  roleId: string,
  roleCodesToRemove: string[] = [],
) {
  const passwordHash = await argon2.hash(account.password);
  const admin = await prisma.adminUser.upsert({
    where: { email: account.email },
    update: {
      username: account.username,
      passwordHash,
      status: 'ACTIVE',
      twoFactorEnabled: false,
      twoFactorSecret: null,
    },
    create: {
      email: account.email,
      username: account.username,
      passwordHash,
      status: 'ACTIVE',
    },
  });

  if (roleCodesToRemove.length > 0) {
    await prisma.adminUserRole.deleteMany({
      where: { adminUserId: admin.id, role: { code: { in: roleCodesToRemove } } },
    });
  }

  await prisma.adminUserRole.upsert({
    where: { adminUserId_roleId: { adminUserId: admin.id, roleId } },
    update: {},
    create: { adminUserId: admin.id, roleId },
  });

  await prisma.authSession.updateMany({
    where: { adminUserId: admin.id, type: 'ADMIN', revokedAt: null },
    data: { revokedAt: new Date() },
  });

  return admin;
}

async function main() {
  const config = readConfig();

  if (process.argv.includes('--check')) {
    console.log('P6 account seed configuration is valid.');
    return;
  }

  const superAdminRole = await prisma.role.findUnique({ where: { code: 'super_admin' } });
  if (!superAdminRole) throw new Error('Role super_admin does not exist. Run pnpm db:seed first.');

  const readOnlyRole = await prisma.role.upsert({
    where: { code: 'p6_readonly' },
    update: { name: 'P6 Read Only', description: 'Read-only role for P6 regression testing', level: 900 },
    create: {
      code: 'p6_readonly',
      name: 'P6 Read Only',
      description: 'Read-only role for P6 regression testing',
      level: 900,
    },
  });

  const readOnlyPermissions = await prisma.permission.findMany({
    where: { code: { in: [...READ_ONLY_PERMISSION_CODES] } },
  });
  if (readOnlyPermissions.length === 0) throw new Error('No read-only permissions found. Run pnpm db:seed first.');

  await prisma.rolePermission.deleteMany({ where: { roleId: readOnlyRole.id } });
  await prisma.rolePermission.createMany({
    data: readOnlyPermissions.map((permission) => ({ roleId: readOnlyRole.id, permissionId: permission.id })),
    skipDuplicates: true,
  });

  const fullAdmin = await seedAdmin(config.fullAdmin, superAdminRole.id, ['p6_readonly']);
  const readOnlyAdmin = await seedAdmin(config.readOnlyAdmin, readOnlyRole.id, ['super_admin', 'owner']);

  const memberPasswordHash = await argon2.hash(config.member.password);
  const member = await prisma.user.upsert({
    where: { email: config.member.email },
    update: {
      username: config.member.username,
      passwordHash: memberPasswordHash,
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
      profile: {
        upsert: {
          update: { displayName: config.member.displayName },
          create: { displayName: config.member.displayName },
        },
      },
      wallet: { upsert: { update: { status: 'ACTIVE' }, create: { currency: 'THB' } } },
    },
    create: {
      email: config.member.email,
      username: config.member.username,
      passwordHash: memberPasswordHash,
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
      profile: { create: { displayName: config.member.displayName } },
      wallet: { create: { currency: 'THB' } },
    },
  });

  await prisma.authSession.updateMany({
    where: { userId: member.id, type: 'MEMBER', revokedAt: null },
    data: { revokedAt: new Date() },
  });

  console.log('Seeded P6 accounts:', {
    fullAdmin: fullAdmin.email,
    readOnlyAdmin: readOnlyAdmin.email,
    member: member.email,
  });
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
