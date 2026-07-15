import { DomainError } from '../errors/domain-error';
import {
  enforceAuthorization,
  requirePermission,
  requireResourceOwner,
} from './authorization-policy';

describe('authorization policy', () => {
  const member = { id: 'member-1', type: 'member' as const, permissions: [] };

  it('allows an actor with the required permission', () => {
    expect(requirePermission({ ...member, permissions: ['support.read'] }, 'support.read')).toEqual({ allowed: true });
  });

  it('denies a missing permission with a stable code', () => {
    expect(requirePermission(member, 'support.read')).toEqual({
      allowed: false,
      code: 'AUTH_PERMISSION_REQUIRED',
      details: { permission: 'support.read' },
    });
  });

  it('allows the resource owner', () => {
    expect(requireResourceOwner(member, { ownerId: 'member-1' })).toEqual({ allowed: true });
  });

  it('allows a configured bypass permission', () => {
    const admin = { id: 'admin-1', type: 'admin' as const, permissions: ['support.manage'] };
    expect(requireResourceOwner(admin, { ownerId: 'member-1' }, 'support.manage')).toEqual({ allowed: true });
  });

  it('throws a domain error for a denied decision', () => {
    expect(() => enforceAuthorization(requireResourceOwner(member, { ownerId: 'member-2' })))
      .toThrow(DomainError);
  });
});
