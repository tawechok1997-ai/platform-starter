import { DomainError } from '../../../common/domain/domain-error';

export type WatchlistMatch = {
  matched: boolean;
  score: number;
  source: string;
  normalizedValue: string;
};

export const WatchlistPolicy = {
  classify(score: number): 'NONE' | 'REVIEW' | 'BLOCK' {
    if (!Number.isFinite(score) || score < 0 || score > 1) throw new DomainError('POLICY_VIOLATION', 'Watchlist score must be between 0 and 1');
    if (score >= 0.9) return 'BLOCK';
    if (score >= 0.65) return 'REVIEW';
    return 'NONE';
  },
  assertOverride(input: { decision: 'ALLOW' | 'BLOCK'; reason?: string | null; actorHasPermission: boolean }): void {
    if (!input.actorHasPermission) throw new DomainError('POLICY_VIOLATION', 'Watchlist override permission is required');
    if (!input.reason?.trim() || input.reason.trim().length < 10) throw new DomainError('POLICY_VIOLATION', 'Watchlist override requires a meaningful reason');
  },
  shouldEnforce(matches: readonly WatchlistMatch[]): boolean {
    return matches.some((match) => match.matched && this.classify(match.score) === 'BLOCK');
  },
};
