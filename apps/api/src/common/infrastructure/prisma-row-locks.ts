import { Prisma } from '@prisma/client';

type TransactionClient = Prisma.TransactionClient;

type LockedIdRow = { id: string };

export type LockedWithdrawalSnapshot = {
  id: string;
  status: string;
  userId: string;
  amount: Prisma.Decimal;
  claimedBy: string | null;
  claimedAt: Date | null;
};

export type LockedWalletSnapshot = {
  id: string;
  userId: string;
  currency: string;
  status: string;
  balance: Prisma.Decimal;
  lockedBalance: Prisma.Decimal;
};

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

export async function lockWithdrawalSnapshotForUpdate(
  tx: TransactionClient,
  id: string,
): Promise<LockedWithdrawalSnapshot | null> {
  const rows = await tx.$queryRaw<Array<{
    id: string;
    status: string;
    user_id: string;
    amount: Prisma.Decimal;
    claimed_by: string | null;
    claimed_at: Date | null;
  }>>(Prisma.sql`
    SELECT
      "id",
      "status"::text AS "status",
      "user_id",
      "amount",
      "claimed_by",
      "claimed_at"
    FROM "withdrawal_requests"
    WHERE "id" = ${id}::uuid
    FOR UPDATE
  `);

  const row = rows[0];
  if (!row) return null;

  return {
    id: row.id,
    status: row.status,
    userId: row.user_id,
    amount: row.amount,
    claimedBy: row.claimed_by,
    claimedAt: row.claimed_at,
  };
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

export async function lockWalletSnapshotForUpdateByUserId(
  tx: TransactionClient,
  userId: string,
): Promise<LockedWalletSnapshot | null> {
  const rows = await tx.$queryRaw<Array<{
    id: string;
    user_id: string;
    currency: string;
    status: string;
    balance: Prisma.Decimal;
    locked_balance: Prisma.Decimal;
  }>>(Prisma.sql`
    SELECT
      "id",
      "user_id",
      "currency",
      "status"::text AS "status",
      "balance",
      "locked_balance"
    FROM "wallets"
    WHERE "user_id" = ${userId}::uuid
    FOR UPDATE
  `);

  const row = rows[0];
  if (!row) return null;

  return {
    id: row.id,
    userId: row.user_id,
    currency: row.currency,
    status: row.status,
    balance: row.balance,
    lockedBalance: row.locked_balance,
  };
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
