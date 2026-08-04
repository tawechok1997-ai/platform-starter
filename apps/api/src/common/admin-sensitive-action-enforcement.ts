import { ForbiddenException } from '@nestjs/common';
import {
  buildAdminSensitiveActionAuditEvidence,
  evaluateAdminSensitiveAction,
  type AdminSensitiveActionAuditEvidence,
  type AdminSensitiveActionEvaluation,
  type AdminSensitiveActionInput,
  type AdminSensitiveActionPolicy,
} from './admin-sensitive-action-policy';

export type EnforcedAdminSensitiveAction = {
  evaluation: AdminSensitiveActionEvaluation;
  auditEvidence: AdminSensitiveActionAuditEvidence;
};

export function enforceAdminSensitiveAction(
  policy: AdminSensitiveActionPolicy,
  input: AdminSensitiveActionInput,
): EnforcedAdminSensitiveAction {
  const evaluation = evaluateAdminSensitiveAction(policy, input);
  if (!evaluation.allowed) {
    throw new ForbiddenException({
      statusCode: 403,
      code: 'ADMIN_SENSITIVE_ACTION_POLICY_DENIED',
      message: 'Sensitive admin action policy denied the request',
      action: policy.action,
      reasonCodes: evaluation.reasonCodes,
      requiredApprovalCount: evaluation.requiredApprovalCount,
    });
  }

  return {
    evaluation,
    auditEvidence: buildAdminSensitiveActionAuditEvidence(policy, input, evaluation),
  };
}

export function requestSensitiveActionPolicy(options: {
  action: string;
  requiredPermission: string;
  requireReason?: boolean;
}): AdminSensitiveActionPolicy {
  return Object.freeze({
    action: options.action,
    requiredPermission: options.requiredPermission,
    requireStepUp: false,
    requireReason: options.requireReason === true,
    approvalMode: 'none',
    allowRequesterApproval: false,
    allowTargetApproval: false,
  });
}

export const ADMIN_OWNERSHIP_TRANSFER_POLICY: AdminSensitiveActionPolicy = Object.freeze({
  action: 'admin.access.ownership-transfer',
  requiredPermission: 'admin.access.manage',
  requireStepUp: true,
  requireReason: true,
  minimumReasonLength: 5,
  approvalMode: 'none',
  allowRequesterApproval: false,
  allowTargetApproval: false,
});
