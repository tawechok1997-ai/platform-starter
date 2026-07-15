import { DomainError } from '../errors/domain-error';

type AuditRequirement = {
  action: string;
  reasonRequired?: boolean;
  minimumReasonLength?: number;
  maximumReasonLength?: number;
  auditEventRequired?: boolean;
};

type AuditDecisionInput = {
  reason?: string | null;
  auditEvent?: string | null;
};

type AuditDecision = {
  reason: string | null;
  auditEvent: string | null;
};

export function enforceReasonAndAudit(
  requirement: AuditRequirement,
  input: AuditDecisionInput,
): AuditDecision {
  const minimumReasonLength = Math.max(requirement.minimumReasonLength ?? 3, 1);
  const maximumReasonLength = Math.max(requirement.maximumReasonLength ?? 500, minimumReasonLength);
  const reason = normalizeReason(input.reason);
  const auditEvent = normalizeAuditEvent(input.auditEvent);

  if (requirement.reasonRequired && !reason) {
    throw new DomainError({
      code: 'AUTH_REASON_REQUIRED',
      category: 'validation',
      message: `A reason is required for ${requirement.action}`,
      details: { action: requirement.action },
    });
  }

  if (reason && reason.length < minimumReasonLength) {
    throw new DomainError({
      code: 'AUTH_REASON_TOO_SHORT',
      category: 'validation',
      message: `Reason must contain at least ${minimumReasonLength} characters`,
      details: { action: requirement.action, minimumReasonLength },
    });
  }

  if (reason && reason.length > maximumReasonLength) {
    throw new DomainError({
      code: 'AUTH_REASON_TOO_LONG',
      category: 'validation',
      message: `Reason must contain at most ${maximumReasonLength} characters`,
      details: { action: requirement.action, maximumReasonLength },
    });
  }

  if (requirement.auditEventRequired && !auditEvent) {
    throw new DomainError({
      code: 'AUTH_AUDIT_EVENT_REQUIRED',
      category: 'internal',
      message: `An audit event is required for ${requirement.action}`,
      details: { action: requirement.action },
    });
  }

  return { reason, auditEvent };
}

function normalizeReason(value?: string | null): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.normalize('NFKC').replace(/\s+/g, ' ').trim();
  return normalized || null;
}

function normalizeAuditEvent(value?: string | null): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return /^[a-z][a-z0-9_.:-]{2,127}$/.test(normalized) ? normalized : null;
}
