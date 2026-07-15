import type { ProviderAdapterContext } from './provider-adapter.interface';

export type ProviderReadinessIssueCode =
  | 'PROVIDER_CODE_REQUIRED'
  | 'BASE_URL_REQUIRED'
  | 'BASE_URL_INVALID'
  | 'TIMEOUT_INVALID'
  | 'CURRENCY_INVALID'
  | 'ENDPOINT_REQUIRED'
  | 'ENDPOINT_INVALID'
  | 'CREDENTIAL_REQUIRED';

export type ProviderReadinessIssue = {
  code: ProviderReadinessIssueCode;
  field: string;
  message: string;
};

export type ProviderReadinessRequirement = {
  endpoints?: readonly string[];
  credentials?: readonly string[];
};

export type ProviderReadinessResult = {
  ready: boolean;
  issues: ProviderReadinessIssue[];
};

export function validateProviderReadiness(
  context: ProviderAdapterContext,
  requirement: ProviderReadinessRequirement = {},
): ProviderReadinessResult {
  const issues: ProviderReadinessIssue[] = [];

  if (!context.providerCode?.trim()) {
    issues.push(issue('PROVIDER_CODE_REQUIRED', 'providerCode', 'Provider code is required'));
  }

  if (!context.baseUrl?.trim()) {
    issues.push(issue('BASE_URL_REQUIRED', 'baseUrl', 'Provider base URL is required'));
  } else if (!isSafeHttpUrl(context.baseUrl)) {
    issues.push(issue('BASE_URL_INVALID', 'baseUrl', 'Provider base URL must be an absolute HTTP(S) URL without embedded credentials'));
  }

  if (!Number.isFinite(context.timeoutMs) || context.timeoutMs < 100 || context.timeoutMs > 60_000) {
    issues.push(issue('TIMEOUT_INVALID', 'timeoutMs', 'Provider timeout must be between 100 and 60000 milliseconds'));
  }

  if (!/^[A-Z]{3}$/.test(context.currency ?? '')) {
    issues.push(issue('CURRENCY_INVALID', 'currency', 'Provider currency must be a three-letter uppercase code'));
  }

  for (const endpointType of requirement.endpoints ?? []) {
    const endpoint = context.endpointMap?.[endpointType as keyof typeof context.endpointMap];
    if (!endpoint?.trim()) {
      issues.push(issue('ENDPOINT_REQUIRED', `endpointMap.${endpointType}`, `Required provider endpoint is missing: ${endpointType}`));
      continue;
    }
    if (!isSafeHttpUrl(endpoint, context.baseUrl)) {
      issues.push(issue('ENDPOINT_INVALID', `endpointMap.${endpointType}`, `Provider endpoint must be a safe absolute or base-relative HTTP(S) URL: ${endpointType}`));
    }
  }

  for (const credentialType of requirement.credentials ?? []) {
    const credential = context.credentialMap?.[credentialType];
    if (!credential?.trim()) {
      issues.push(issue('CREDENTIAL_REQUIRED', `credentialMap.${credentialType}`, `Required provider credential is missing: ${credentialType}`));
    }
  }

  return { ready: issues.length === 0, issues };
}

function isSafeHttpUrl(value: string, baseUrl?: string): boolean {
  try {
    const url = baseUrl ? new URL(value, baseUrl) : new URL(value);
    return (url.protocol === 'https:' || url.protocol === 'http:') && !url.username && !url.password;
  } catch {
    return false;
  }
}

function issue(code: ProviderReadinessIssueCode, field: string, message: string): ProviderReadinessIssue {
  return { code, field, message };
}
