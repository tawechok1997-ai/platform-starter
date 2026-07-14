import { DomainError, InvalidStateTransitionError } from '../../../common/domain/domain-error';

export type SupportTicketStatus = 'OPEN' | 'REVIEWING' | 'RESOLVED' | 'DISMISSED';

const TRANSITIONS: Readonly<Record<SupportTicketStatus, readonly SupportTicketStatus[]>> = {
  OPEN: ['REVIEWING', 'RESOLVED', 'DISMISSED'],
  REVIEWING: ['OPEN', 'RESOLVED', 'DISMISSED'],
  RESOLVED: ['OPEN', 'REVIEWING'],
  DISMISSED: ['OPEN', 'REVIEWING'],
};

export const SupportTicketPolicy = {
  assertTransition(from: SupportTicketStatus, to: SupportTicketStatus): void {
    if (from === to) return;
    if (!TRANSITIONS[from].includes(to)) throw new InvalidStateTransitionError('Support ticket', from, to);
  },
  nextStatusForReply(actor: 'MEMBER' | 'ADMIN', current: SupportTicketStatus): SupportTicketStatus {
    if (actor === 'ADMIN') return 'REVIEWING';
    return current === 'RESOLVED' || current === 'DISMISSED' ? 'REVIEWING' : current;
  },
  assertResolutionReason(status: SupportTicketStatus, reason?: string | null): void {
    if (status === 'DISMISSED' && !reason?.trim()) {
      throw new DomainError('POLICY_VIOLATION', 'Dismissing a support ticket requires a reason');
    }
  },
  canReopen(status: SupportTicketStatus): boolean {
    return status === 'RESOLVED' || status === 'DISMISSED';
  },
};
