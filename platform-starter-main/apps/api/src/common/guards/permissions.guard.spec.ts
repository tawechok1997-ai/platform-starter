import { ForbiddenException } from '@nestjs/common';
import { PermissionsGuard } from './permissions.guard';

function createContext(permissions: string[]) {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({ user: { permissions } }),
    }),
  } as any;
}

describe('PermissionsGuard', () => {
  function createGuard(required?: string[]) {
    const reflector = {
      getAllAndOverride: () => required,
    } as any;
    return new PermissionsGuard(reflector);
  }

  it('allows routes without required permissions', () => {
    expect(createGuard(undefined).canActivate(createContext([]))).toBe(true);
  });

  it('allows when every required permission is present', () => {
    const guard = createGuard(['deposit.view', 'deposit.review']);
    expect(guard.canActivate(createContext(['deposit.view', 'deposit.review']))).toBe(true);
  });

  it('allows wildcard permission for any protected route', () => {
    const guard = createGuard(['wallet.adjust']);
    expect(guard.canActivate(createContext(['*']))).toBe(true);
  });

  it('does not treat admin.access.manage as global access', () => {
    const guard = createGuard(['wallet.adjust']);
    expect(() => guard.canActivate(createContext(['admin.access.manage']))).toThrow(ForbiddenException);
  });

  it('allows admin.access.manage only when explicitly required', () => {
    const guard = createGuard(['admin.access.manage']);
    expect(guard.canActivate(createContext(['admin.access.manage']))).toBe(true);
  });

  it('throws when any required permission is missing', () => {
    const guard = createGuard(['admin.access.view', 'admin.access.manage']);
    expect(() => guard.canActivate(createContext(['admin.access.view']))).toThrow(ForbiddenException);
  });
});
