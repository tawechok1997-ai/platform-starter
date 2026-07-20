import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { ParsedWebhookEvent } from './provider-adapter.interface';
import { GameRoundTransitionError, transitionGameRound, type GameRoundEvent, type GameRoundSnapshot, type GameRoundState } from './round-engine.policy';

type PersistedGameRound = {
  id: string;
  providerRoundId: string;
  state: GameRoundState;
  betTransactionId: string | null;
  settleTransactionId: string | null;
  rollbackTransactionId: string | null;
};

type PersistableRoundTransaction = {
  amount: string;
  currency: string;
  originalProviderTransactionId: string | null;
  direction: 'CREDIT' | 'DEBIT';
  operation: 'BET' | 'WIN' | 'REFUND' | 'ROLLBACK';
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
  async applyWebhookEvents(tx: Prisma.TransactionClient, providerId: string, events: ParsedWebhookEvent[]): Promise<PersistedRoundTransition[]> {
    const results: PersistedRoundTransition[] = [];
    for (const event of events) {
      const roundEvent = this.mapEvent(event.eventType);
      const providerRoundId = event.roundId?.trim();
      if (!roundEvent || !providerRoundId) continue;
      const transactionId = event.providerTransactionId?.trim() || event.idempotencyKey?.trim();
      const lockKey = `game-round:${providerId}:${providerRoundId}`;
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`;
      const current = await this.findOrCreate(tx, providerId, providerRoundId);
      const snapshot = this.toSnapshot(current);
      let next: GameRoundSnapshot;
      try { next = transitionGameRound(snapshot, roundEvent, transactionId); }
      catch (error) {
        if (error instanceof GameRoundTransitionError) throw new BadRequestException(error.message);
        throw error;
      }
      const replay = next === snapshot;
      if (!replay) {
        const payloadJson = JSON.stringify(event.payload ?? null);
        const now = new Date();
        await tx.$executeRaw`
          UPDATE "game_rounds"
          SET "state" = ${next.state},
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

        if (transactionId) {
          const transaction = this.extractTransaction(event, roundEvent);
          if (transaction) {
            await this.persistTransaction(tx, {
              providerId,
              roundId: current.id,
              providerTransactionId: transactionId,
              idempotencyKey: event.idempotencyKey?.trim() || `${providerId}:${transactionId}`,
              rawPayload: payloadJson,
              ...transaction,
            });
          }
        }
      }
      results.push({ roundId: current.id, providerRoundId, state: next.state, event: roundEvent, replay });
    }
    return results;
  }

  private async persistTransaction(
    tx: Prisma.TransactionClient,
    input: PersistableRoundTransaction & {
      providerId: string;
      roundId: string;
      providerTransactionId: string;
      idempotencyKey: string;
      rawPayload: string;
    },
  ) {
    await tx.$executeRaw`
      WITH inserted AS (
        INSERT INTO "game_round_transactions" (
          "round_id", "provider_id", "provider_transaction_id",
          "original_provider_transaction_id", "operation", "direction",
          "amount", "currency", "idempotency_key", "raw_payload"
        ) VALUES (
          ${input.roundId}::uuid, ${input.providerId}::uuid, ${input.providerTransactionId},
          ${input.originalProviderTransactionId}, ${input.operation}, ${input.direction}::"WalletLedgerDirection",
          ${input.amount}::decimal, ${input.currency}, ${input.idempotencyKey}, ${input.rawPayload}::jsonb
        )
        ON CONFLICT ("provider_id", "provider_transaction_id") DO NOTHING
        RETURNING "operation", "amount"
      )
      UPDATE "game_rounds"
      SET "total_bet_amount" = "total_bet_amount" + CASE WHEN inserted."operation" = 'BET' THEN inserted."amount" ELSE 0 END,
          "total_win_amount" = "total_win_amount" + CASE WHEN inserted."operation" = 'WIN' THEN inserted."amount" ELSE 0 END,
          "total_refund_amount" = "total_refund_amount" + CASE WHEN inserted."operation" = 'REFUND' THEN inserted."amount" ELSE 0 END,
          "total_rollback_amount" = "total_rollback_amount" + CASE WHEN inserted."operation" = 'ROLLBACK' THEN inserted."amount" ELSE 0 END,
          "updated_at" = CURRENT_TIMESTAMP
      FROM inserted
      WHERE "game_rounds"."id" = ${input.roundId}::uuid
    `;
  }

  private extractTransaction(event: ParsedWebhookEvent, roundEvent: GameRoundEvent): PersistableRoundTransaction | null {
    if (roundEvent === 'CLOSE') return null;
    const payload = this.asRecord(event.payload);
    const amount = this.positiveAmount(payload.amount ?? payload.betAmount ?? payload.winAmount ?? payload.refundAmount ?? payload.rollbackAmount);
    if (!amount) return null;
    const operation = roundEvent === 'PLACE_BET'
      ? 'BET'
      : roundEvent === 'SETTLE'
        ? 'WIN'
        : this.normalizedEventType(event.eventType).includes('REFUND')
          ? 'REFUND'
          : 'ROLLBACK';
    return {
      amount,
      currency: this.nonEmptyString(payload.currency) ?? 'THB',
      originalProviderTransactionId: this.nonEmptyString(payload.originalTransactionId ?? payload.originalProviderTransactionId),
      direction: operation === 'BET' ? 'DEBIT' : 'CREDIT',
      operation,
    };
  }

  private async findOrCreate(tx: Prisma.TransactionClient, providerId: string, providerRoundId: string): Promise<PersistedGameRound> {
    const existing = await tx.$queryRaw<PersistedGameRound[]>`
      SELECT "id", "provider_round_id" AS "providerRoundId", "state",
             "bet_transaction_id" AS "betTransactionId",
             "settle_transaction_id" AS "settleTransactionId",
             "rollback_transaction_id" AS "rollbackTransactionId"
      FROM "game_rounds"
      WHERE "provider_id" = ${providerId}::uuid AND "provider_round_id" = ${providerRoundId}
      LIMIT 1
    `;
    if (existing[0]) return existing[0];
    const created = await tx.$queryRaw<PersistedGameRound[]>`
      INSERT INTO "game_rounds" ("provider_id", "provider_round_id")
      VALUES (${providerId}::uuid, ${providerRoundId})
      ON CONFLICT ("provider_id", "provider_round_id") DO UPDATE SET "updated_at" = "game_rounds"."updated_at"
      RETURNING "id", "provider_round_id" AS "providerRoundId", "state",
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
    const normalized = this.normalizedEventType(eventType);
    if (['BET', 'PLACE_BET', 'BET_PLACED'].includes(normalized)) return 'PLACE_BET';
    if (['SETTLE', 'SETTLED', 'WIN', 'PAYOUT'].includes(normalized)) return 'SETTLE';
    if (['ROLLBACK', 'REFUND', 'BET_ROLLBACK', 'CANCEL_BET'].includes(normalized)) return 'ROLLBACK';
    if (['CLOSE', 'ROUND_CLOSED'].includes(normalized)) return 'CLOSE';
    return null;
  }

  private normalizedEventType(eventType: string) {
    return eventType.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_');
  }

  private asRecord(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
  }

  private nonEmptyString(value: unknown) {
    return typeof value === 'string' && value.trim() ? value.trim() : null;
  }

  private positiveAmount(value: unknown) {
    const amount = String(value ?? '').trim();
    return /^\d+(\.\d{1,2})?$/.test(amount) && Number(amount) > 0 ? amount : null;
  }
}
