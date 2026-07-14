import { Prisma } from '@prisma/client';
import type {
  KycReviewRecord,
  KycWatchlistRepositoryPort,
  PromotionSettlementRecord,
  PromotionSettlementRepositoryPort,
  WatchlistEntryRecord,
} from '../application/critical-repository-ports';

type KycRow = Record<string, unknown> & {
  id: string;
  member_id: string;
  status: string;
  version: number;
  review_note: string | null;
  reviewed_by_admin_id: string | null;
  reviewed_at: Date | null;
  deleted_at?: Date | null;
  updated_at: Date;
};

type WatchlistRow = Record<string, unknown> & {
  id: string;
  member_id: string | null;
  status: string;
  version: number;
  list_type: string;
  subject_type: string;
  released_by_admin_id: string | null;
  released_at: Date | null;
  release_reason: string | null;
  updated_at: Date;
};

type BonusRow = {
  id: string;
  source_risk_alert_id: string;
  member_id: string;
  wallet_ledger_id: string | null;
  status: string;
  amount: Prisma.Decimal;
  currency: string;
  settlement_idempotency_key: string | null;
  released_by_admin_id: string | null;
  released_at: Date | null;
  updated_at: Date;
};

export class PrismaKycWatchlistRepositoryAdapter implements KycWatchlistRepositoryPort {
  constructor(private readonly tx: Prisma.TransactionClient) {}

  async findKycDocumentForUpdate(id: string): Promise<KycReviewRecord | null> {
    const rows = await this.tx.$queryRaw<KycRow[]>(Prisma.sql`
      SELECT * FROM "kyc_documents" WHERE "id" = ${id}::uuid FOR UPDATE
    `);
    return rows[0] ? mapKyc(rows[0]) : null;
  }

  async findKycCaseForUpdate(id: string): Promise<KycReviewRecord | null> {
    const rows = await this.tx.$queryRaw<KycRow[]>(Prisma.sql`
      SELECT * FROM "kyc_cases" WHERE "id" = ${id}::uuid FOR UPDATE
    `);
    return rows[0] ? mapKyc(rows[0]) : null;
  }

  async saveKycDocumentReview(record: KycReviewRecord): Promise<KycReviewRecord | null> {
    const rows = await this.tx.$queryRaw<KycRow[]>(Prisma.sql`
      UPDATE "kyc_documents"
      SET "status" = ${record.status},
          "review_note" = ${record.reviewNote ?? null},
          "reviewed_by_admin_id" = ${record.reviewedBy ?? null}::uuid,
          "reviewed_at" = ${record.reviewedAt ?? null},
          "version" = "version" + 1,
          "updated_at" = CURRENT_TIMESTAMP
      WHERE "id" = ${record.id}::uuid AND "version" = ${record.version}
      RETURNING *
    `);
    return rows[0] ? mapKyc(rows[0]) : null;
  }

  async saveKycCaseReview(record: KycReviewRecord): Promise<KycReviewRecord | null> {
    const rows = await this.tx.$queryRaw<KycRow[]>(Prisma.sql`
      UPDATE "kyc_cases"
      SET "status" = ${record.status},
          "review_note" = ${record.reviewNote ?? null},
          "reviewed_by_admin_id" = ${record.reviewedBy ?? null}::uuid,
          "reviewed_at" = ${record.reviewedAt ?? null},
          "version" = "version" + 1,
          "updated_at" = CURRENT_TIMESTAMP
      WHERE "id" = ${record.id}::uuid AND "version" = ${record.version}
      RETURNING *
    `);
    return rows[0] ? mapKyc(rows[0]) : null;
  }

  async countUnacceptedKycDocuments(caseId: string): Promise<number> {
    const rows = await this.tx.$queryRaw<Array<{ count: bigint }>>(Prisma.sql`
      SELECT COUNT(*)::bigint AS count
      FROM "kyc_documents"
      WHERE "case_id" = ${caseId}::uuid
        AND "deleted_at" IS NULL
        AND "status" <> 'ACCEPTED'
    `);
    return Number(rows[0]?.count ?? 0);
  }

  async findWatchlistEntryForUpdate(id: string): Promise<WatchlistEntryRecord | null> {
    const rows = await this.tx.$queryRaw<WatchlistRow[]>(Prisma.sql`
      SELECT * FROM "risk_watchlist_entries" WHERE "id" = ${id}::uuid FOR UPDATE
    `);
    return rows[0] ? mapWatchlist(rows[0]) : null;
  }

  async saveWatchlistEntry(record: WatchlistEntryRecord): Promise<WatchlistEntryRecord | null> {
    const rows = await this.tx.$queryRaw<WatchlistRow[]>(Prisma.sql`
      UPDATE "risk_watchlist_entries"
      SET "status" = ${record.status},
          "released_by_admin_id" = ${record.releasedBy ?? null}::uuid,
          "released_at" = ${record.releasedAt ?? null},
          "release_reason" = ${record.releaseReason ?? null},
          "version" = "version" + 1,
          "updated_at" = CURRENT_TIMESTAMP
      WHERE "id" = ${record.id}::uuid AND "version" = ${record.version}
      RETURNING *
    `);
    return rows[0] ? mapWatchlist(rows[0]) : null;
  }
}

export class PrismaPromotionSettlementRepositoryAdapter implements PromotionSettlementRepositoryPort {
  constructor(private readonly tx: Prisma.TransactionClient) {}

  async findBySourceRiskAlertIdForUpdate(id: string): Promise<PromotionSettlementRecord | null> {
    const rows = await this.tx.$queryRaw<BonusRow[]>(Prisma.sql`
      SELECT * FROM "bonus_ledgers"
      WHERE "source_risk_alert_id" = ${id}::uuid
      FOR UPDATE
    `);
    return rows[0] ? mapBonus(rows[0]) : null;
  }

  async findByIdempotencyKey(key: string): Promise<PromotionSettlementRecord | null> {
    const rows = await this.tx.$queryRaw<BonusRow[]>(Prisma.sql`
      SELECT * FROM "bonus_ledgers"
      WHERE "settlement_idempotency_key" = ${key}
      LIMIT 1
    `);
    return rows[0] ? mapBonus(rows[0]) : null;
  }

  async save(record: PromotionSettlementRecord): Promise<void> {
    await this.tx.$executeRaw(Prisma.sql`
      UPDATE "bonus_ledgers"
      SET "status" = ${record.status},
          "wallet_ledger_id" = ${record.walletLedgerId ?? null}::uuid,
          "settlement_idempotency_key" = ${record.idempotencyKey ?? null},
          "released_by_admin_id" = ${record.releasedBy ?? null}::uuid,
          "released_at" = ${record.releasedAt ?? null},
          "updated_at" = CURRENT_TIMESTAMP
      WHERE "id" = ${record.id}::uuid
    `);
  }
}

function mapKyc(row: KycRow): KycReviewRecord {
  return {
    id: row.id,
    memberId: row.member_id,
    status: row.status,
    version: Number(row.version),
    reviewNote: row.review_note,
    reviewedBy: row.reviewed_by_admin_id,
    reviewedAt: row.reviewed_at,
    deletedAt: row.deleted_at ?? null,
    updatedAt: row.updated_at,
    view: { ...row },
  };
}

function mapWatchlist(row: WatchlistRow): WatchlistEntryRecord {
  return {
    id: row.id,
    memberId: row.member_id,
    status: row.status,
    version: Number(row.version),
    listType: row.list_type,
    subjectType: row.subject_type,
    releasedBy: row.released_by_admin_id,
    releasedAt: row.released_at,
    releaseReason: row.release_reason,
    updatedAt: row.updated_at,
    view: { ...row },
  };
}

function mapBonus(row: BonusRow): PromotionSettlementRecord {
  return {
    id: row.id,
    sourceRiskAlertId: row.source_risk_alert_id,
    userId: row.member_id,
    walletLedgerId: row.wallet_ledger_id,
    status: row.status,
    amount: { amount: row.amount.toString(), currency: row.currency },
    idempotencyKey: row.settlement_idempotency_key,
    releasedBy: row.released_by_admin_id,
    releasedAt: row.released_at,
    updatedAt: row.updated_at,
  };
}