import { ForbiddenException } from '@nestjs/common';
import {
  ADMIN_OWNERSHIP_TRANSFER_POLICY,
  enforceAdminSensitiveAction,
  requestSensitiveActionPolicy,
} from './admin-sensitive-action-enforcement';

const now = new Date('2026-08-05T00:00:00.000Z');

test('request enforcement records policy evidence after permission and reason pass', () => {
  const result = enforceAdminSensitiveAction(
    requestSensitiveActionPolicy({
      action: 'admin.access.permission-override',
      requiredPermission: 'admin.permissions.override',
      requireReason: true,
    }),
    {
      actorAdminUserId: 'admin-1',
      actorSessionId: 'session-1',
      actorPermissions: ['admin.permissions.override'],
      targetAdminUserId: 'admin-2',
      reason: 'Temporary incident response override',
      now,
    },
  );

  expect(result.evaluation.allowed).toBe(true);
  expect(result.auditEvidence.action).toBe('admin.access.permission-override');
  expect(result.auditEvidence.targetAdminUserId).toBe('admin-2');
  expect(result.auditEvidence.reason).toBe('Temporary incident response override');
});

test('request enforcement fails closed when a required reason is absent', () => {
  expect(() =>
    enforceAdminSensitiveAction(
      requestSensitiveActionPolicy({
        action: 'admin.access.role-sync',
        requiredPermission: 'admin.access.manage',
        requireReason: true,
      }),
      {
        actorAdminUserId: 'admin-1',
        actorSessionId: 'session-1',
        actorPermissions: ['admin.access.manage'],
        targetAdminUserId: 'admin-2',
        now,
      },
    ),
  ).toThrow(ForbiddenException);
});

test('ownership transfer requires fresh actor and session-bound step-up evidence', () => {
  expect(() =>
    enforceAdminSensitiveAction(ADMIN_OWNERSHIP_TRANSFER_POLICY, {
      actorAdminUserId: 'admin-1',
      actorSessionId: 'session-1',
      actorPermissions: ['*'],
      requesterAdminUserId: 'admin-1',
      targetAdminUserId: 'admin-2',
      reason: 'Planned owner rotation',
      stepUp: {
        adminUserId: 'admin-1',
        sessionId: 'another-session',
        method: 'totp',
        verifiedAt: now,
      },
      now,
    }),
  ).toThrow(ForbiddenException);

  const result = enforceAdminSensitiveAction(ADMIN_OWNERSHIP_TRANSFER_POLICY, {
    actorAdminUserId: 'admin-1',
    actorSessionId: 'session-1',
    actorPermissions: ['*'],
    requesterAdminUserId: 'admin-1',
    targetAdminUserId: 'admin-2',
    reason: 'Planned owner rotation',
    stepUp: {
      adminUserId: 'admin-1',
      sessionId: 'session-1',
      method: 'totp',
      verifiedAt: now,
    },
    now,
  });

  expect(result.auditEvidence.stepUpMethod).toBe('totp');
  expect(result.auditEvidence.actorSessionId).toBe('session-1');
});
