import { BadRequestException, Injectable } from '@nestjs/common';
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
    const current = await this.reconstruct(input.userId, input.roundId, input.gameCode);
    const event = kind === 'BET' ? 'PLACE_BET' : kind === 'WIN' ? 'SETTLE' : 'ROLLBACK';

    try {
      return transitionGameRound(current, event, input.transactionId);
    } catch (error) {
      if (error instanceof GameRoundTransitionError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  private async reconstruct(userId: string, roundId: string, gameCode: string): Promise<GameRoundSnapshot> {
    const ledger = await this.walletService.getMemberLedger(userId, 100);
    const related = ledger.items.filter((item: any) => {
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
      const kind = String(metadata.transactionKind ?? item.referenceType ?? '').toUpperCase();
      const transactionId = this.transactionId(item, metadata);
      const event = kind.includes('BET')
        ? 'PLACE_BET'
        : kind.includes('WIN')
          ? 'SETTLE'
          : kind.includes('REFUND') || kind.includes('ROLLBACK')
            ? 'ROLLBACK'
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
    return reference.replace(/^sim_(bet|win|refund|rollback)_/i, '').trim();
  }
}
