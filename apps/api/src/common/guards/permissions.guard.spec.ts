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
  it('allows when required permissions are present', () => {
    const reflector = {
      getAllAndOverride: () => ['deposit.view'],
    } as any;

    const guard = new PermissionsGuard(reflector);
    expect(guard.canActivate(createContext(['deposit.view']))).toBe(true);
  });

  it('throws when permission is missing', () => {
    const reflector = {
      getAllAndOverride: () => ['withdraw.success'],
    } as any;

    const guard = new PermissionsGuard(reflector);
    expect(() => guard.canActivate(createContext(['withdraw.view']))).toThrow(ForbiddenException);
  });
});
