import {
  AUTHORIZATION_DOMAINS,
  authorizeDomainPermission,
  resolveAuthorizationDomain,
} from './domain-authorization-policy';

describe('domain authorization policy', () => {
  it.each([
    ['finance.withdrawal.approve', 'finance'],
    ['bank_accounts.review', 'finance'],
    ['admin.owner.transfer', 'admin_lifecycle'],
    ['users.suspend', 'admin_lifecycle'],
    ['kyc.case.review', 'kyc_risk'],
    ['support.ticket.update', 'support_notifications'],
    ['report.export', 'cms_reports'],
    ['reports.view', 'cms_reports'],
    ['settings.features.update', 'cms_reports'],
    ['affiliate.review', 'growth_rewards'],
    ['bonus.lifecycle.update', 'growth_rewards'],
    ['game.providers.manage', 'provider_games'],
  ] as const)('maps %s to %s', (permission, domain) => {
    expect(resolveAuthorizationDomain(permission)).toBe(domain);
  });

  it('covers all declared domains', () => {
    expect(AUTHORIZATION_DOMAINS).toEqual([
      'finance',
      'admin_lifecycle',
      'kyc_risk',
      'support_notifications',
      'cms_reports',
      'growth_rewards',
      'provider_games',
    ]);
  });

  it('allows matching domain permission', () => {
    expect(authorizeDomainPermission({
      id: 'admin-1',
      type: 'admin',
      permissions: ['support.ticket.update'],
    }, 'support_notifications', 'support.ticket.update')).toEqual({ allowed: true });
  });

  it('rejects cross-domain permission use', () => {
    expect(authorizeDomainPermission({
      id: 'admin-1',
      type: 'admin',
      permissions: ['finance.withdrawal.approve'],
    }, 'support_notifications', 'finance.withdrawal.approve')).toEqual(expect.objectContaining({
      allowed: false,
      code: 'AUTH_PERMISSION_REQUIRED',
    }));
  });
});
