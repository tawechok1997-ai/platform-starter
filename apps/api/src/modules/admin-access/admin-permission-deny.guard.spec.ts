import { ForbiddenException } from '@nestjs/common';
import { PermissionsGuard } from '../../common/guards/permissions.guard';

function contextFor(user: { permissions: string[]; deniedPermissions?: string[] }) {
  return {
    getHandler: () => function handler() {},
    getClass: () => class Controller {},
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as never;
}

function guardFor(required: string[]) {
  return new PermissionsGuard({
    getAllAndOverride: () => required,
  } as never);
}

test('permission guard allows wildcard access when no deny override exists', () => {
  const guard = guardFor(['wallet.adjust']);
  expect(guard.canActivate(contextFor({ permissions: ['*'] }))).toBe(true);
});

test('permission guard applies specific deny before wildcard access', () => {
  const guard = guardFor(['wallet.adjust']);
  expect(() =>
    guard.canActivate(
      contextFor({ permissions: ['*'], deniedPermissions: ['wallet.adjust'] }),
    ),
  ).toThrow(ForbiddenException);
});

test('permission guard applies wildcard deny to every route permission', () => {
  const guard = guardFor(['members.view']);
  expect(() =>
    guard.canActivate(
      contextFor({ permissions: ['members.view'], deniedPermissions: ['*'] }),
    ),
  ).toThrow(ForbiddenException);
});
