import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  GameRoundSnapshot,
  GameRoundTransitionError,
  transitionGameRound,
} from '../game-platform/round-engine.policy';
import { WalletService } from '../wallet/wallet.service';

type SimulatorRoundKind = 'BET' | 'WIN' | 'REFUND' | 'ROLLBACK';
type SimulatorRoundInput = {
  userId: string;
  roundId: string;
  gameCode: string;
  transactionId: string;
};

@Injectable()
export class ProviderSimulatorRoundService {
  constructor(private readonly walletService: WalletService) {}

  async enforce(kind: SimulatorRoundKind, input: SimulatorRoundInput): Promise<GameRoundSnapshot> {
    const current = await this.reconstructFromWallet(input.userId, input.roundId, input.gameCode);
    return this.apply(kind, input, current);
  }

  async enforceInTransaction(
    tx: Prisma.TransactionClient,
    kind: SimulatorRoundKind,
    input: SimulatorRoundInput,
  ): Promise<GameRoundSnapshot> {
    const current = await this.reconstructFromTransaction(tx, input.userId, input.roundId, input.gameCode);
    return this.apply(kind, input, current);
  }

  private apply(kind: SimulatorRoundKind, input: SimulatorRoundInput, current: GameRoundSnapshot) {
    const event = kind === 'BET'
      ? 'PLACE_BET'
      : kind === 'WIN'
        ? 'SETTLE'
        : kind === 'REFUND'
          ? 'REFUND'
          : 'ROLLBACK';
    try {
      return transitionGameRound(current, event, input.transactionId);
    } catch (error) {
      if (error instanceof GameRoundTransitionError) throw new BadRequestException(error.message);
      throw error;
    }
  }

  private async reconstructFromWallet(userId: string, roundId: string, gameCode: string) {
    const ledger = await this.walletService.getMemberLedger(userId, 100);
    return this.reconstruct(ledger.items, roundId, gameCode);
  }

  private async reconstructFromTransaction(
    tx: Prisma.TransactionClient,
    userId: string,
    roundId: string,
    gameCode: string,
  ) {
    const items = await tx.walletLedger.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return this.reconstruct(items, roundId, gameCode);
  }

  private reconstruct(items: any[], roundId: string, gameCode: string): GameRoundSnapshot {
    const related = items.filter((item: any) => {
      const metadata = this.metadata(item);
      return metadata.roundId === roundId && metadata.gameCode === gameCode;
    });

    let snapshot: GameRoundSnapshot = {
      roundId,
      providerRoundId: roundId,
      state: 'CREATED',
    };

    for (const item of [...related].reverse()) {
      const metadata = this.metadata(item);
      const operation = String(metadata.gameOperation ?? metadata.transactionKind ?? item.referenceType ?? '').toUpperCase();
      const transactionId = this.transactionId(item, metadata);
      const event = operation.includes('ROLLBACK')
        ? 'ROLLBACK'
        : operation.includes('REFUND')
          ? 'REFUND'
          : operation.includes('WIN')
            ? 'SETTLE'
            : operation.includes('BET')
              ? 'PLACE_BET'
              : null;
      if (!event || !transactionId) continue;

      try {
        snapshot = transitionGameRound(snapshot, event, transactionId);
      } catch (error) {
        if (error instanceof GameRoundTransitionError) {
          throw new BadRequestException(`Stored simulator round history is invalid: ${error.message}`);
        }
        throw error;
      }
    }

    return snapshot;
  }

  private metadata(item: any): Record<string, unknown> {
    return item?.metadata && typeof item.metadata === 'object' && !Array.isArray(item.metadata)
      ? item.metadata as Record<string, unknown>
      : {};
  }

  private transactionId(item: any, metadata: Record<string, unknown>) {
    const explicit = typeof metadata.transactionId === 'string' ? metadata.transactionId.trim() : '';
    if (explicit) return explicit;
    const reference = String(metadata.providerTransactionId ?? item.referenceId ?? '');
    return reference.replace(/^sim_(bet|win|refund|rollback_bet|rollback_win|rollback)_/i, '').trim();
  }
}
