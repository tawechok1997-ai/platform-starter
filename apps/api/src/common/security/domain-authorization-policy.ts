import {
  AuthorizationActor,
  AuthorizationDecision,
  requirePermission,
} from './authorization-policy';

export const AUTHORIZATION_DOMAINS = [
  'finance',
  'admin_lifecycle',
  'kyc_risk',
  'support_notifications',
  'cms_reports',
] as const;

type AuthorizationDomain = (typeof AUTHORIZATION_DOMAINS)[number];

type DomainAuthorizationRule = {
  domain: AuthorizationDomain;
  permissionPrefixes: readonly string[];
};

const DOMAIN_AUTHORIZATION_RULES: readonly DomainAuthorizationRule[] = [
  {
    domain: 'finance',
    permissionPrefixes: ['finance.', 'wallet.', 'bank.', 'deposit.', 'withdrawal.', 'topup.'],
  },
  {
    domain: 'admin_lifecycle',
    permissionPrefixes: ['admin.', 'role.', 'permission.', 'security.', 'session.'],
  },
  {
    domain: 'kyc_risk',
    permissionPrefixes: ['kyc.', 'risk.', 'watchlist.', 'blacklist.'],
  },
  {
    domain: 'support_notifications',
    permissionPrefixes: ['support.', 'notification.', 'faq.'],
  },
  {
    domain: 'cms_reports',
    permissionPrefixes: ['cms.', 'content.', 'report.', 'activity.', 'setting.'],
  },
] as const;

export function resolveAuthorizationDomain(permission: string): AuthorizationDomain | null {
  const normalized = String(permission ?? '').trim().toLowerCase();
  if (!normalized) return null;
  return DOMAIN_AUTHORIZATION_RULES.find((rule) =>
    rule.permissionPrefixes.some((prefix) => normalized.startsWith(prefix)),
  )?.domain ?? null;
}

export function authorizeDomainPermission(
  actor: AuthorizationActor,
  domain: AuthorizationDomain,
  permission: string,
): AuthorizationDecision {
  const resolvedDomain = resolveAuthorizationDomain(permission);
  if (resolvedDomain !== domain) {
    return {
      allowed: false,
      code: 'AUTH_PERMISSION_REQUIRED',
      details: { domain, permission, resolvedDomain },
    };
  }
  return requirePermission(actor, permission);
}
