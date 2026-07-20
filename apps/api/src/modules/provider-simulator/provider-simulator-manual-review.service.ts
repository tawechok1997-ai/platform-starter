import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export type SimulatorManualReviewInput = {
  providerCode: string;
  userId: string;
  roundId: string;
  gameCode: string;
  operation: string;
  providerTransactionId: string;
  originalProviderTransactionId?: string | null;
  amount: string;
  currency: string;
  reason: string;
  metadata?: Record<string, unknown>;
};

@Injectable()
export class ProviderSimulatorManualReviewService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: SimulatorManualReviewInput) {
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
