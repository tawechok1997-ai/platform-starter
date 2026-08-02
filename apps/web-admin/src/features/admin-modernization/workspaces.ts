export type AdminWorkspaceId =
  | 'command-center'
  | 'finance'
  | 'members'
  | 'risk-compliance'
  | 'provider-operations'
  | 'games'
  | 'growth-promotions'
  | 'affiliate-commission'
  | 'content'
  | 'access-security'
  | 'settings';

export type AdminWorkspace = {
  id: AdminWorkspaceId;
  order: number;
  /** Existing production-safe landing route. Planned canonical routes can be introduced behind redirects later. */
  route: string;
  labelKey: string;
  descriptionKey: string;
  legacyPrefixes: readonly string[];
  mobilePattern: 'stack' | 'list-detail' | 'full-screen-workspace';
};

export const ADMIN_WORKSPACES: readonly AdminWorkspace[] = [
  {
    id: 'command-center',
    order: 10,
    route: '/dashboard',
    labelKey: 'admin.navigation.commandCenter.label',
    descriptionKey: 'admin.navigation.commandCenter.description',
    legacyPrefixes: ['/dashboard', '/operations', '/activity-center', '/activity'],
    mobilePattern: 'stack',
  },
  {
    id: 'finance',
    order: 20,
    route: '/topups',
    labelKey: 'admin.navigation.finance.label',
    descriptionKey: 'admin.navigation.finance.description',
    legacyPrefixes: [
      '/finance',
      '/topups',
      '/withdrawals',
      '/bulk-queue-operations',
      '/wallets',
      '/wallet-ledgers',
      '/wallet-statement',
      '/wallet-analytics',
      '/reconciliation-center',
      '/reports',
      '/exports',
      '/ledgers',
      '/money-ops',
    ],
    mobilePattern: 'list-detail',
  },
  {
    id: 'members',
    order: 30,
    route: '/members',
    labelKey: 'admin.navigation.members.label',
    descriptionKey: 'admin.navigation.members.description',
    legacyPrefixes: [
      '/members',
      '/member-insights',
      '/member-detail',
      '/bank-accounts',
      '/kyc',
      '/kyc-center',
      '/support',
      '/support-center',
    ],
    mobilePattern: 'list-detail',
  },
  {
    id: 'risk-compliance',
    order: 40,
    route: '/risk-alerts',
    labelKey: 'admin.navigation.riskCompliance.label',
    descriptionKey: 'admin.navigation.riskCompliance.description',
    legacyPrefixes: ['/risk', '/risk-alerts', '/risk-operations', '/provider-risk', '/audit-risk', '/investigation', '/blacklist', '/watchlist', '/aml'],
    mobilePattern: 'list-detail',
  },
  {
    id: 'provider-operations',
    order: 50,
    route: '/provider-health',
    labelKey: 'admin.navigation.providerOperations.label',
    descriptionKey: 'admin.navigation.providerOperations.description',
    legacyPrefixes: [
      '/providers',
      '/provider-health',
      '/simple-game-settings',
      '/provider-setup-wizard',
      '/provider-presets',
      '/game-providers',
      '/provider-credentials',
      '/provider-adapters',
      '/provider-wallet-snapshots',
      '/webhook-logs',
      '/webhook-settlement',
      '/webhook-test',
      '/adapter-test',
      '/game-api-settings',
    ],
    mobilePattern: 'full-screen-workspace',
  },
  {
    id: 'games',
    order: 60,
    route: '/games',
    labelKey: 'admin.navigation.games.label',
    descriptionKey: 'admin.navigation.games.description',
    legacyPrefixes: ['/game-control', '/game-assets', '/games', '/game-sessions', '/game-transfers'],
    mobilePattern: 'list-detail',
  },
  {
    id: 'growth-promotions',
    order: 70,
    route: '/growth-center',
    labelKey: 'admin.navigation.growthPromotions.label',
    descriptionKey: 'admin.navigation.growthPromotions.description',
    legacyPrefixes: ['/growth', '/growth-center', '/promotion-operations', '/promotion-center', '/promotion-claims', '/promotions', '/bonus-ledgers'],
    mobilePattern: 'full-screen-workspace',
  },
  {
    id: 'affiliate-commission',
    order: 80,
    route: '/affiliate-center',
    labelKey: 'admin.navigation.affiliateCommission.label',
    descriptionKey: 'admin.navigation.affiliateCommission.description',
    legacyPrefixes: ['/affiliate', '/affiliate-center', '/commission-ledgers'],
    mobilePattern: 'list-detail',
  },
  {
    id: 'content',
    order: 90,
    route: '/content-center',
    labelKey: 'admin.navigation.content.label',
    descriptionKey: 'admin.navigation.content.description',
    legacyPrefixes: ['/content', '/content-center', '/cms', '/assets'],
    mobilePattern: 'full-screen-workspace',
  },
  {
    id: 'access-security',
    order: 100,
    route: '/admin-accounts',
    labelKey: 'admin.navigation.accessSecurity.label',
    descriptionKey: 'admin.navigation.accessSecurity.description',
    legacyPrefixes: [
      '/access',
      '/admin-accounts',
      '/admin-roles',
      '/roles',
      '/admin-invitations',
      '/invitations',
      '/audit',
      '/audit-logs',
      '/security',
      '/anti-bot',
      '/profile',
    ],
    mobilePattern: 'list-detail',
  },
  {
    id: 'settings',
    order: 110,
    route: '/settings',
    labelKey: 'admin.navigation.settings.label',
    descriptionKey: 'admin.navigation.settings.description',
    legacyPrefixes: ['/settings'],
    mobilePattern: 'full-screen-workspace',
  },
] as const;

export function getWorkspaceByPathname(pathname: string): AdminWorkspace | undefined {
  return ADMIN_WORKSPACES.find((workspace) =>
    workspace.legacyPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)),
  );
}
