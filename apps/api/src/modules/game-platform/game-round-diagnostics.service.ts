import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

type RoundDiagnosticRow = {
  roundId: string;
  providerRoundId: string;
  state: string;
  storedBet: string;
  computedBet: string;
  storedWin: string;
  computedWin: string;
  storedRefund: string;
  computedRefund: string;
  storedRollback: string;
  computedRollback: string;
};

@Injectable()
export class GameRoundDiagnosticsService {
  constructor(private readonly prisma: PrismaService) {}

  async scanStaleRounds(staleMinutes = 30, limit = 100) {
    const safeMinutes = Math.min(Math.max(Math.trunc(staleMinutes || 30), 5), 10_080);
    const safeLimit = Math.min(Math.max(Math.trunc(limit || 100), 1), 500);
    const rows = await this.prisma.$queryRaw<Array<{ id: string; providerRoundId: string; state: string; updatedAt: Date }>>`
      WITH stale AS (
        SELECT "id"
        FROM "game_rounds"
        WHERE "state" NOT IN ('CLOSED', 'ROLLED_BACK')
          AND "updated_at" < CURRENT_TIMESTAMP - (${safeMinutes} * INTERVAL '1 minute')
        ORDER BY "updated_at" ASC
        LIMIT ${safeLimit}
        FOR UPDATE SKIP LOCKED
      )
      UPDATE "game_rounds" AS round
      SET "manual_review_reason" = COALESCE(round."manual_review_reason", 'STALE_ROUND'),
          "manual_review_at" = COALESCE(round."manual_review_at", CURRENT_TIMESTAMP),
          "updated_at" = CURRENT_TIMESTAMP
      FROM stale
      WHERE round."id" = stale."id"
      RETURNING round."id", round."provider_round_id" AS "providerRoundId", round."state", round."updated_at" AS "updatedAt"
    `;
    return { staleMinutes: safeMinutes, scanned: rows.length, items: rows };
  }

  async reconcileRoundTotals(limit = 100) {
    const safeLimit = Math.min(Math.max(Math.trunc(limit || 100), 1), 500);
    const rows = await this.prisma.$queryRaw<RoundDiagnosticRow[]>`
      SELECT round."id" AS "roundId",
             round."provider_round_id" AS "providerRoundId",
             round."state",
             round."total_bet_amount"::text AS "storedBet",
             COALESCE(SUM(tx."amount") FILTER (WHERE tx."operation" = 'BET'), 0)::text AS "computedBet",
             round."total_win_amount"::text AS "storedWin",
             COALESCE(SUM(tx."amount") FILTER (WHERE tx."operation" = 'WIN'), 0)::text AS "computedWin",
             round."total_refund_amount"::text AS "storedRefund",
             COALESCE(SUM(tx."amount") FILTER (WHERE tx."operation" = 'REFUND'), 0)::text AS "computedRefund",
             round."total_rollback_amount"::text AS "storedRollback",
             COALESCE(SUM(tx."amount") FILTER (WHERE tx."operation" IN ('ROLLBACK', 'CANCEL')), 0)::text AS "computedRollback"
      FROM "game_rounds" round
      LEFT JOIN "game_round_transactions" tx ON tx."round_id" = round."id"
      GROUP BY round."id"
      HAVING round."total_bet_amount" <> COALESCE(SUM(tx."amount") FILTER (WHERE tx."operation" = 'BET'), 0)
          OR round."total_win_amount" <> COALESCE(SUM(tx."amount") FILTER (WHERE tx."operation" = 'WIN'), 0)
          OR round."total_refund_amount" <> COALESCE(SUM(tx."amount") FILTER (WHERE tx."operation" = 'REFUND'), 0)
          OR round."total_rollback_amount" <> COALESCE(SUM(tx."amount") FILTER (WHERE tx."operation" IN ('ROLLBACK', 'CANCEL')), 0)
      ORDER BY round."updated_at" ASC
      LIMIT ${safeLimit}
    `;

    if (rows.length > 0) {
      const ids = rows.map((row) => row.roundId);
      await this.prisma.$executeRaw`
        UPDATE "game_rounds"
        SET "manual_review_reason" = COALESCE("manual_review_reason", 'ROUND_TOTAL_MISMATCH'),
            "manual_review_at" = COALESCE("manual_review_at", CURRENT_TIMESTAMP),
            "updated_at" = CURRENT_TIMESTAMP
        WHERE "id" = ANY(${ids}::uuid[])
      `;
    }

    return { checked: safeLimit, mismatch: rows.length, items: rows };
  }

  async findMissingLedgerLinks(limit = 100) {
    const safeLimit = Math.min(Math.max(Math.trunc(limit || 100), 1), 500);
    const rows = await this.prisma.$queryRaw<Array<{ transactionId: string; providerTransactionId: string; roundId: string; operation: string }>>`
      SELECT tx."id" AS "transactionId",
             tx."provider_transaction_id" AS "providerTransactionId",
             tx."round_id" AS "roundId",
             tx."operation"
      FROM "game_round_transactions" tx
      LEFT JOIN "wallet_ledgers" ledger
        ON ledger."metadata" ->> 'providerTransactionId' = tx."provider_transaction_id"
      WHERE ledger."id" IS NULL
      ORDER BY tx."created_at" ASC
      LIMIT ${safeLimit}
    `;
    return { missing: rows.length, items: rows };
  }
}
