import { DomainError, InvalidStateTransitionError } from '../../../common/domain/domain-error';

export type SupportTicketStatus = 'OPEN' | 'WAITING_MEMBER' | 'WAITING_SUPPORT' | 'RESOLVED' | 'CLOSED';

const TRANSITIONS: Readonly<Record<SupportTicketStatus, readonly SupportTicketStatus[]>> = {
  OPEN: ['WAITING_MEMBER', 'WAITING_SUPPORT', 'RESOLVED', 'CLOSED'],
  WAITING_MEMBER: ['WAITING_SUPPORT', 'RESOLVED', 'CLOSED'],
  WAITING_SUPPORT: ['WAITING_MEMBER', 'RESOLVED', 'CLOSED'],
  RESOLVED: ['OPEN', 'CLOSED'],
  CLOSED: ['OPEN'],
};

export const SupportTicketPolicy = {
  assertTransition(from: SupportTicketStatus, to: SupportTicketStatus): void {
    if (!TRANSITIONS[from].includes(to)) throw new InvalidStateTransitionError('Support ticket', from, to);
  },
  nextStatusForReply(actor: 'MEMBER' | 'ADMIN'): SupportTicketStatus {
    return actor === 'MEMBER' ? 'WAITING_SUPPORT' : 'WAITING_MEMBER';
  },
  assertCloseReason(reason?: string | null): void {
    if (!reason?.trim()) throw new DomainError('POLICY_VIOLATION', 'Closing a support ticket requires a reason');
  },
  canReopen(status: SupportTicketStatus): boolean {
    return status === 'RESOLVED' || status === 'CLOSED';
  },
};
