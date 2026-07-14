import { Prisma } from '@prisma/client';
import type {
  AdminOwnershipRepositoryPort,
  OwnershipRecord,
  RepositoryId,
} from '../application/critical-repository-ports';

const OWNER_ROLE_CODE = 'OWNER';

type LockedAdminRow = {
  id: string;
  status: string;
  is_owner: boolean;
};

/**
 * Transaction-scoped adapter for ownership transfer persistence.
 *
 * The caller owns the Prisma transaction. This adapter never opens a nested
 * transaction and never exposes Prisma records through its public contract.
 */
export class PrismaAdminOwnershipRepositoryAdapter implements AdminOwnershipRepositoryPort {
  constructor(private readonly tx: Prisma.TransactionClient) {}

  async findAdminForUpdate(adminUserId: RepositoryId): Promise<OwnershipRecord | null> {
    const rows = await this.tx.$queryRaw<LockedAdminRow[]>(Prisma.sql`
      SELECT
        au."id",
        au."status"::text AS "status",
        EXISTS (
          SELECT 1
          FROM "admin_user_roles" aur
          INNER JOIN "roles" r ON r."id" = aur."role_id"
          WHERE aur."admin_user_id" = au."id"
            AND r."code" = ${OWNER_ROLE_CODE}
        ) AS "is_owner"
      FROM "admin_users" au
      WHERE au."id" = ${adminUserId}::uuid
      FOR UPDATE
    `);

    const row = rows[0];
    if (!row) return null;

    return {
      adminUserId: row.id,
      isOwner: row.is_owner,
      status: row.status,
    };
  }

  async countActiveOwnersForUpdate(): Promise<number> {
    const rows = await this.tx.$queryRaw<Array<{ count: bigint }>>(Prisma.sql`
      SELECT COUNT(DISTINCT au."id")::bigint AS "count"
      FROM "admin_users" au
      INNER JOIN "admin_user_roles" aur ON aur."admin_user_id" = au."id"
      INNER JOIN "roles" r ON r."id" = aur."role_id"
      WHERE r."code" = ${OWNER_ROLE_CODE}
        AND au."status"::text = 'ACTIVE'
      FOR UPDATE OF au
    `);

    return Number(rows[0]?.count ?? 0n);
  }

  async transferOwnership(previousOwnerId: RepositoryId, nextOwnerId: RepositoryId): Promise<void> {
    const ownerRole = await this.tx.role.findUnique({
      where: { code: OWNER_ROLE_CODE },
      select: { id: true },
    });

    if (!ownerRole) throw new Error('OWNER role is not configured');

    await this.tx.adminUserRole.deleteMany({
      where: { adminUserId: previousOwnerId, roleId: ownerRole.id },
    });

    await this.tx.adminUserRole.upsert({
      where: {
        adminUserId_roleId: {
          adminUserId: nextOwnerId,
          roleId: ownerRole.id,
        },
      },
      create: { adminUserId: nextOwnerId, roleId: ownerRole.id },
      update: {},
    });
  }
}
