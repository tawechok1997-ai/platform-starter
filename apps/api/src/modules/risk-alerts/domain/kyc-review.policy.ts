import { DomainError, InvalidStateTransitionError } from '../../../common/domain/domain-error';

export type KycStatus = 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'EXPIRED';

const TRANSITIONS: Readonly<Record<KycStatus, readonly KycStatus[]>> = {
  PENDING: ['IN_REVIEW', 'REJECTED', 'EXPIRED'],
  IN_REVIEW: ['APPROVED', 'REJECTED', 'EXPIRED'],
  APPROVED: ['EXPIRED'],
  REJECTED: ['PENDING'],
  EXPIRED: ['PENDING'],
};

export const KycReviewPolicy = {
  assertTransition(from: KycStatus, to: KycStatus): void {
    if (!TRANSITIONS[from].includes(to)) throw new InvalidStateTransitionError('KYC case', from, to);
  },
  assertReviewReason(status: KycStatus, reason?: string | null): void {
    if ((status === 'REJECTED' || status === 'EXPIRED') && !reason?.trim()) {
      throw new DomainError('POLICY_VIOLATION', `A reason is required when KYC is ${status.toLowerCase()}`);
    }
  },
  canAccessDocuments(input: { reviewerAssigned: boolean; caseStatus: KycStatus; hasPermission: boolean }): boolean {
    return input.hasPermission && input.reviewerAssigned && ['PENDING', 'IN_REVIEW'].includes(input.caseStatus);
  },
};
