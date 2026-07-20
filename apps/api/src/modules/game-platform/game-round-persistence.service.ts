import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { ParsedWebhookEvent } from './provider-adapter.interface';
import {
  GameRoundTransitionError,
  transitionGameRound,
  type GameRoundEvent,
  type GameRoundSnapshot,
  type GameRoundState,
} from './round-engine.policy';

type PersistedGameRound = {
  id: string;
  providerRoundId: string;
  state: GameRoundState;
  betTransactionId: string | null;
  settleTransactionId: string | null;
  rollbackTransactionId: string | null;
};

export type PersistedRoundTransition = {
  roundId: string;
  providerRoundId: string;
  state: GameRoundState;
  event: GameRoundEvent;
  replay: boolean;
};

@Injectable()
export class GameRoundPersistenceService {
  async applyWebhookEvents(
    tx: Prisma.TransactionClient,
    providerId: string,
    events: ParsedWebhookEvent[],
  ): Promise<PersistedRoundTransition[]> {
    const results: PersistedRoundTransition[] = [];

    for (const event of events) {
      const roundEvent = this.mapEvent(event.eventType);
      const providerRoundId = event.roundId?.trim();
      if (!roundEvent || !providerRoundId) continue;

      const transactionId = event.providerTransactionId?.trim()
        || event.idempotencyKey?.trim();
      const lockKey = `game-round:${providerId}:${providerRoundId}`;
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`;

      const current = await this.findOrCreate(tx, providerId, providerRoundId);
      const snapshot = this.toSnapshot(current);

      let next: GameRoundSnapshot;
      try {
        next = transitionGameRound(snapshot, roundEvent, transactionId);
      } catch (error) {
        if (error instanceof GameRoundTransitionError) {
          throw new BadRequestException(error.message);
        }
        throw error;
      }

      const replay = next === snapshot;
      if (!replay) {
        const payloadJson = JSON.stringify(event.payload ?? null);
        const now = new Date();
        await tx.$executeRaw`
          UPDATE "game_rounds"
          SET
            "state" = ${next.state},
            "bet_transaction_id" = ${next.betTransactionId ?? null},
            "settle_transaction_id" = ${next.settleTransactionId ?? null},
            "rollback_transaction_id" = ${next.rollbackTransactionId ?? null},
            "last_event_type" = ${event.eventType},
            "last_event_payload" = ${payloadJson}::jsonb,
            "settled_at" = CASE WHEN ${next.state} = 'SETTLED' THEN ${now} ELSE "settled_at" END,
            "rolled_back_at" = CASE WHEN ${next.state} = 'ROLLED_BACK' THEN ${now} ELSE "rolled_back_at" END,
            "closed_at" = CASE WHEN ${next.state} = 'CLOSED' THEN ${now} ELSE "closed_at" END,
            "updated_at" = ${now}
          WHERE "id" = ${current.id}::uuid
        `;
      }

      results.push({
        roundId: current.id,
        providerRoundId,
        state: next.state,
        event: roundEvent,
        replay,
      });
    }

    return results;
  }

  private async findOrCreate(
    tx: Prisma.TransactionClient,
    providerId: string,
    providerRoundId: string,
  ): Promise<PersistedGameRound> {
    const existing = await tx.$queryRaw<PersistedGameRound[]>`
      SELECT
        "id",
        "provider_round_id" AS "providerRoundId",
        "state",
        "bet_transaction_id" AS "betTransactionId",
        "settle_transaction_id" AS "settleTransactionId",
        "rollback_transaction_id" AS "rollbackTransactionId"
      FROM "game_rounds"
      WHERE "provider_id" = ${providerId}::uuid
        AND "provider_round_id" = ${providerRoundId}
      LIMIT 1
    `;
    if (existing[0]) return existing[0];

    const created = await tx.$queryRaw<PersistedGameRound[]>`
      INSERT INTO "game_rounds" ("provider_id", "provider_round_id")
      VALUES (${providerId}::uuid, ${providerRoundId})
      ON CONFLICT ("provider_id", "provider_round_id") DO UPDATE
        SET "updated_at" = "game_rounds"."updated_at"
      RETURNING
        "id",
        "provider_round_id" AS "providerRoundId",
        "state",
        "bet_transaction_id" AS "betTransactionId",
        "settle_transaction_id" AS "settleTransactionId",
        "rollback_transaction_id" AS "rollbackTransactionId"
    `;
    const round = created[0];
    if (!round) throw new BadRequestException('Unable to create game round');
    return round;
  }

  private toSnapshot(round: PersistedGameRound): GameRoundSnapshot {
    return {
      roundId: round.id,
      providerRoundId: round.providerRoundId,
      state: round.state,
      ...(round.betTransactionId ? { betTransactionId: round.betTransactionId } : {}),
      ...(round.settleTransactionId ? { settleTransactionId: round.settleTransactionId } : {}),
      ...(round.rollbackTransactionId ? { rollbackTransactionId: round.rollbackTransactionId } : {}),
    };
  }

  private mapEvent(eventType: string): GameRoundEvent | null {
    const normalized = eventType.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_');
    if (['BET', 'PLACE_BET', 'BET_PLACED'].includes(normalized)) return 'PLACE_BET';
    if (['SETTLE', 'SETTLED', 'WIN', 'PAYOUT'].includes(normalized)) return 'SETTLE';
    if (['ROLLBACK', 'REFUND', 'BET_ROLLBACK', 'CANCEL_BET'].includes(normalized)) return 'ROLLBACK';
    if (['CLOSE', 'ROUND_CLOSED'].includes(normalized)) return 'CLOSE';
    return null;
  }
}
