import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import type { AuthenticatedAdminActor } from '../../common/actors';
import { buildAdminAuditData } from '../../common/audit/admin-audit.builder';
import { PrismaService } from '../../database/prisma.service';
import type { ActivityRewardType } from './activity-config';

export type ActivityProgressRow = {
  activity_code: string;
  rule_code: string;
  period_key: string;
  progress: Prisma.Decimal | number | string;
  target: Prisma.Decimal | number | string;
  status: string;
  metadata: unknown;
  created_at: Date;
  updated_at: Date;
};

export type ActivityClaimRow = {
  id: string;
  member_id: string;
  activity_code: string;
  reward_code: string;
  period_key: string;
  reward_type: ActivityRewardType;
  amount: Prisma.Decimal | number | string;
  status: string;
  wallet_ledger_id: string | null;
  metadata: unknown;
  claimed_at: Date;
  created_at: Date;
};

@Injectable()
export class ActivityRepository {
  constructor(private readonly prisma: PrismaService) {}

  async insertMetric(input: {
    memberId: string;
    metricCode: string;
    category?: string | null;
    value: number;
    sourceType: string;
    sourceId?: string | null;
    idempotencyKey: string;
    occurredAt?: Date;
    metadata?: Record<string, unknown>;
  }) {
    const rows = await this.prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      INSERT INTO "activity_metric_events" (
        "id", "member_id", "metric_code", "category", "value", "source_type",
        "source_id", "idempotency_key", "occurred_at", "metadata", "created_at"
      ) VALUES (
        ${randomUUID()}::uuid, ${input.memberId}::uuid, ${input.metricCode}, ${input.category ?? null},
        ${new Prisma.Decimal(input.value)}::numeric, ${input.sourceType}, ${input.sourceId ?? null},
        ${input.idempotencyKey}, ${input.occurredAt ?? new Date()},
        ${JSON.stringify(input.metadata ?? {})}::jsonb, CURRENT_TIMESTAMP
      )
      ON CONFLICT ("idempotency_key") DO NOTHING
      RETURNING "id"::text
    `);
    return rows[0]?.id ?? null;
  }

  async upsertProgress(input: {
    memberId: string;
    activityCode: string;
    ruleCode: string;
    periodKey: string;
    delta: number;
    target: number;
    metadata?: Record<string, unknown>;
  }) {
    const rows = await this.prisma.$queryRaw<ActivityProgressRow[]>(Prisma.sql`
      INSERT INTO "member_activity_progress" (
        "id", "member_id", "activity_code", "rule_code", "period_key",
        "progress", "target", "status", "metadata", "created_at", "updated_at"
      ) VALUES (
        ${randomUUID()}::uuid, ${input.memberId}::uuid, ${input.activityCode}, ${input.ruleCode},
        ${input.periodKey}, ${new Prisma.Decimal(input.delta)}::numeric,
        ${new Prisma.Decimal(input.target)}::numeric,
        CASE WHEN ${new Prisma.Decimal(input.delta)}::numeric >= ${new Prisma.Decimal(input.target)}::numeric
          THEN 'COMPLETED' ELSE 'IN_PROGRESS' END,
        ${JSON.stringify(input.metadata ?? {})}::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
      ON CONFLICT ("member_id", "activity_code", "rule_code", "period_key") DO UPDATE SET
        "progress" = GREATEST(0, "member_activity_progress"."progress" + EXCLUDED."progress"),
        "target" = EXCLUDED."target",
        "status" = CASE
          WHEN GREATEST(0, "member_activity_progress"."progress" + EXCLUDED."progress") >= EXCLUDED."target"
            THEN 'COMPLETED'
          ELSE 'IN_PROGRESS'
        END,
        "metadata" = COALESCE("member_activity_progress"."metadata", '{}'::jsonb) || EXCLUDED."metadata",
        "updated_at" = CURRENT_TIMESTAMP
      RETURNING *
    `);
    return rows[0] ?? null;
  }

  async getProgress(memberId: string, activityCode: string, ruleCode: string, periodKey: string) {
    const rows = await this.prisma.$queryRaw<ActivityProgressRow[]>(Prisma.sql`
      SELECT * FROM "member_activity_progress"
      WHERE "member_id" = ${memberId}::uuid
        AND "activity_code" = ${activityCode}
        AND "rule_code" = ${ruleCode}
        AND "period_key" = ${periodKey}
      LIMIT 1
    `);
    return rows[0] ?? null;
  }

  async listProgress(memberId: string, activityCode: string, periodKeys: string[]) {
    if (!periodKeys.length) return [];
    return this.prisma.$queryRaw<ActivityProgressRow[]>(Prisma.sql`
      SELECT * FROM "member_activity_progress"
      WHERE "member_id" = ${memberId}::uuid
        AND "activity_code" = ${activityCode}
        AND "period_key" IN (${Prisma.join(periodKeys)})
      ORDER BY "updated_at" DESC
    `);
  }

  async listClaims(memberId: string, activityCode: string, periodKeys?: string[]) {
    const periodClause = periodKeys?.length
      ? Prisma.sql`AND "period_key" IN (${Prisma.join(periodKeys)})`
      : Prisma.empty;
    return this.prisma.$queryRaw<ActivityClaimRow[]>(Prisma.sql`
      SELECT * FROM "member_activity_reward_claims"
      WHERE "member_id" = ${memberId}::uuid
        AND "activity_code" = ${activityCode}
        ${periodClause}
      ORDER BY "claimed_at" DESC
    `);
  }

  async getClaim(memberId: string, activityCode: string, rewardCode: string, periodKey: string) {
    const rows = await this.prisma.$queryRaw<ActivityClaimRow[]>(Prisma.sql`
      SELECT * FROM "member_activity_reward_claims"
      WHERE "member_id" = ${memberId}::uuid
        AND "activity_code" = ${activityCode}
        AND "reward_code" = ${rewardCode}
        AND "period_key" = ${periodKey}
      LIMIT 1
    `);
    return rows[0] ?? null;
  }

  async createRewardClaim(input: {
    memberId: string;
    activityCode: string;
    rewardCode: string;
    periodKey: string;
    rewardType: ActivityRewardType;
    amount: number;
    idempotencyKey: string;
    metadata?: Record<string, unknown>;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.$queryRaw<ActivityClaimRow[]>(Prisma.sql`
        SELECT * FROM "member_activity_reward_claims"
        WHERE "member_id" = ${input.memberId}::uuid
          AND "activity_code" = ${input.activityCode}
          AND "reward_code" = ${input.rewardCode}
          AND "period_key" = ${input.periodKey}
        FOR UPDATE
      `);
      if (existing[0]) return { claim: existing[0], created: false };

      const claimId = randomUUID();
      let walletLedgerId: string | null = null;
      const amount = new Prisma.Decimal(input.amount);

      if (input.rewardType === 'CREDIT' && amount.greaterThan(0)) {
        const wallets = await tx.$queryRaw<Array<{ id: string; balance: Prisma.Decimal | string; status: string }>>(Prisma.sql`
          SELECT "id"::text, "balance", "status"
          FROM "wallets"
          WHERE "user_id" = ${input.memberId}::uuid
          FOR UPDATE
        `);
        const wallet = wallets[0];
        if (!wallet || wallet.status !== 'ACTIVE') throw new BadRequestException('Active wallet not found');

        const priorLedgers = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
          SELECT "id"::text FROM "wallet_ledgers"
          WHERE "idempotency_key" = ${input.idempotencyKey}
          LIMIT 1
        `);
        if (priorLedgers[0]) {
          walletLedgerId = priorLedgers[0].id;
        } else {
          walletLedgerId = randomUUID();
          const before = new Prisma.Decimal(wallet.balance);
          const after = before.add(amount);
          await tx.$executeRaw(Prisma.sql`
            UPDATE "wallets"
            SET "balance" = ${after}::numeric, "updated_at" = CURRENT_TIMESTAMP
            WHERE "id" = ${wallet.id}::uuid
          `);
          await tx.$executeRaw(Prisma.sql`
            INSERT INTO "wallet_ledgers" (
              "id", "wallet_id", "user_id", "type", "direction", "amount",
              "balance_before", "balance_after", "reference_type", "reference_id",
              "idempotency_key", "metadata", "created_at"
            ) VALUES (
              ${walletLedgerId}::uuid, ${wallet.id}::uuid, ${input.memberId}::uuid,
              'BONUS', 'CREDIT', ${amount}::numeric, ${before}::numeric, ${after}::numeric,
              'ACTIVITY_REWARD', ${claimId}, ${input.idempotencyKey},
              ${JSON.stringify(input.metadata ?? {})}::jsonb, CURRENT_TIMESTAMP
            )
          `);
        }
      }

      const rows = await tx.$queryRaw<ActivityClaimRow[]>(Prisma.sql`
        INSERT INTO "member_activity_reward_claims" (
          "id", "member_id", "activity_code", "reward_code", "period_key",
          "reward_type", "amount", "status", "idempotency_key", "wallet_ledger_id",
          "metadata", "claimed_at", "created_at"
        ) VALUES (
          ${claimId}::uuid, ${input.memberId}::uuid, ${input.activityCode}, ${input.rewardCode},
          ${input.periodKey}, ${input.rewardType}, ${amount}::numeric, 'CREDITED',
          ${input.idempotencyKey}, ${walletLedgerId}::uuid,
          ${JSON.stringify(input.metadata ?? {})}::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )
        RETURNING *
      `);
      return { claim: rows[0], created: true };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  async getRewardBalances(memberId: string) {
    const rows = await this.prisma.$queryRaw<Array<{ reward_type: ActivityRewardType; total: Prisma.Decimal | string }>>(Prisma.sql`
      SELECT "reward_type", COALESCE(SUM("amount"), 0) AS "total"
      FROM "member_activity_reward_claims"
      WHERE "member_id" = ${memberId}::uuid AND "status" = 'CREDITED'
      GROUP BY "reward_type"
    `);
    return rows.reduce<Record<ActivityRewardType, number>>((result, row) => {
      result[row.reward_type] = Number(row.total ?? 0);
      return result;
    }, { CREDIT: 0, POINT: 0, TICKET: 0 });
  }

  async getLotteryEntry(memberId: string, roundCode: string) {
    const rows = await this.prisma.$queryRaw<Array<Record<string, unknown>>>(Prisma.sql`
      SELECT * FROM "member_activity_lottery_entries"
      WHERE "member_id" = ${memberId}::uuid AND "round_code" = ${roundCode}
      LIMIT 1
    `);
    return rows[0] ?? null;
  }

  async createLotteryEntry(input: { memberId: string; roundCode: string; topNumber: string; bottomNumber: string }) {
    const rows = await this.prisma.$queryRaw<Array<Record<string, unknown>>>(Prisma.sql`
      INSERT INTO "member_activity_lottery_entries" (
        "id", "member_id", "round_code", "top_number", "bottom_number", "status", "submitted_at", "created_at"
      ) VALUES (
        ${randomUUID()}::uuid, ${input.memberId}::uuid, ${input.roundCode},
        ${input.topNumber}, ${input.bottomNumber}, 'SUBMITTED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
      ON CONFLICT ("member_id", "round_code") DO NOTHING
      RETURNING *
    `);
    return rows[0] ?? this.getLotteryEntry(input.memberId, input.roundCode);
  }

  async saveLotteryResult(input: { roundCode: string; topNumber: string; bottomNumber: string; actor: AuthenticatedAdminActor }) {
    const rows = await this.prisma.$queryRaw<Array<Record<string, unknown>>>(Prisma.sql`
      INSERT INTO "activity_lottery_results" (
        "id", "round_code", "top_number", "bottom_number", "published_by_admin_id", "published_at", "created_at", "updated_at"
      ) VALUES (
        ${randomUUID()}::uuid, ${input.roundCode}, ${input.topNumber}, ${input.bottomNumber},
        ${input.actor.id}::uuid, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
      ON CONFLICT ("round_code") DO UPDATE SET
        "top_number" = EXCLUDED."top_number",
        "bottom_number" = EXCLUDED."bottom_number",
        "published_by_admin_id" = EXCLUDED."published_by_admin_id",
        "published_at" = CURRENT_TIMESTAMP,
        "updated_at" = CURRENT_TIMESTAMP
      RETURNING *
    `);
    return rows[0] ?? null;
  }

  async getLotteryResult(roundCode: string) {
    const rows = await this.prisma.$queryRaw<Array<Record<string, unknown>>>(Prisma.sql`
      SELECT * FROM "activity_lottery_results" WHERE "round_code" = ${roundCode} LIMIT 1
    `);
    return rows[0] ?? null;
  }

  async listLotteryEntries(roundCode?: string, take = 200) {
    const whereRound = roundCode ? Prisma.sql`WHERE "round_code" = ${roundCode}` : Prisma.empty;
    return this.prisma.$queryRaw<Array<Record<string, unknown>>>(Prisma.sql`
      SELECT * FROM "member_activity_lottery_entries"
      ${whereRound}
      ORDER BY "submitted_at" DESC
      LIMIT ${Math.min(Math.max(take, 1), 1000)}
    `);
  }

  async listMatchingLotteryEntries(roundCode: string, topNumber: string, bottomNumber: string) {
    return this.prisma.$queryRaw<Array<{ member_id: string; top_number: string; bottom_number: string }>>(Prisma.sql`
      SELECT "member_id"::text, "top_number", "bottom_number"
      FROM "member_activity_lottery_entries"
      WHERE "round_code" = ${roundCode}
        AND ("top_number" = ${topNumber} OR "bottom_number" = ${bottomNumber})
      ORDER BY "submitted_at" ASC
    `);
  }

  async adminOverview() {
    const rows = await this.prisma.$queryRaw<Array<Record<string, unknown>>>(Prisma.sql`
      SELECT
        (SELECT COUNT(*)::int FROM "activity_metric_events") AS "metricEvents",
        (SELECT COUNT(*)::int FROM "member_activity_progress") AS "progressRows",
        (SELECT COUNT(*)::int FROM "member_activity_reward_claims") AS "rewardClaims",
        (SELECT COUNT(*)::int FROM "member_activity_lottery_entries") AS "lotteryEntries"
    `);
    return rows[0] ?? { metricEvents: 0, progressRows: 0, rewardClaims: 0, lotteryEntries: 0 };
  }

  async listAdminClaims(take = 200) {
    return this.prisma.$queryRaw<ActivityClaimRow[]>(Prisma.sql`
      SELECT * FROM "member_activity_reward_claims"
      ORDER BY "claimed_at" DESC
      LIMIT ${Math.min(Math.max(take, 1), 1000)}
    `);
  }

  async auditAdmin(actor: AuthenticatedAdminActor, action: string, targetId: string, newData: unknown) {
    await this.prisma.adminAuditLog.create({
      data: buildAdminAuditData({
        adminUserId: actor.id,
        action,
        module: 'activities',
        targetId,
        oldData: null,
        newData,
      }),
    });
  }
}
