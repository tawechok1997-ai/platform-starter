import { ForbiddenException } from '@nestjs/common';
import { REQUIRED_ANY_PERMISSIONS_KEY } from '../decorators/require-any-permission.decorator';
import { REQUIRED_PERMISSIONS_KEY } from '../decorators/require-permission.decorator';
import { PermissionsGuard } from './permissions.guard';

function contextFor(user: { permissions: string[]; deniedPermissions?: string[] }) {
  return {
    getHandler: () => function handler() {},
    getClass: () => class Controller {},
    switchToHttp: () => ({
      getRequest: () => ({
        method: 'GET',
        originalUrl: '/admin/dashboard/finance-trends',
        headers: {},
        user,
      }),
    }),
  } as never;
}

function guardFor(all: string[] = [], any: string[] = []) {
  return new PermissionsGuard({
    getAllAndOverride: (key: string) => {
      if (key === REQUIRED_PERMISSIONS_KEY) return all;
      if (key === REQUIRED_ANY_PERMISSIONS_KEY) return any;
      return [];
    },
  } as never);
}

test('any-permission route allows one held permission', () => {
  const guard = guardFor([], ['reports.view', 'wallet.view']);
  expect(guard.canActivate(contextFor({ permissions: ['wallet.view'] }))).toBe(true);
});

test('specific deny removes only that any-permission option', () => {
  const guard = guardFor([], ['reports.view', 'wallet.view']);
  expect(guard.canActivate(contextFor({
    permissions: ['reports.view', 'wallet.view'],
    deniedPermissions: ['reports.view'],
  }))).toBe(true);
});

test('any-permission route fails when no allowed option remains', () => {
  const guard = guardFor([], ['reports.view', 'wallet.view']);
  expect(() => guard.canActivate(contextFor({
    permissions: ['reports.view'],
    deniedPermissions: ['reports.view'],
  }))).toThrow(ForbiddenException);
});

test('wildcard deny blocks any-permission routes', () => {
  const guard = guardFor([], ['reports.view', 'wallet.view']);
  expect(() => guard.canActivate(contextFor({
    permissions: ['*'],
    deniedPermissions: ['*'],
  }))).toThrow(ForbiddenException);
});
