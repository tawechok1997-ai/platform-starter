import { Injectable } from '@nestjs/common';
import { GameRoundDiagnosticsRepository } from './game-round-diagnostics.repository';

@Injectable()
export class GameRoundDiagnosticsService {
  constructor(private readonly repository: GameRoundDiagnosticsRepository) {}

  async scanStaleRounds(staleMinutes = 30, limit = 100) {
    const safeMinutes = Math.min(Math.max(Math.trunc(staleMinutes || 30), 5), 10_080);
    const safeLimit = Math.min(Math.max(Math.trunc(limit || 100), 1), 500);
    const rows = await this.repository.scanStaleRounds(safeMinutes, safeLimit);
    return { staleMinutes: safeMinutes, scanned: rows.length, items: rows };
  }

  async reconcileRoundTotals(limit = 100) {
    const safeLimit = Math.min(Math.max(Math.trunc(limit || 100), 1), 500);
    const rows = await this.repository.findRoundTotalMismatches(safeLimit);
    await this.repository.markRoundTotalMismatches(rows.map((row) => row.roundId));
    return { checked: safeLimit, mismatch: rows.length, items: rows };
  }

  async findMissingLedgerLinks(limit = 100) {
    const safeLimit = Math.min(Math.max(Math.trunc(limit || 100), 1), 500);
    const rows = await this.repository.findMissingLedgerLinks(safeLimit);
    return { missing: rows.length, items: rows };
  }
}
