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
    legacyPrefixes: ['/dashboard', '/operations', '/activity-center'],
    mobilePattern: 'stack',
  },
  {
    id: 'finance',
    order: 20,
    route: '/finance',
    labelKey: 'admin.navigation.finance.label',
    descriptionKey: 'admin.navigation.finance.description',
    legacyPrefixes: ['/topups', '/withdrawals', '/wallets', '/wallet-ledgers', '/reconciliation', '/reports'],
    mobilePattern: 'list-detail',
  },
  {
    id: 'members',
    order: 30,
    route: '/members',
    labelKey: 'admin.navigation.members.label',
    descriptionKey: 'admin.navigation.members.description',
    legacyPrefixes: ['/members', '/member-insights', '/bank-accounts', '/kyc', '/support'],
    mobilePattern: 'list-detail',
  },
  {
    id: 'risk-compliance',
    order: 40,
    route: '/risk',
    labelKey: 'admin.navigation.riskCompliance.label',
    descriptionKey: 'admin.navigation.riskCompliance.description',
    legacyPrefixes: ['/risk-alerts', '/provider-risk', '/audit-risk', '/blacklist', '/watchlist', '/aml'],
    mobilePattern: 'list-detail',
  },
  {
    id: 'provider-operations',
    order: 50,
    route: '/providers',
    labelKey: 'admin.navigation.providerOperations.label',
    descriptionKey: 'admin.navigation.providerOperations.description',
    legacyPrefixes: ['/simple-game-settings', '/setup-wizard', '/provider-presets', '/game-providers', '/provider-health', '/webhook-logs'],
    mobilePattern: 'full-screen-workspace',
  },
  {
    id: 'games',
    order: 60,
    route: '/games',
    labelKey: 'admin.navigation.games.label',
    descriptionKey: 'admin.navigation.games.description',
    legacyPrefixes: ['/games', '/game-sessions', '/game-transfers'],
    mobilePattern: 'list-detail',
  },
  {
    id: 'growth-promotions',
    order: 70,
    route: '/growth',
    labelKey: 'admin.navigation.growthPromotions.label',
    descriptionKey: 'admin.navigation.growthPromotions.description',
    legacyPrefixes: ['/growth-center', '/promotion-operations', '/promotion-center', '/promotion-claims', '/bonus-ledgers'],
    mobilePattern: 'full-screen-workspace',
  },
  {
    id: 'affiliate-commission',
    order: 80,
    route: '/affiliates',
    labelKey: 'admin.navigation.affiliateCommission.label',
    descriptionKey: 'admin.navigation.affiliateCommission.description',
    legacyPrefixes: ['/affiliate', '/commission-ledgers'],
    mobilePattern: 'list-detail',
  },
  {
    id: 'content',
    order: 90,
    route: '/content',
    labelKey: 'admin.navigation.content.label',
    descriptionKey: 'admin.navigation.content.description',
    legacyPrefixes: ['/content-center', '/cms', '/assets'],
    mobilePattern: 'full-screen-workspace',
  },
  {
    id: 'access-security',
    order: 100,
    route: '/access',
    labelKey: 'admin.navigation.accessSecurity.label',
    descriptionKey: 'admin.navigation.accessSecurity.description',
    legacyPrefixes: ['/admin-accounts', '/roles', '/invitations', '/audit', '/security', '/anti-bot'],
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
