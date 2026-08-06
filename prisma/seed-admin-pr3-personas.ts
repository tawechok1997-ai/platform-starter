import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const prisma = new PrismaClient();

type PersonaDefinition = {
  id: 'finance' | 'deposit-withdrawal' | 'marketing' | 'manager' | 'system-admin' | 'multi-role' | 'explicit-deny';
  roleCodes: readonly string[];
  denyAll?: boolean;
};

const PERSONAS: readonly PersonaDefinition[] = [
  { id: 'finance', roleCodes: ['finance'] },
  { id: 'deposit-withdrawal', roleCodes: ['deposit_withdrawal'] },
  { id: 'marketing', roleCodes: ['marketing'] },
  { id: 'manager', roleCodes: ['manager'] },
  { id: 'system-admin', roleCodes: ['system_admin'] },
  { id: 'multi-role', roleCodes: ['finance', 'marketing'] },
  { id: 'explicit-deny', roleCodes: ['system_admin'], denyAll: true },
];

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function assertDisposableEnvironment() {
  if (process.env.PR3_ALLOW_DISPOSABLE_SEED !== 'true') {
    throw new Error('Refusing to seed PR-3 personas without PR3_ALLOW_DISPOSABLE_SEED=true');
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('PR-3 persona seed is forbidden in production');
  }
  const databaseUrl = required('DATABASE_URL');
  const hostname = new URL(databaseUrl).hostname.toLowerCase();
  const localHosts = new Set(['localhost', '127.0.0.1', '::1', 'postgres']);
  if (!localHosts.has(hostname)) {
    throw new Error(`PR-3 persona seed requires a disposable local database, received ${hostname}`);
  }
}

async function ensureWildcardPermission() {
  await prisma.permission.upsert({
    where: { code: '*' },
    update: { name: 'All permissions', module: 'system' },
    create: {
      code: '*',
      name: 'All permissions',
      module: 'system',
      description: 'Wildcard permission used only by protected administrator roles and access tests.',
    },
  });
}

async function seedPersona(persona: PersonaDefinition, passwordHash: string) {
  const slug = persona.id.replace(/[^a-z0-9]+/g, '-');
  const username = `pr3-${slug}`;
  const email = `${username}@example.test`;
  const roles = await prisma.role.findMany({
    where: { code: { in: [...persona.roleCodes] } },
    select: { id: true, code: true },
  });
  const missing = persona.roleCodes.filter((code) => !roles.some((role) => role.code === code));
  if (missing.length > 0) {
    throw new Error(`Missing PR-3 role templates for ${persona.id}: ${missing.join(', ')}`);
  }

  const admin = await prisma.adminUser.upsert({
    where: { email },
    update: {
      username,
      passwordHash,
      status: 'ACTIVE',
      twoFactorEnabled: false,
      twoFactorSecret: null,
      displayName: `PR-3 ${persona.id}`,
      position: persona.id,
      department: 'PR-3 Acceptance',
    },
    create: {
      username,
      email,
      passwordHash,
      status: 'ACTIVE',
      displayName: `PR-3 ${persona.id}`,
      position: persona.id,
      department: 'PR-3 Acceptance',
    },
  });

  await prisma.authSession.updateMany({
    where: { adminUserId: admin.id, type: 'ADMIN', revokedAt: null },
    data: { revokedAt: new Date() },
  });
  await prisma.adminUserRole.deleteMany({ where: { adminUserId: admin.id } });
  await prisma.adminUserRole.createMany({
    data: roles.map((role) => ({ adminUserId: admin.id, roleId: role.id })),
    skipDuplicates: true,
  });

  await prisma.$executeRawUnsafe(
    'DELETE FROM admin_permission_overrides WHERE admin_user_id = $1::uuid',
    admin.id,
  );
  if (persona.denyAll === true) {
    await prisma.$executeRawUnsafe(
      `INSERT INTO admin_permission_overrides (
        id, admin_user_id, permission_code, effect, reason, created_at, updated_at
      ) VALUES ($1::uuid, $2::uuid, '*', 'DENY', $3, NOW(), NOW())`,
      randomUUID(),
      admin.id,
      'PR-3 explicit DENY acceptance persona',
    );
  }

  return {
    persona: persona.id,
    username,
    email,
    roleCodes: persona.roleCodes,
    denyAll: persona.denyAll === true,
  };
}

async function main() {
  assertDisposableEnvironment();
  await ensureWildcardPermission();
  const password = required('PR3_PERSONA_PASSWORD');
  if (password.length < 16) throw new Error('PR3_PERSONA_PASSWORD must contain at least 16 characters');
  const passwordHash = await argon2.hash(password);
  const accounts = [];
  for (const persona of PERSONAS) accounts.push(await seedPersona(persona, passwordHash));

  const manifestPath = resolve(process.env.PR3_PERSONA_MANIFEST ?? 'test-results/admin-pr3/personas.json');
  await mkdir(dirname(manifestPath), { recursive: true });
  await writeFile(
    manifestPath,
    `${JSON.stringify({ generatedAt: new Date().toISOString(), accounts }, null, 2)}\n`,
    { encoding: 'utf8', mode: 0o600 },
  );
  console.log(`Seeded ${accounts.length} disposable PR-3 Admin personas.`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
