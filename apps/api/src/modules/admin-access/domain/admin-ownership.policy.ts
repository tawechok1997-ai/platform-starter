import { DomainError } from '../../../common/domain/domain-error';

export const AdminOwnershipPolicy = {
  assertCanDeactivate(input: { targetIsOwner: boolean; activeOwnerCount: number; actorId: string; targetId: string }): void {
    if (input.actorId === input.targetId) throw new DomainError('POLICY_VIOLATION', 'Administrators cannot deactivate their own account');
    if (input.targetIsOwner && input.activeOwnerCount <= 1) throw new DomainError('POLICY_VIOLATION', 'The last active owner cannot be deactivated');
  },

  assertCanTransfer(input: { actorIsOwner: boolean; actorId: string; targetId: string; targetActive: boolean }): void {
    if (!input.actorIsOwner) throw new DomainError('POLICY_VIOLATION', 'Only an owner can transfer ownership');
    if (input.actorId === input.targetId) throw new DomainError('POLICY_VIOLATION', 'Ownership must be transferred to another administrator');
    if (!input.targetActive) throw new DomainError('POLICY_VIOLATION', 'Ownership can only be transferred to an active administrator');
  },

  requiresStepUp(action: 'TRANSFER_OWNERSHIP' | 'RESET_2FA' | 'CHANGE_OWNER_ROLE' | 'REVOKE_ALL_SESSIONS'): boolean {
    return ['TRANSFER_OWNERSHIP', 'RESET_2FA', 'CHANGE_OWNER_ROLE', 'REVOKE_ALL_SESSIONS'].includes(action);
  },
};
