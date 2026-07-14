import { Prisma } from '@prisma/client';
import type {
  AdminOwnershipRepositoryPort,
  OwnershipRecord,
  RepositoryId,
} from '../application/critical-repository-ports';
import {
  lockActiveOwnerAdminIds,
  lockAdminUserForUpdate,
} from './prisma-row-locks';

const OWNER_ROLE_CODE = 'OWNER';

/**
 * Transaction-scoped adapter for ownership transfer persistence.
 *
 * The caller owns the Prisma transaction. This adapter never opens a nested
 * transaction and never exposes Prisma records through its public contract.
 */
export class PrismaAdminOwnershipRepositoryAdapter implements AdminOwnershipRepositoryPort {
  constructor(private readonly tx: Prisma.TransactionClient) {}

  async findAdminForUpdate(adminUserId: RepositoryId): Promise<OwnershipRecord | null> {
    const lockedId = await lockAdminUserForUpdate(this.tx, adminUserId);
    if (!lockedId) return null;

    const admin = await this.tx.adminUser.findUnique({
      where: { id: lockedId },
      select: {
        id: true,
        status: true,
        roles: {
          where: { role: { code: OWNER_ROLE_CODE } },
          select: { roleId: true },
          take: 1,
        },
      },
    });

    if (!admin) return null;

    return {
      adminUserId: admin.id,
      isOwner: admin.roles.length > 0,
      status: admin.status,
    };
  }

  async countActiveOwnersForUpdate(): Promise<number> {
    const ownerIds = await lockActiveOwnerAdminIds(this.tx, OWNER_ROLE_CODE);
    return ownerIds.length;
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
