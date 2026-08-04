import { PrismaClient } from '@prisma/client';
import { ensureProductionAdmin } from '../apps/api/src/modules/admin-auth/production-admin-bootstrap';

const prisma = new PrismaClient();

async function main() {
  const result = await ensureProductionAdmin(prisma);

  if (result.status === 'existing') {
    console.log(`[auth-bootstrap] Admin bootstrap skipped; ${result.adminCount} Admin account(s) already exist.`);
    return;
  }

  if (result.status === 'missing-config') {
    console.warn('[auth-bootstrap] No Admin account exists and no secure bootstrap password is configured.');
    console.warn(`[auth-bootstrap] Set one of: ${result.acceptedPasswordVariables.join(', ')}`);
    console.warn('[auth-bootstrap] Optional identity variables: BOOTSTRAP_ADMIN_USERNAME and BOOTSTRAP_ADMIN_EMAIL.');
    return;
  }

  console.warn(`[auth-bootstrap] Created first Super Admin ${result.username} (${result.email}).`);
  console.warn(`[auth-bootstrap] Password was read from ${result.passwordSource}; its value was not written to logs.`);
}

main()
  .catch((error) => {
    console.error('[auth-bootstrap] Failed to prepare the first production Admin account.');
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
