import { DomainError } from '../../../common/domain/domain-error';

export type WatchlistMatch = {
  matched: boolean;
  score: number;
  source: string;
  normalizedValue: string;
};

export const WatchlistPolicy = {
  classify(score: number): 'NONE' | 'REVIEW' | 'BLOCK' {
    if (!Number.isFinite(score) || score < 0 || score > 1) {
      throw new DomainError('POLICY_VIOLATION', 'Watchlist score must be between 0 and 1');
    }
    if (score >= 0.9) return 'BLOCK';
    if (score >= 0.65) return 'REVIEW';
    return 'NONE';
  },

  assertOverride(input: { decision: 'ALLOW' | 'BLOCK'; reason?: string | null; actorHasPermission: boolean }): void {
    if (!input.actorHasPermission) {
      throw new DomainError('POLICY_VIOLATION', 'Watchlist override permission is required');
    }
    this.assertMeaningfulReason(input.reason);
  },

  assertRelease(input: { status: string; reason?: string | null }): void {
    if (input.status !== 'ACTIVE') {
      throw new DomainError('INVALID_STATE_TRANSITION', 'Only active watchlist entries can be released');
    }
    this.assertMeaningfulReason(input.reason);
  },

  shouldEnforce(matches: readonly WatchlistMatch[]): boolean {
    return matches.some((match) => match.matched && this.classify(match.score) === 'BLOCK');
  },

  assertMeaningfulReason(reason?: string | null): void {
    if (!reason?.trim() || reason.trim().length < 10) {
      throw new DomainError('POLICY_VIOLATION', 'Watchlist action requires a meaningful reason');
    }
  },
};
