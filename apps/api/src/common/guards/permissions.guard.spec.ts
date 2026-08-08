import { ForbiddenException } from '@nestjs/common';
import { PermissionsGuard } from './permissions.guard';

function createContext(permissions: string[], requestOverrides: Record<string, unknown> = {}) {
  const request = {
    method: 'GET',
    originalUrl: '/admin/example',
    body: {},
    headers: {},
    params: {},
    user: { id: 'admin-1', sessionId: 'session-1', permissions, deniedPermissions: [] },
    ...requestOverrides,
  };
  return {
    request,
    context: {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({ getRequest: () => request }),
    } as any,
  };
}

describe('PermissionsGuard', () => {
  function createGuard(required?: string[]) {
    let call = 0;
    const reflector = {
      getAllAndOverride: () => {
        call += 1;
        return call % 2 === 1 ? required : [];
      },
    } as any;
    return new PermissionsGuard(reflector);
  }

  it('allows routes without required permissions', () => {
    expect(createGuard(undefined).canActivate(createContext([]).context)).toBe(true);
  });

  it('allows when every required permission is present', () => {
    const guard = createGuard(['deposit.view', 'deposit.review']);
    expect(guard.canActivate(createContext(['deposit.view', 'deposit.review']).context)).toBe(true);
  });

  it('allows wildcard permission for any protected route', () => {
    const guard = createGuard(['wallet.adjust']);
    expect(guard.canActivate(createContext(['*']).context)).toBe(true);
  });

  it('does not treat admin.access.manage as global access', () => {
    const guard = createGuard(['wallet.adjust']);
    expect(() => guard.canActivate(createContext(['admin.access.manage']).context)).toThrow(ForbiddenException);
  });

  it('allows admin.access.manage only when explicitly required', () => {
    const guard = createGuard(['admin.access.manage']);
    expect(guard.canActivate(createContext(['admin.access.manage']).context)).toBe(true);
  });

  it('throws when any required permission is missing', () => {
    const guard = createGuard(['admin.access.view', 'admin.access.manage']);
    expect(() => guard.canActivate(createContext(['admin.access.view']).context)).toThrow(ForbiddenException);
  });

  it('requires a reason for a real failed-transfer retry', () => {
    const guard = createGuard(['game.providers.manage']);
    const { context } = createContext(['game.providers.manage'], {
      method: 'POST',
      originalUrl: '/admin/game-transfers/transfer-1/retry',
      body: {},
    });
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('allows a real failed-transfer retry only with authenticated context and sufficient reason', () => {
    const guard = createGuard(['game.providers.manage']);
    const { context, request } = createContext(['game.providers.manage'], {
      method: 'POST',
      originalUrl: '/admin/game-transfers/transfer-1/retry',
      body: { reason: 'provider timeout confirmed before retry' },
    });
    expect(guard.canActivate(context)).toBe(true);
    expect(request.adminSensitiveActionAudit).toMatchObject({
      permission: 'game.providers.manage',
      reason: 'provider timeout confirmed before retry',
    });
  });
});
