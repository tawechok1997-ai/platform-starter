import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import type { SimulatorManualReviewInput } from './provider-simulator-manual-review.service';

@Injectable()
export class ProviderSimulatorPersistenceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async reserveNonce(merchantId: string, nonce: string, requestTimestamp: Date, expiresAt: Date) {
    await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`DELETE FROM "provider_simulator_nonces" WHERE "expires_at" < CURRENT_TIMESTAMP`;
      await tx.$executeRaw`
        INSERT INTO "provider_simulator_nonces" ("merchant_id", "nonce", "request_timestamp", "expires_at")
        VALUES (${merchantId}, ${nonce}, ${requestTimestamp}, ${expiresAt})
      `;
    });
  }

  async createManualReview(input: SimulatorManualReviewInput) {
    const metadata = JSON.stringify(input.metadata ?? {});
    const rows = await this.prisma.$queryRaw<Array<{ id: string; status: string; createdAt: Date }>>`
      INSERT INTO "game_round_manual_reviews" (
        "provider_code", "user_id", "external_round_id", "game_code", "operation",
        "provider_transaction_id", "original_provider_transaction_id", "amount",
        "currency", "reason", "metadata"
      ) VALUES (
        ${input.providerCode}, ${input.userId}::uuid, ${input.roundId}, ${input.gameCode}, ${input.operation},
        ${input.providerTransactionId}, ${input.originalProviderTransactionId ?? null}, ${input.amount}::decimal,
        ${input.currency}, ${input.reason}, ${metadata}::jsonb
      )
      ON CONFLICT ("provider_code", "provider_transaction_id")
      DO UPDATE SET "updated_at" = CURRENT_TIMESTAMP
      RETURNING "id", "status", "created_at" AS "createdAt"
    `;
    return rows[0] ?? null;
  }
}
