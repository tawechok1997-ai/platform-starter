import { Prisma } from '@prisma/client';

type TransactionClient = Prisma.TransactionClient;

type LockedIdRow = { id: string };

async function lockSingleRowByUuid(
  tx: TransactionClient,
  table: 'top_up_requests' | 'withdrawal_requests' | 'admin_users',
  id: string,
): Promise<string | null> {
  const rows = await tx.$queryRaw<LockedIdRow[]>(Prisma.sql`
    SELECT "id"
    FROM ${Prisma.raw(`"${table}"`)}
    WHERE "id" = ${id}::uuid
    FOR UPDATE
  `);

  return rows[0]?.id ?? null;
}

export function lockTopUpRequestForUpdate(tx: TransactionClient, id: string): Promise<string | null> {
  return lockSingleRowByUuid(tx, 'top_up_requests', id);
}

export function lockWithdrawalRequestForUpdate(tx: TransactionClient, id: string): Promise<string | null> {
  return lockSingleRowByUuid(tx, 'withdrawal_requests', id);
}

export function lockAdminUserForUpdate(tx: TransactionClient, id: string): Promise<string | null> {
  return lockSingleRowByUuid(tx, 'admin_users', id);
}

export async function lockWalletForUpdateByUserId(tx: TransactionClient, userId: string): Promise<string | null> {
  const rows = await tx.$queryRaw<LockedIdRow[]>(Prisma.sql`
    SELECT "id"
    FROM "wallets"
    WHERE "user_id" = ${userId}::uuid
    FOR UPDATE
  `);

  return rows[0]?.id ?? null;
}

export async function lockActiveOwnerAdminIds(tx: TransactionClient, ownerRoleCode: string): Promise<string[]> {
  const rows = await tx.$queryRaw<LockedIdRow[]>(Prisma.sql`
    SELECT DISTINCT au."id"
    FROM "admin_users" au
    INNER JOIN "admin_user_roles" aur ON aur."admin_user_id" = au."id"
    INNER JOIN "roles" r ON r."id" = aur."role_id"
    WHERE r."code" = ${ownerRoleCode}
      AND au."status"::text = 'ACTIVE'
    ORDER BY au."id"
    FOR UPDATE OF au
  `);

  return rows.map((row) => row.id);
}
