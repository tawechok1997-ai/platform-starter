import {
  buildAdminSensitiveActionAuditEvidence,
  evaluateAdminSensitiveAction,
  type AdminSensitiveActionInput,
  type AdminSensitiveActionPolicy,
} from './admin-sensitive-action-policy';

const NOW = '2026-08-03T02:00:00.000Z';

const DUAL_APPROVAL_POLICY: AdminSensitiveActionPolicy = {
  action: 'admin.access.change',
  requiredPermission: 'admin.access.manage',
  requireStepUp: true,
  maxStepUpAgeMs: 5 * 60 * 1000,
  requireReason: true,
  minimumReasonLength: 8,
  approvalMode: 'dual',
  allowRequesterApproval: false,
  allowTargetApproval: false,
};

function validInput(patch: Partial<AdminSensitiveActionInput> = {}): AdminSensitiveActionInput {
  return {
    actorAdminUserId: 'admin-actor',
    actorSessionId: 'session-actor',
    actorPermissions: ['admin.access.manage'],
    requesterAdminUserId: 'admin-requester',
    targetAdminUserId: 'admin-target',
    approverAdminUserIds: ['admin-approver-a', 'admin-approver-b'],
    reason: 'Approved by security operations',
    stepUp: {
      adminUserId: 'admin-actor',
      sessionId: 'session-actor',
      method: 'totp',
      verifiedAt: '2026-08-03T01:58:00.000Z',
    },
    now: NOW,
    ...patch,
  };
}

describe('admin sensitive action policy', () => {
  test('allows a dual-approved action with fresh step-up evidence', () => {
    const evaluation = evaluateAdminSensitiveAction(DUAL_APPROVAL_POLICY, validInput());

    expect(evaluation.allowed).toBe(true);
    expect(evaluation.reasonCodes).toEqual([]);
    expect(evaluation.requiredApprovalCount).toBe(2);
    expect(evaluation.validApproverAdminUserIds).toEqual(['admin-approver-a', 'admin-approver-b']);
    expect(evaluation.stepUpAgeMs).toBe(2 * 60 * 1000);
  });

  test('fails closed when permission, reason, and step-up evidence are missing', () => {
    const evaluation = evaluateAdminSensitiveAction(DUAL_APPROVAL_POLICY, validInput({
      actorPermissions: ['users.view'],
      reason: 'short',
      stepUp: null,
      approverAdminUserIds: [],
    }));

    expect(evaluation.allowed).toBe(false);
    expect(evaluation.reasonCodes).toEqual([
      'missing-permission',
      'missing-step-up',
      'reason-required',
      'insufficient-approvals',
    ]);
  });

  test('rejects requester and target self-approval even when two IDs are supplied', () => {
    const evaluation = evaluateAdminSensitiveAction(DUAL_APPROVAL_POLICY, validInput({
      approverAdminUserIds: ['admin-requester', 'admin-target'],
    }));

    expect(evaluation.allowed).toBe(false);
    expect(evaluation.validApproverAdminUserIds).toEqual([]);
    expect(evaluation.reasonCodes).toEqual([
      'requester-self-approval',
      'target-self-approval',
      'insufficient-approvals',
    ]);
  });

  test('deduplicates approvers before enforcing dual approval', () => {
    const evaluation = evaluateAdminSensitiveAction(DUAL_APPROVAL_POLICY, validInput({
      approverAdminUserIds: ['admin-approver-a', 'admin-approver-a', '  admin-approver-a  '],
    }));

    expect(evaluation.allowed).toBe(false);
    expect(evaluation.validApproverAdminUserIds).toEqual(['admin-approver-a']);
    expect(evaluation.reasonCodes).toEqual(['insufficient-approvals']);
  });

  test('rejects stale, cross-admin, and cross-session step-up evidence', () => {
    expect(evaluateAdminSensitiveAction(DUAL_APPROVAL_POLICY, validInput({
      stepUp: {
        adminUserId: 'admin-actor',
        sessionId: 'session-actor',
        method: 'totp',
        verifiedAt: '2026-08-03T01:50:00.000Z',
      },
    })).reasonCodes).toContain('stale-step-up');

    expect(evaluateAdminSensitiveAction(DUAL_APPROVAL_POLICY, validInput({
      stepUp: {
        adminUserId: 'another-admin',
        sessionId: 'session-actor',
        method: 'totp',
        verifiedAt: '2026-08-03T01:59:00.000Z',
      },
    })).reasonCodes).toContain('step-up-actor-mismatch');

    expect(evaluateAdminSensitiveAction(DUAL_APPROVAL_POLICY, validInput({
      stepUp: {
        adminUserId: 'admin-actor',
        sessionId: 'another-session',
        method: 'totp',
        verifiedAt: '2026-08-03T01:59:00.000Z',
      },
    })).reasonCodes).toContain('step-up-session-mismatch');
  });

  test('accepts wildcard authority but still requires approval and step-up controls', () => {
    const allowed = evaluateAdminSensitiveAction(DUAL_APPROVAL_POLICY, validInput({ actorPermissions: ['*'] }));
    const denied = evaluateAdminSensitiveAction(DUAL_APPROVAL_POLICY, validInput({
      actorPermissions: ['*'],
      approverAdminUserIds: [],
    }));

    expect(allowed.allowed).toBe(true);
    expect(denied.allowed).toBe(false);
    expect(denied.reasonCodes).toEqual(['insufficient-approvals']);
  });

  test('builds reveal audit evidence with field names and expiry but never secret values', () => {
    const policy: AdminSensitiveActionPolicy = {
      ...DUAL_APPROVAL_POLICY,
      action: 'provider.credentials.reveal',
      requiredPermission: 'provider.update',
      approvalMode: 'single',
      sensitiveReveal: {
        fieldNames: ['apiKey', 'apiSecret', 'apiSecret'],
        ttlMs: 60_000,
      },
    };
    const input = validInput({
      actorPermissions: ['provider.update'],
      approverAdminUserIds: ['admin-approver-a'],
    });
    const evaluation = evaluateAdminSensitiveAction(policy, input);
    const evidence = buildAdminSensitiveActionAuditEvidence(policy, input, evaluation);

    expect(evidence.revealedFieldNames).toEqual(['apiKey', 'apiSecret']);
    expect(evidence.revealExpiresAt).toBe('2026-08-03T02:01:00.000Z');
    expect(evidence.stepUpMethod).toBe('totp');
    expect(JSON.stringify(evidence)).not.toContain('credential-value');
  });

  test('refuses to create audit evidence for a denied action', () => {
    const input = validInput({ approverAdminUserIds: [] });
    const evaluation = evaluateAdminSensitiveAction(DUAL_APPROVAL_POLICY, input);

    expect(() => buildAdminSensitiveActionAuditEvidence(DUAL_APPROVAL_POLICY, input, evaluation))
      .toThrow('Sensitive action policy must pass before audit evidence is created');
  });
});
