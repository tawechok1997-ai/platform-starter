import {
  AUTHORIZATION_DOMAINS,
  authorizeDomainPermission,
  resolveAuthorizationDomain,
} from './domain-authorization-policy';

describe('domain authorization policy', () => {
  it.each([
    ['finance.withdrawal.approve', 'finance'],
    ['admin.owner.transfer', 'admin_lifecycle'],
    ['kyc.case.review', 'kyc_risk'],
    ['support.ticket.update', 'support_notifications'],
    ['report.export', 'cms_reports'],
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
