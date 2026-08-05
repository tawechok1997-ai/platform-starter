import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ProviderSimulatorSlotRoundRepository } from './provider-simulator-slot-round.repository';
import { ProviderSimulatorTransactionService } from './provider-simulator-transaction.service';

const DEMO_GAME_CODE = 'demo-slot-001';
const ROUND_ID_PATTERN = /^slot_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type SlotLedgerEntry = {
  id: string;
  operation: string;
  direction: string;
  amount: string;
  balanceBefore: string;
  balanceAfter: string;
  transactionId: string;
  originalTransactionId: string | null;
  roundId: string;
  createdAt: Date;
};

@Injectable()
export class ProviderSimulatorSlotRoundService {
  constructor(
    private readonly repository: ProviderSimulatorSlotRoundRepository,
    private readonly transactions: ProviderSimulatorTransactionService,
  ) {}

  async history(userId: string, sessionId: string) {
    const session = await this.requireSession(userId, sessionId);
    const entries = this.mapLedgers(await this.repository.listOwnedSessionLedgers(userId, sessionId));
    return {
      ok: true,
      sessionId,
      gameCode: session.game.providerGameCode,
      currency: session.provider.currency,
      items: this.groupRounds(entries),
    };
  }

  async rollback(userId: string, sessionId: string, roundId: string) {
    const normalizedRoundId = roundId.trim();
    if (!ROUND_ID_PATTERN.test(normalizedRoundId)) {
      throw new BadRequestException('Invalid simulator slot round id');
    }

    const session = await this.requireSession(userId, sessionId);
    const entries = this.mapLedgers(await this.repository.listOwnedSessionLedgers(userId, sessionId));
    const roundEntries = entries.filter((entry) => entry.roundId === normalizedRoundId);
    const bet = roundEntries.find((entry) => entry.operation === 'BET');
    const win = roundEntries.find((entry) => entry.operation === 'WIN');
    const refund = roundEntries.find((entry) => entry.operation === 'REFUND');
    const rollbackBet = roundEntries.find((entry) => entry.operation === 'ROLLBACK_BET');
    const rollbackWin = roundEntries.find((entry) => entry.operation === 'ROLLBACK_WIN');

    if (!bet) throw new NotFoundException('The simulator bet for this round was not found');
    if (refund) {
      throw new BadRequestException('Refunded simulator rounds cannot be rolled back');
    }
    if (rollbackBet && (!win || rollbackWin)) {
      const latest = await this.history(userId, sessionId);
      return {
        ok: true,
        replayed: true,
        roundId: normalizedRoundId,
        balance: rollbackBet.balanceAfter,
        round: latest.items.find((item) => item.roundId === normalizedRoundId) ?? null,
      };
    }

    const rollbackTransactionId = `rollback_${normalizedRoundId}`;
    let latestBalance = rollbackWin?.balanceAfter ?? bet.balanceAfter;
    let replayed = Boolean(rollbackWin || rollbackBet);

    if (win && !rollbackWin) {
      const result = await this.transactions.gameTransaction('ROLLBACK', {
        userId,
        transactionId: rollbackTransactionId,
        originalTransactionId: win.transactionId,
        rollbackTarget: 'WIN',
        roundId: normalizedRoundId,
        gameCode: DEMO_GAME_CODE,
        amount: win.amount,
        currency: session.provider.currency,
        sessionId,
      });
      latestBalance = result.afterBalance;
      replayed = replayed || Boolean(result.replayed);
    }

    if (!rollbackBet) {
      const result = await this.transactions.gameTransaction('ROLLBACK', {
        userId,
        transactionId: rollbackTransactionId,
        originalTransactionId: bet.transactionId,
        rollbackTarget: 'BET',
        roundId: normalizedRoundId,
        gameCode: DEMO_GAME_CODE,
        amount: bet.amount,
        currency: session.provider.currency,
        sessionId,
      });
      latestBalance = result.afterBalance;
      replayed = replayed || Boolean(result.replayed);
    }

    const latest = await this.history(userId, sessionId);
    return {
      ok: true,
      replayed,
      roundId: normalizedRoundId,
      balance: latestBalance,
      round: latest.items.find((item) => item.roundId === normalizedRoundId) ?? null,
    };
  }

  private async requireSession(userId: string, sessionId: string) {
    const session = await this.repository.findOwnedSession(userId, sessionId);
    if (!session) throw new NotFoundException('Simulator slot session was not found for this member');
    if (session.game.status !== 'ACTIVE' || session.provider.status !== 'ACTIVE') {
      throw new BadRequestException('Simulator slot or provider is not active');
    }
    return session;
  }

  private mapLedgers(ledgers: Awaited<ReturnType<ProviderSimulatorSlotRoundRepository['listOwnedSessionLedgers']>>): SlotLedgerEntry[] {
    return ledgers.map((ledger) => {
      const metadata = this.repository.metadata(ledger.metadata);
      return {
        id: ledger.id,
        operation: String(metadata.gameOperation ?? metadata.transactionKind ?? ledger.referenceType)
          .replace(/^game_/i, '')
          .toUpperCase(),
        direction: String(ledger.direction),
        amount: ledger.amount.toString(),
        balanceBefore: ledger.balanceBefore.toString(),
        balanceAfter: ledger.balanceAfter.toString(),
        transactionId: String(metadata.transactionId ?? '').trim(),
        originalTransactionId: typeof metadata.originalTransactionId === 'string'
          ? metadata.originalTransactionId
          : null,
        roundId: String(metadata.roundId ?? '').trim(),
        createdAt: ledger.createdAt,
      };
    }).filter((entry) => Boolean(entry.roundId && entry.transactionId));
  }

  private groupRounds(entries: SlotLedgerEntry[]) {
    const groups = new Map<string, SlotLedgerEntry[]>();
    for (const entry of entries) {
      const group = groups.get(entry.roundId) ?? [];
      group.push(entry);
      groups.set(entry.roundId, group);
    }

    return Array.from(groups.entries()).map(([roundId, roundEntries]) => {
      const bet = roundEntries.find((entry) => entry.operation === 'BET');
      const win = roundEntries.find((entry) => entry.operation === 'WIN');
      const refund = roundEntries.find((entry) => entry.operation === 'REFUND');
      const rollbackBet = roundEntries.find((entry) => entry.operation === 'ROLLBACK_BET');
      const rollbackWin = roundEntries.find((entry) => entry.operation === 'ROLLBACK_WIN');
      const fullyRolledBack = Boolean(rollbackBet && (!win || rollbackWin));
      const betAmount = Number(bet?.amount ?? 0);
      const winAmount = Number(win?.amount ?? 0);
      const netAmount = fullyRolledBack || refund ? 0 : winAmount - betAmount;
      const latest = [...roundEntries].sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())[0];

      return {
        roundId,
        result: win ? 'WIN' : 'LOSS',
        status: fullyRolledBack ? 'ROLLED_BACK' : refund ? 'REFUNDED' : win ? 'SETTLED' : 'BET',
        betAmount: betAmount.toFixed(2),
        winAmount: winAmount.toFixed(2),
        netAmount: netAmount.toFixed(2),
        balance: latest?.balanceAfter ?? '0.00',
        canRollback: Boolean(bet && !fullyRolledBack && !refund),
        createdAt: bet?.createdAt ?? latest?.createdAt ?? new Date(0),
        transactions: roundEntries
          .sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime())
          .map((entry) => ({
            id: entry.id,
            operation: entry.operation,
            direction: entry.direction,
            amount: entry.amount,
            balanceBefore: entry.balanceBefore,
            balanceAfter: entry.balanceAfter,
            transactionId: entry.transactionId,
            originalTransactionId: entry.originalTransactionId,
            createdAt: entry.createdAt,
          })),
      };
    }).sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());
  }
}
