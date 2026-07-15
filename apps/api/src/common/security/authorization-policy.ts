import { DomainError } from '../errors/domain-error';

export type AuthorizationActor = {
  id: string;
  type: 'admin' | 'member' | 'system';
  permissions?: readonly string[];
  roles?: readonly string[];
};

export type AuthorizationResource = {
  ownerId?: string | null;
  tenantId?: string | null;
};

export type AuthorizationDecision =
  | { allowed: true }
  | { allowed: false; code: 'AUTH_PERMISSION_REQUIRED' | 'AUTH_RESOURCE_FORBIDDEN'; details?: Record<string, unknown> };

export function requirePermission(actor: AuthorizationActor, permission: string): AuthorizationDecision {
  if (actor.type === 'system') return { allowed: true };
  if (actor.permissions?.includes(permission)) return { allowed: true };
  return { allowed: false, code: 'AUTH_PERMISSION_REQUIRED', details: { permission } };
}

export function requireResourceOwner(
  actor: AuthorizationActor,
  resource: AuthorizationResource,
  bypassPermission?: string,
): AuthorizationDecision {
  if (resource.ownerId && resource.ownerId === actor.id) return { allowed: true };
  if (bypassPermission && actor.permissions?.includes(bypassPermission)) return { allowed: true };
  return { allowed: false, code: 'AUTH_RESOURCE_FORBIDDEN' };
}

export function enforceAuthorization(decision: AuthorizationDecision): void {
  if (decision.allowed) return;
  throw new DomainError({
    code: decision.code,
    category: 'forbidden',
    message: decision.code === 'AUTH_PERMISSION_REQUIRED'
      ? 'Required permission is missing'
      : 'Access to this resource is not allowed',
    details: decision.details,
  });
}
