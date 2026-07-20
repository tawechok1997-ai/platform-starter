import { Injectable } from '@nestjs/common';
import { withTransactionRetry } from '../../common/database/transaction-retry';
import { ProviderSimulatorService } from './provider-simulator.service';

type GameTransactionKind = 'BET' | 'WIN' | 'REFUND' | 'ROLLBACK';

@Injectable()
export class ProviderSimulatorTransactionService {
  constructor(private readonly simulator: ProviderSimulatorService) {}

  gameTransaction(kind: GameTransactionKind, input: Record<string, unknown>) {
    return withTransactionRetry(
      () => this.simulator.gameTransaction(kind, input),
      { maxAttempts: 3, baseDelayMs: 25 },
    );
  }
}
