import { ForbiddenException } from '@nestjs/common';
import { PermissionsGuard } from './permissions.guard';

function guardFor(required: string[]) {
  return new PermissionsGuard({
    getAllAndOverride: () => required,
  } as never);
}

function contextFor(options: {
  permission: string;
  method: string;
  url: string;
  reason?: string;
  sessionId?: string;
  targetAdminUserId?: string;
  headers?: Record<string, string>;
}) {
  const request: any = {
    method: options.method,
    url: options.url,
    headers: options.headers ?? {},
    params: options.targetAdminUserId ? { adminUserId: options.targetAdminUserId } : {},
    body: options.reason ? { reason: options.reason } : {},
    user: {
      id: 'admin-1',
      sessionId: options.sessionId ?? 'session-1',
      permissions: [options.permission],
      deniedPermissions: [],
    },
  };
  return {
    request,
    context: {
      getHandler: () => function handler() {},
      getClass: () => class Controller {},
      switchToHttp: () => ({ getRequest: () => request }),
    } as never,
  };
}

test('sensitive settings mutations receive fail-closed policy evidence without inventing a reason', () => {
  const { context, request } = contextFor({
    permission: 'settings.scripts.update',
    method: 'PUT',
    url: '/api/admin/settings/scripts',
    headers: { 'x-admin-settings-impact': 'sensitive' },
  });

  expect(guardFor(['settings.scripts.update']).canActivate(context)).toBe(true);
  expect(request.adminSensitiveActionAudit.permission).toBe('settings.scripts.update');
  expect(request.adminSensitiveActionAudit.actorSessionId).toBe('session-1');
});

test('permission override fails closed when its mandatory reason is missing', () => {
  const { context } = contextFor({
    permission: 'admin.permissions.override',
    method: 'PATCH',
    url: '/api/admin/access/admin-users/admin-2/permission-overrides',
    targetAdminUserId: 'admin-2',
  });

  expect(() => guardFor(['admin.permissions.override']).canActivate(context)).toThrow(
    ForbiddenException,
  );
});

test('permission override records target and reason after policy passes', () => {
  const { context, request } = contextFor({
    permission: 'admin.permissions.override',
    method: 'PATCH',
    url: '/api/admin/access/admin-users/admin-2/permission-overrides',
    targetAdminUserId: 'admin-2',
    reason: 'Temporary deny during incident review',
  });

  expect(guardFor(['admin.permissions.override']).canActivate(context)).toBe(true);
  expect(request.adminSensitiveActionAudit.targetAdminUserId).toBe('admin-2');
  expect(request.adminSensitiveActionAudit.reason).toBe(
    'Temporary deny during incident review',
  );
});

test('sensitive mutation rejects a missing authenticated session context', () => {
  const { context } = contextFor({
    permission: 'settings.features.update',
    method: 'PUT',
    url: '/api/admin/settings/features',
    sessionId: '',
  });

  expect(() => guardFor(['settings.features.update']).canActivate(context)).toThrow(
    ForbiddenException,
  );
});
