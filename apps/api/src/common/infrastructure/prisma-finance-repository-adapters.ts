import { Prisma } from '@prisma/client';
import type {
  DepositRecord,
  DepositRepositoryPort,
  WithdrawalRecord,
  WithdrawalRepositoryPort,
} from '../application/critical-repository-ports';
import {
  lockTopUpRequestForUpdate,
  lockWithdrawalRequestForUpdate,
} from './prisma-row-locks';

/**
 * Transaction-scoped Prisma adapters for finance write flows.
 *
 * The caller owns the Prisma transaction and passes its TransactionClient here.
 * This prevents adapters from silently opening nested or disconnected transactions.
 */
export class PrismaDepositRepositoryAdapter implements DepositRepositoryPort {
  constructor(private readonly tx: Prisma.TransactionClient) {}

  async findByIdForUpdate(id: string): Promise<DepositRecord | null> {
    const lockedId = await lockTopUpRequestForUpdate(this.tx, id);
    if (!lockedId) return null;

    const record = await this.tx.topUpRequest.findUnique({ where: { id: lockedId } });
    return record ? mapDeposit(record) : null;
  }

  async findByIdempotencyKey(key: string): Promise<DepositRecord | null> {
    const record = await this.tx.topUpRequest.findUnique({ where: { idempotencyKey: key } });
    return record ? mapDeposit(record) : null;
  }

  async save(record: DepositRecord): Promise<void> {
    await this.tx.topUpRequest.update({
      where: { id: record.id },
      data: {
        status: record.status as never,
        amount: new Prisma.Decimal(record.amount.amount),
        currency: record.amount.currency,
        idempotencyKey: record.idempotencyKey ?? null,
      },
    });
  }
}

export class PrismaWithdrawalRepositoryAdapter implements WithdrawalRepositoryPort {
  constructor(private readonly tx: Prisma.TransactionClient) {}

  async findByIdForUpdate(id: string): Promise<WithdrawalRecord | null> {
    const lockedId = await lockWithdrawalRequestForUpdate(this.tx, id);
    if (!lockedId) return null;

    const record = await this.tx.withdrawalRequest.findUnique({ where: { id: lockedId } });
    return record ? mapWithdrawal(record) : null;
  }

  async findByIdempotencyKey(key: string): Promise<WithdrawalRecord | null> {
    const record = await this.tx.withdrawalRequest.findUnique({ where: { idempotencyKey: key } });
    return record ? mapWithdrawal(record) : null;
  }

  async save(record: WithdrawalRecord): Promise<void> {
    await this.tx.withdrawalRequest.update({
      where: { id: record.id },
      data: {
        status: record.status as never,
        amount: new Prisma.Decimal(record.amount.amount),
        currency: record.amount.currency,
        claimedBy: record.claimedBy ?? null,
        idempotencyKey: record.idempotencyKey ?? null,
      },
    });
  }
}

type DepositPrismaRecord = {
  id: string;
  userId: string;
  status: string;
  amount: Prisma.Decimal;
  currency: string;
  idempotencyKey: string | null;
  updatedAt: Date;
};

function mapDeposit(record: DepositPrismaRecord): DepositRecord {
  return {
    id: record.id,
    userId: record.userId,
    status: record.status,
    amount: { amount: record.amount.toString(), currency: record.currency },
    idempotencyKey: record.idempotencyKey,
    updatedAt: record.updatedAt,
  };
}

type WithdrawalPrismaRecord = {
  id: string;
  userId: string;
  status: string;
  amount: Prisma.Decimal;
  currency: string;
  claimedBy: string | null;
  idempotencyKey: string | null;
  updatedAt: Date;
};

function mapWithdrawal(record: WithdrawalPrismaRecord): WithdrawalRecord {
  return {
    id: record.id,
    userId: record.userId,
    status: record.status,
    amount: { amount: record.amount.toString(), currency: record.currency },
    claimedBy: record.claimedBy,
    idempotencyKey: record.idempotencyKey,
    updatedAt: record.updatedAt,
  };
}
