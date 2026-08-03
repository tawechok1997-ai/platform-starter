const SUPER_PERMISSION = '*';
const DEFAULT_STEP_UP_MAX_AGE_MS = 5 * 60 * 1000;
const DEFAULT_REASON_MIN_LENGTH = 8;
const FUTURE_CLOCK_SKEW_MS = 30 * 1000;

export type AdminStepUpMethod = 'totp' | 'recovery-code' | 'webauthn';
export type AdminApprovalMode = 'none' | 'single' | 'dual';

export type AdminStepUpEvidence = {
  adminUserId: string;
  sessionId: string;
  method: AdminStepUpMethod;
  verifiedAt: Date | string | number;
};

export type AdminSensitiveRevealPolicy = {
  fieldNames: readonly string[];
  ttlMs: number;
};

export type AdminSensitiveActionPolicy = {
  action: string;
  requiredPermission: string;
  requireStepUp: boolean;
  maxStepUpAgeMs?: number;
  requireReason: boolean;
  minimumReasonLength?: number;
  approvalMode: AdminApprovalMode;
  allowRequesterApproval?: boolean;
  allowTargetApproval?: boolean;
  sensitiveReveal?: AdminSensitiveRevealPolicy;
};

export type AdminSensitiveActionInput = {
  actorAdminUserId: string;
  actorSessionId: string;
  actorPermissions: readonly string[];
  requesterAdminUserId?: string | null;
  targetAdminUserId?: string | null;
  approverAdminUserIds?: readonly string[];
  reason?: string | null;
  stepUp?: AdminStepUpEvidence | null;
  now?: Date | string | number;
};

export type AdminSensitiveActionReasonCode =
  | 'missing-permission'
  | 'missing-step-up'
  | 'step-up-actor-mismatch'
  | 'step-up-session-mismatch'
  | 'invalid-step-up-time'
  | 'step-up-from-future'
  | 'stale-step-up'
  | 'reason-required'
  | 'requester-self-approval'
  | 'target-self-approval'
  | 'insufficient-approvals';

export type AdminSensitiveActionEvaluation = {
  allowed: boolean;
  reasonCodes: AdminSensitiveActionReasonCode[];
  requiredApprovalCount: number;
  validApproverAdminUserIds: string[];
  stepUpAgeMs: number | null;
};

export type AdminSensitiveActionAuditEvidence = {
  action: string;
  permission: string;
  actorAdminUserId: string;
  actorSessionId: string;
  requesterAdminUserId: string | null;
  targetAdminUserId: string | null;
  approvalMode: AdminApprovalMode;
  approverAdminUserIds: string[];
  reason: string | null;
  stepUpMethod: AdminStepUpMethod | null;
  stepUpVerifiedAt: string | null;
  revealedFieldNames: string[];
  revealExpiresAt: string | null;
};

export function evaluateAdminSensitiveAction(
  policy: AdminSensitiveActionPolicy,
  input: AdminSensitiveActionInput,
): AdminSensitiveActionEvaluation {
  const reasonCodes: AdminSensitiveActionReasonCode[] = [];
  const nowMs = timestamp(input.now ?? Date.now());
  const requiredApprovalCount = approvalCount(policy.approvalMode);
  const actorPermissions = new Set(input.actorPermissions);

  if (!actorPermissions.has(SUPER_PERMISSION) && !actorPermissions.has(policy.requiredPermission)) {
    reasonCodes.push('missing-permission');
  }

  let stepUpAgeMs: number | null = null;
  if (policy.requireStepUp) {
    if (!input.stepUp) {
      reasonCodes.push('missing-step-up');
    } else if (input.stepUp.adminUserId !== input.actorAdminUserId) {
      reasonCodes.push('step-up-actor-mismatch');
    } else if (input.stepUp.sessionId !== input.actorSessionId) {
      reasonCodes.push('step-up-session-mismatch');
    } else {
      const verifiedAtMs = timestamp(input.stepUp.verifiedAt);
      if (!Number.isFinite(verifiedAtMs) || !Number.isFinite(nowMs)) {
        reasonCodes.push('invalid-step-up-time');
      } else {
        stepUpAgeMs = nowMs - verifiedAtMs;
        if (stepUpAgeMs < -FUTURE_CLOCK_SKEW_MS) {
          reasonCodes.push('step-up-from-future');
        } else if (stepUpAgeMs > (policy.maxStepUpAgeMs ?? DEFAULT_STEP_UP_MAX_AGE_MS)) {
          reasonCodes.push('stale-step-up');
        }
      }
    }
  }

  if (policy.requireReason) {
    const minimumLength = policy.minimumReasonLength ?? DEFAULT_REASON_MIN_LENGTH;
    if ((input.reason?.trim().length ?? 0) < minimumLength) reasonCodes.push('reason-required');
  }

  const distinctApprovers = uniqueNonEmpty(input.approverAdminUserIds ?? []);
  const validApprovers = distinctApprovers.filter((adminUserId) => {
    if (!policy.allowRequesterApproval && input.requesterAdminUserId && adminUserId === input.requesterAdminUserId) {
      return false;
    }
    if (!policy.allowTargetApproval && input.targetAdminUserId && adminUserId === input.targetAdminUserId) {
      return false;
    }
    return true;
  });

  if (
    !policy.allowRequesterApproval
    && input.requesterAdminUserId
    && distinctApprovers.includes(input.requesterAdminUserId)
  ) {
    reasonCodes.push('requester-self-approval');
  }
  if (
    !policy.allowTargetApproval
    && input.targetAdminUserId
    && distinctApprovers.includes(input.targetAdminUserId)
  ) {
    reasonCodes.push('target-self-approval');
  }
  if (validApprovers.length < requiredApprovalCount) reasonCodes.push('insufficient-approvals');

  return {
    allowed: reasonCodes.length === 0,
    reasonCodes,
    requiredApprovalCount,
    validApproverAdminUserIds: validApprovers,
    stepUpAgeMs,
  };
}

export function buildAdminSensitiveActionAuditEvidence(
  policy: AdminSensitiveActionPolicy,
  input: AdminSensitiveActionInput,
  evaluation: AdminSensitiveActionEvaluation,
): AdminSensitiveActionAuditEvidence {
  if (!evaluation.allowed) throw new Error('Sensitive action policy must pass before audit evidence is created');

  const nowMs = timestamp(input.now ?? Date.now());
  const stepUpVerifiedAtMs = input.stepUp ? timestamp(input.stepUp.verifiedAt) : Number.NaN;
  const revealExpiresAt = policy.sensitiveReveal
    ? new Date(nowMs + Math.max(0, policy.sensitiveReveal.ttlMs)).toISOString()
    : null;

  return {
    action: policy.action,
    permission: policy.requiredPermission,
    actorAdminUserId: input.actorAdminUserId,
    actorSessionId: input.actorSessionId,
    requesterAdminUserId: input.requesterAdminUserId ?? null,
    targetAdminUserId: input.targetAdminUserId ?? null,
    approvalMode: policy.approvalMode,
    approverAdminUserIds: [...evaluation.validApproverAdminUserIds],
    reason: input.reason?.trim() || null,
    stepUpMethod: input.stepUp?.method ?? null,
    stepUpVerifiedAt: Number.isFinite(stepUpVerifiedAtMs) ? new Date(stepUpVerifiedAtMs).toISOString() : null,
    revealedFieldNames: policy.sensitiveReveal ? uniqueNonEmpty(policy.sensitiveReveal.fieldNames) : [],
    revealExpiresAt,
  };
}

function approvalCount(mode: AdminApprovalMode) {
  if (mode === 'dual') return 2;
  if (mode === 'single') return 1;
  return 0;
}

function timestamp(value: Date | string | number) {
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number') return value;
  return Date.parse(value);
}

function uniqueNonEmpty(values: readonly string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}
