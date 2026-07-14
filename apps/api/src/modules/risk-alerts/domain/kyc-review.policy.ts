import { DomainError, InvalidStateTransitionError } from '../../../common/domain/domain-error';

export type KycStatus = 'DRAFT' | 'SUBMITTED' | 'REVIEWING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';

const TRANSITIONS: Readonly<Record<KycStatus, readonly KycStatus[]>> = {
  DRAFT: ['SUBMITTED'],
  SUBMITTED: ['REVIEWING', 'APPROVED', 'REJECTED'],
  REVIEWING: ['APPROVED', 'REJECTED'],
  APPROVED: ['EXPIRED'],
  REJECTED: ['DRAFT', 'SUBMITTED'],
  EXPIRED: ['DRAFT', 'SUBMITTED'],
};

export const KycReviewPolicy = {
  assertTransition(from: KycStatus, to: KycStatus): void {
    if (!TRANSITIONS[from].includes(to)) throw new InvalidStateTransitionError('KYC case', from, to);
  },

  isReviewable(status: string): status is 'SUBMITTED' | 'REVIEWING' {
    return status === 'SUBMITTED' || status === 'REVIEWING';
  },

  assertReviewReason(status: KycStatus, reason?: string | null): void {
    if (status === 'REJECTED' && !reason?.trim()) {
      throw new DomainError('POLICY_VIOLATION', 'A reason is required when KYC is rejected');
    }
  },

  requiresReviewedAt(status: KycStatus): boolean {
    return status === 'APPROVED' || status === 'REJECTED';
  },

  canAccessDocuments(input: { reviewerAssigned: boolean; caseStatus: KycStatus; hasPermission: boolean }): boolean {
    return input.hasPermission && input.reviewerAssigned && ['SUBMITTED', 'REVIEWING'].includes(input.caseStatus);
  },
};
