import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

type CreatePromotionClaimInput = {
  id: string;
  memberId: string;
  campaignId: string;
  topUpRequestId?: string | null;
  sourceRiskAlertId?: string | null;
  depositAmount: Prisma.Decimal | number | string;
  bonusAmount: Prisma.Decimal | number | string;
  memberNote?: string | null;
};

type CreateBonusLedgerInput = {
  id: string;
  promotionClaimId: string;
  memberId: string;
  sourceRiskAlertId?: string | null;
  amount: Prisma.Decimal | number | string;
  currency?: string;
  turnoverRequired: Prisma.Decimal | number | string;
};

@Injectable()
export class PromotionDomainRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createClaim(input: CreatePromotionClaimInput) {
    const rows = await this.prisma.$queryRaw<Array<Record<string, unknown>>>(Prisma.sql`
      INSERT INTO "promotion_claims" (
        "id", "member_id", "campaign_id", "top_up_request_id", "source_risk_alert_id",
        "deposit_amount", "bonus_amount", "status", "member_note", "updated_at"
      ) VALUES (
        ${input.id}::uuid, ${input.memberId}::uuid, ${input.campaignId},
        ${input.topUpRequestId ?? null}::uuid, ${input.sourceRiskAlertId ?? null}::uuid,
        ${new Prisma.Decimal(input.depositAmount)}::numeric,
        ${new Prisma.Decimal(input.bonusAmount)}::numeric,
        'PENDING', ${input.memberNote ?? null}, CURRENT_TIMESTAMP
      )
      ON CONFLICT ("source_risk_alert_id") DO UPDATE SET
        "campaign_id" = EXCLUDED."campaign_id",
        "top_up_request_id" = EXCLUDED."top_up_request_id",
        "deposit_amount" = EXCLUDED."deposit_amount",
        "bonus_amount" = EXCLUDED."bonus_amount",
        "member_note" = EXCLUDED."member_note",
        "updated_at" = CURRENT_TIMESTAMP
      RETURNING *
    `);
    return rows[0] ?? null;
  }

  async markClaimReviewed(input: {
    sourceRiskAlertId: string;
    status: 'REVIEWING' | 'APPROVED' | 'REJECTED';
    adminUserId: string;
    adminNote?: string | null;
  }) {
    const rows = await this.prisma.$queryRaw<Array<Record<string, unknown>>>(Prisma.sql`
      UPDATE "promotion_claims"
      SET "status" = ${input.status},
          "admin_note" = ${input.adminNote ?? null},
          "reviewed_by_admin_id" = ${input.adminUserId}::uuid,
          "reviewed_at" = CURRENT_TIMESTAMP,
          "updated_at" = CURRENT_TIMESTAMP
      WHERE "source_risk_alert_id" = ${input.sourceRiskAlertId}::uuid
      RETURNING *
    `);
    return rows[0] ?? null;
  }

  async createBonusLedger(input: CreateBonusLedgerInput) {
    const rows = await this.prisma.$queryRaw<Array<Record<string, unknown>>>(Prisma.sql`
      INSERT INTO "bonus_ledgers" (
        "id", "promotion_claim_id", "member_id", "source_risk_alert_id", "amount",
        "currency", "turnover_required", "turnover_progress", "status", "updated_at"
      ) VALUES (
        ${input.id}::uuid, ${input.promotionClaimId}::uuid, ${input.memberId}::uuid,
        ${input.sourceRiskAlertId ?? null}::uuid, ${new Prisma.Decimal(input.amount)}::numeric,
        ${input.currency ?? 'THB'}, ${new Prisma.Decimal(input.turnoverRequired)}::numeric, 0,
        CASE WHEN ${new Prisma.Decimal(input.turnoverRequired)}::numeric <= 0 THEN 'TURNOVER_COMPLETED' ELSE 'ACTIVE' END,
        CURRENT_TIMESTAMP
      )
      ON CONFLICT ("promotion_claim_id") DO UPDATE SET
        "source_risk_alert_id" = EXCLUDED."source_risk_alert_id",
        "amount" = EXCLUDED."amount",
        "currency" = EXCLUDED."currency",
        "turnover_required" = EXCLUDED."turnover_required",
        "updated_at" = CURRENT_TIMESTAMP
      RETURNING *
    `);
    return rows[0] ?? null;
  }

  async addTurnover(sourceRiskAlertId: string, amount: Prisma.Decimal | number | string) {
    const delta = new Prisma.Decimal(amount);
    const rows = await this.prisma.$queryRaw<Array<Record<string, unknown>>>(Prisma.sql`
      UPDATE "bonus_ledgers"
      SET "turnover_progress" = LEAST("turnover_progress" + ${delta}::numeric, "turnover_required"),
          "status" = CASE
            WHEN "turnover_progress" + ${delta}::numeric >= "turnover_required" THEN 'TURNOVER_COMPLETED'
            ELSE "status"
          END,
          "updated_at" = CURRENT_TIMESTAMP
      WHERE "source_risk_alert_id" = ${sourceRiskAlertId}::uuid
        AND "status" NOT IN ('SETTLED', 'EXPIRED', 'REVOKED')
      RETURNING *
    `);
    return rows[0] ?? null;
  }

  async updateLifecycle(sourceRiskAlertId: string, action: 'RELEASE' | 'EXPIRE' | 'REVOKE') {
    const nextStatus = action === 'RELEASE' ? 'RELEASE_READY' : action === 'EXPIRE' ? 'EXPIRED' : 'REVOKED';
    const rows = await this.prisma.$queryRaw<Array<Record<string, unknown>>>(Prisma.sql`
      UPDATE "bonus_ledgers"
      SET "status" = ${nextStatus}, "updated_at" = CURRENT_TIMESTAMP
      WHERE "source_risk_alert_id" = ${sourceRiskAlertId}::uuid
        AND "status" NOT IN ('SETTLED', 'EXPIRED', 'REVOKED')
        AND (${action} <> 'RELEASE' OR "turnover_progress" >= "turnover_required")
      RETURNING *
    `);
    return rows[0] ?? null;
  }

  async settleBonus(input: { sourceRiskAlertId: string; adminUserId: string; idempotencyKey: string }) {
    return this.prisma.$transaction(async (tx) => {
      const bonusRows = await tx.$queryRaw<Array<any>>(Prisma.sql`
        SELECT * FROM "bonus_ledgers"
        WHERE "source_risk_alert_id" = ${input.sourceRiskAlertId}::uuid
        FOR UPDATE
      `);
      const bonus = bonusRows[0];
      if (!bonus) throw new NotFoundException('Bonus ledger not found');
      if (bonus.status === 'SETTLED') return bonus;
      if (!['TURNOVER_COMPLETED', 'RELEASE_READY'].includes(bonus.status)) {
        throw new BadRequestException('Bonus is not ready for settlement');
      }

      const walletRows = await tx.$queryRaw<Array<any>>(Prisma.sql`
        SELECT * FROM "wallets" WHERE "user_id" = ${bonus.member_id}::uuid FOR UPDATE
      `);
      const wallet = walletRows[0];
      if (!wallet || wallet.status !== 'ACTIVE') throw new BadRequestException('Active wallet not found');

      const existing = await tx.$queryRaw<Array<any>>(Prisma.sql`
        SELECT * FROM "wallet_ledgers" WHERE "idempotency_key" = ${input.idempotencyKey} LIMIT 1
      `);
      if (existing[0]) {
        await tx.$executeRaw(Prisma.sql`
          UPDATE "bonus_ledgers"
          SET "status" = 'SETTLED', "wallet_ledger_id" = ${existing[0].id}::uuid,
              "settlement_idempotency_key" = ${input.idempotencyKey},
              "released_by_admin_id" = ${input.adminUserId}::uuid,
              "released_at" = COALESCE("released_at", CURRENT_TIMESTAMP), "updated_at" = CURRENT_TIMESTAMP
          WHERE "id" = ${bonus.id}::uuid
        `);
        return { ...bonus, status: 'SETTLED', wallet_ledger_id: existing[0].id };
      }

      const ledgerIdRows = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`SELECT gen_random_uuid()::text AS id`);
      const ledgerId = ledgerIdRows[0].id;
      const before = new Prisma.Decimal(wallet.balance);
      const amount = new Prisma.Decimal(bonus.amount);
      const after = before.add(amount);

      await tx.$executeRaw(Prisma.sql`
        UPDATE "wallets" SET "balance" = ${after}::numeric, "updated_at" = CURRENT_TIMESTAMP
        WHERE "id" = ${wallet.id}::uuid
      `);
      await tx.$executeRaw(Prisma.sql`
        INSERT INTO "wallet_ledgers" (
          "id", "wallet_id", "user_id", "type", "direction", "amount",
          "balance_before", "balance_after", "reference_type", "reference_id",
          "idempotency_key", "created_by_admin_id", "created_at"
        ) VALUES (
          ${ledgerId}::uuid, ${wallet.id}::uuid, ${bonus.member_id}::uuid, 'BONUS', 'CREDIT',
          ${amount}::numeric, ${before}::numeric, ${after}::numeric, 'BONUS_LEDGER', ${bonus.id}::text,
          ${input.idempotencyKey}, ${input.adminUserId}::uuid, CURRENT_TIMESTAMP
        )
      `);
      const settledRows = await tx.$queryRaw<Array<Record<string, unknown>>>(Prisma.sql`
        UPDATE "bonus_ledgers"
        SET "status" = 'SETTLED', "wallet_ledger_id" = ${ledgerId}::uuid,
            "settlement_idempotency_key" = ${input.idempotencyKey},
            "released_by_admin_id" = ${input.adminUserId}::uuid,
            "released_at" = CURRENT_TIMESTAMP, "updated_at" = CURRENT_TIMESTAMP
        WHERE "id" = ${bonus.id}::uuid
        RETURNING *
      `);
      return settledRows[0];
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }
}
