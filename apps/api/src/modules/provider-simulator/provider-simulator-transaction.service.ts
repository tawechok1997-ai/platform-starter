import { ConflictException, Injectable } from '@nestjs/common';
import { withTransactionRetry } from '../../common/database/transaction-retry';
import { ProviderSimulatorManualReviewService } from './provider-simulator-manual-review.service';
import { ProviderSimulatorService } from './provider-simulator.service';

type GameTransactionKind = 'BET' | 'WIN' | 'REFUND' | 'ROLLBACK';

@Injectable()
export class ProviderSimulatorTransactionService {
  constructor(
    private readonly simulator: ProviderSimulatorService,
    private readonly manualReviews: ProviderSimulatorManualReviewService,
  ) {}

  async gameTransaction(kind: GameTransactionKind, input: Record<string, unknown>) {
    try {
      return await withTransactionRetry(
        () => this.simulator.gameTransaction(kind, input),
        { maxAttempts: 3, baseDelayMs: 25 },
      );
    } catch (error) {
      if (!this.requiresManualReview(kind, input, error)) throw error;

      const transactionId = this.requiredString(input.transactionId ?? input.idempotencyKey, 'transactionId');
      const review = await this.manualReviews.create({
        providerCode: 'provider-simulator',
        userId: this.requiredString(input.userId, 'userId'),
        roundId: this.requiredString(input.roundId, 'roundId'),
        gameCode: this.requiredString(input.gameCode, 'gameCode'),
        operation: 'ROLLBACK_WIN',
        providerTransactionId: `sim_rollback_win_${transactionId}`,
        originalProviderTransactionId: this.requiredString(input.originalTransactionId, 'originalTransactionId'),
        amount: this.requiredString(input.amount, 'amount'),
        currency: typeof input.currency === 'string' && input.currency.trim() ? input.currency.trim() : 'THB',
        reason: error instanceof Error ? error.message : 'Rollback win requires manual review',
        metadata: { rollbackTarget: 'WIN', transactionId },
      });

      throw new ConflictException({
        message: 'Rollback win could not be completed automatically and was sent to manual review',
        code: 'GAME_TRANSACTION_MANUAL_REVIEW',
        manualReviewId: review?.id ?? null,
      });
    }
  }

  private requiresManualReview(kind: GameTransactionKind, input: Record<string, unknown>, error: unknown) {
    if (kind !== 'ROLLBACK' || String(input.rollbackTarget ?? '').trim().toUpperCase() !== 'WIN') return false;
    const message = error instanceof Error ? error.message.toLowerCase() : '';
    return message.includes('insufficient') || message.includes('balance cannot be negative');
  }

  private requiredString(value: unknown, field: string) {
    const normalized = String(value ?? '').trim();
    if (!normalized) throw new ConflictException(`${field} is required for manual review persistence`);
    return normalized;
  }
}
