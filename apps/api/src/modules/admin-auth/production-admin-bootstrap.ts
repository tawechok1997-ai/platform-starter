import { Prisma } from '@prisma/client';
import type { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const PASSWORD_ENVIRONMENT_NAMES = [
  'BOOTSTRAP_ADMIN_PASSWORD',
  'SEED_ADMIN_PASSWORD',
  'P6_ADMIN_PASSWORD',
  'DEFAULT_ADMIN_SECRET',
] as const;

const USERNAME_ENVIRONMENT_NAMES = [
  'BOOTSTRAP_ADMIN_USERNAME',
  'SEED_ADMIN_USERNAME',
  'P6_ADMIN_USERNAME',
] as const;

const EMAIL_ENVIRONMENT_NAMES = [
  'BOOTSTRAP_ADMIN_EMAIL',
  'SEED_ADMIN_EMAIL',
  'P6_ADMIN_EMAIL',
] as const;

const PLACEHOLDER_SECRETS = new Set([
  'set_in_local_env',
  'change-me',
  'changeme',
  'replace-me',
  'replace_me',
]);

export type ProductionAdminBootstrapConfig = {
  username: string;
  email: string;
  password: string;
  passwordSource: string;
};

export type ProductionAdminBootstrapResult =
  | { status: 'existing'; adminCount: number }
  | { status: 'missing-config'; acceptedPasswordVariables: readonly string[] }
  | { status: 'created'; id: string; username: string; email: string; passwordSource: string };

type HashPassword = (password: string) => Promise<string>;

export function resolveProductionAdminBootstrapConfig(
  environment: NodeJS.ProcessEnv = process.env,
): ProductionAdminBootstrapConfig | null {
  const passwordEntry = firstEnvironmentValue(environment, PASSWORD_ENVIRONMENT_NAMES);
  if (!passwordEntry) return null;

  const password = passwordEntry.value;
  if (password.length < 12) {
    throw new Error(`${passwordEntry.name} must contain at least 12 characters`);
  }
  if (PLACEHOLDER_SECRETS.has(password.toLowerCase())) {
    throw new Error(`${passwordEntry.name} still contains a placeholder value`);
  }

  const username = firstEnvironmentValue(environment, USERNAME_ENVIRONMENT_NAMES)?.value ?? 'admin';
  if (!/^[A-Za-z0-9_.-]{3,50}$/.test(username)) {
    throw new Error('Bootstrap Admin username must be 3-50 characters using letters, numbers, dot, underscore, or hyphen');
  }

  const email = (
    firstEnvironmentValue(environment, EMAIL_ENVIRONMENT_NAMES)?.value
    ?? `${username}@platform.local`
  ).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Bootstrap Admin email must be a valid email address');
  }

  return {
    username,
    email,
    password,
    passwordSource: passwordEntry.name,
  };
}

export async function ensureProductionAdmin(
  prisma: PrismaClient,
  environment: NodeJS.ProcessEnv = process.env,
  hashPassword: HashPassword = (password) => argon2.hash(password),
): Promise<ProductionAdminBootstrapResult> {
  const adminCount = await prisma.adminUser.count();
  if (adminCount > 0) return { status: 'existing', adminCount };

  const config = resolveProductionAdminBootstrapConfig(environment);
  if (!config) {
    return {
      status: 'missing-config',
      acceptedPasswordVariables: PASSWORD_ENVIRONMENT_NAMES,
    };
  }

  const superAdminRole = await prisma.role.findUnique({
    where: { code: 'super_admin' },
    select: { id: true },
  });
  if (!superAdminRole) {
    throw new Error('Role super_admin does not exist before production Admin bootstrap');
  }

  const passwordHash = await hashPassword(config.password);

  try {
    const admin = await prisma.adminUser.create({
      data: {
        username: config.username,
        email: config.email,
        passwordHash,
        status: 'ACTIVE',
        twoFactorEnabled: false,
        roles: {
          create: {
            roleId: superAdminRole.id,
          },
        },
      },
      select: {
        id: true,
        username: true,
        email: true,
      },
    });

    return {
      status: 'created',
      ...admin,
      passwordSource: config.passwordSource,
    };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const concurrentAdminCount = await prisma.adminUser.count();
      if (concurrentAdminCount > 0) {
        return { status: 'existing', adminCount: concurrentAdminCount };
      }
    }
    throw error;
  }
}

function firstEnvironmentValue(
  environment: NodeJS.ProcessEnv,
  names: readonly string[],
) {
  for (const name of names) {
    const value = environment[name]?.trim();
    if (value) return { name, value };
  }
  return null;
}
