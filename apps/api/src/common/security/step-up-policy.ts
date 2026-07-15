import { DomainError } from '../errors/domain-error';

export type StepUpContext = {
  verifiedAt?: Date | string | null;
  method?: 'totp' | 'webauthn' | 'recovery_code' | 'password' | null;
};

export type StepUpRequirement = {
  maxAgeMs: number;
  allowedMethods?: readonly StepUpContext['method'][];
};

export function isFreshStepUp(
  context: StepUpContext | null | undefined,
  requirement: StepUpRequirement,
  now = new Date(),
): boolean {
  if (!context?.verifiedAt) return false;
  const verifiedAt = context.verifiedAt instanceof Date
    ? context.verifiedAt
    : new Date(context.verifiedAt);
  if (!Number.isFinite(verifiedAt.getTime())) return false;
  if (verifiedAt.getTime() > now.getTime()) return false;
  if (now.getTime() - verifiedAt.getTime() > requirement.maxAgeMs) return false;
  if (requirement.allowedMethods?.length && !requirement.allowedMethods.includes(context.method ?? null)) return false;
  return true;
}

export function requireFreshStepUp(
  context: StepUpContext | null | undefined,
  requirement: StepUpRequirement,
  now = new Date(),
): void {
  if (isFreshStepUp(context, requirement, now)) return;
  throw new DomainError({
    code: 'AUTH_STEP_UP_REQUIRED',
    category: 'unauthorized',
    message: 'Recent step-up verification is required',
    details: { maxAgeMs: requirement.maxAgeMs },
  });
}
