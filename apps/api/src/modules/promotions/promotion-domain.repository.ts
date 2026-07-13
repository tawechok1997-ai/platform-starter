import { Injectable } from '@nestjs/common';
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
        ${input.id}::uuid,
        ${input.memberId}::uuid,
        ${input.campaignId},
        ${input.topUpRequestId ?? null}::uuid,
        ${input.sourceRiskAlertId ?? null}::uuid,
        ${new Prisma.Decimal(input.depositAmount)}::numeric,
        ${new Prisma.Decimal(input.bonusAmount)}::numeric,
        'PENDING',
        ${input.memberNote ?? null},
        CURRENT_TIMESTAMP
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
      SET
        "status" = ${input.status},
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
        ${input.id}::uuid,
        ${input.promotionClaimId}::uuid,
        ${input.memberId}::uuid,
        ${input.sourceRiskAlertId ?? null}::uuid,
        ${new Prisma.Decimal(input.amount)}::numeric,
        ${input.currency ?? 'THB'},
        ${new Prisma.Decimal(input.turnoverRequired)}::numeric,
        0,
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
      SET
        "turnover_progress" = LEAST("turnover_progress" + ${delta}::numeric, "turnover_required"),
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
}
