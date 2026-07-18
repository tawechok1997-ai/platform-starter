export type AdminNavItem = {
  title: string;
  href: string;
  permissions?: readonly string[];
  badgeKey?: 'topups' | 'withdrawals' | 'pending';
};

export type AdminNavGroup = {
  id: string;
  title: string;
  description?: string;
  items: readonly AdminNavItem[];
};

export const navGroups: readonly AdminNavGroup[] = [
  {
    id: 'overview',
    title: 'ภาพรวม',
    description: 'สถานะและงานเร่งด่วน',
    items: [
      { title: 'Dashboard', href: '/dashboard', badgeKey: 'pending' },
      { title: 'ศูนย์งานแอดมิน', href: '/operations', badgeKey: 'pending' },
      { title: 'กิจกรรมและเหตุการณ์สำคัญ', href: '/activity-center', permissions: ['admin.view', 'admin.access.view', 'risk.view', 'reports.view'] },
    ],
  },
  {
    id: 'finance',
    title: 'การเงิน',
    description: 'ฝาก ถอน วอเลต และการกระทบยอด',
    items: [
      { title: 'ตรวจรายการฝาก', href: '/topups', permissions: ['topups.view', 'deposit.view'], badgeKey: 'topups' },
      { title: 'ตรวจรายการถอน', href: '/withdrawals', permissions: ['withdraw.view'], badgeKey: 'withdrawals' },
      { title: 'วอเลตสมาชิก', href: '/wallets', permissions: ['wallet.view'] },
      { title: 'ประวัติเงิน', href: '/wallet-ledgers', permissions: ['wallet.view'] },
      { title: 'ศูนย์กระทบยอด', href: '/reconciliation-center', permissions: ['game.providers.view', 'provider.view'] },
      { title: 'รายงานการเงิน', href: '/reports', permissions: ['reports.view'] },
    ],
  },
  {
    id: 'members',
    title: 'สมาชิก',
    description: 'บัญชี ข้อมูล และการตรวจสอบสมาชิก',
    items: [
      { title: 'รายชื่อสมาชิก', href: '/members', permissions: ['users.view'] },
      { title: 'Member Intelligence', href: '/member-insights', permissions: ['users.view'] },
      { title: 'บัญชีธนาคาร', href: '/bank-accounts', permissions: ['users.view', 'deposit.view'] },
      { title: 'KYC และตรวจบัญชี', href: '/kyc-center', permissions: ['users.view', 'risk.view'] },
      { title: 'ฝ่ายสนับสนุน', href: '/support-center', permissions: ['users.view'] },
    ],
  },
  {
    id: 'risk',
    title: 'ความเสี่ยง',
    description: 'Alert การตรวจสอบ และ Audit',
    items: [
      { title: 'Risk Alerts', href: '/risk-alerts', permissions: ['risk.view'] },
      { title: 'ตรวจค่ายละเอียด', href: '/provider-risk', permissions: ['risk.view', 'provider.view'] },
      { title: 'Audit Risk', href: '/audit-risk', permissions: ['risk.view'] },
    ],
  },
  {
    id: 'providers',
    title: 'เกมและผู้ให้บริการ',
    description: 'เกม ค่าย API และสถานะการเชื่อมต่อ',
    items: [
      { title: 'Provider Health', href: '/provider-health', permissions: ['game.providers.view', 'provider.view'] },
      { title: 'ตั้งค่าค่ายแบบง่าย', href: '/simple-game-settings', permissions: ['game.providers.manage', 'provider.update'] },
      { title: 'เพิ่มค่ายใหม่', href: '/provider-setup-wizard', permissions: ['game.providers.manage', 'provider.update'] },
      { title: 'แบบตั้งค่าค่าย', href: '/provider-presets', permissions: ['game.providers.manage', 'provider.update'] },
      { title: 'ค่ายทั้งหมด', href: '/game-providers', permissions: ['game.providers.view', 'provider.view'] },
      { title: 'เกมทั้งหมด', href: '/games', permissions: ['game.providers.view', 'provider.view'] },
      { title: 'Session เกม', href: '/game-sessions', permissions: ['game.providers.view', 'provider.view'] },
      { title: 'การโยกเงินเกม', href: '/game-transfers', permissions: ['game.providers.view', 'provider.view'] },
      { title: 'Webhook Logs', href: '/webhook-logs', permissions: ['provider.view', 'game.providers.view'] },
    ],
  },
  {
    id: 'growth',
    title: 'โปรโมชั่นและเนื้อหา',
    description: 'การตลาด โบนัส Affiliate และ CMS',
    items: [
      { title: 'ศูนย์การเติบโต', href: '/growth-center', permissions: ['promotion.view', 'affiliate.view'] },
      { title: 'โปรโมชันและโบนัส', href: '/promotion-center', permissions: ['promotion.view'] },
      { title: 'คำขอรับโปร', href: '/promotion-claims', permissions: ['promotions.claims.view'] },
      { title: 'Bonus Ledger', href: '/bonus-ledgers', permissions: ['bonus.ledger.view'] },
      { title: 'ตัวแทนและ Affiliate', href: '/affiliate-center', permissions: ['affiliate.view'] },
      { title: 'Commission Ledger', href: '/commission-ledgers', permissions: ['commission.view'] },
      { title: 'CMS และคอนเทนต์', href: '/content-center', permissions: ['settings.website.view', 'settings.update'] },
    ],
  },
  {
    id: 'administration',
    title: 'ผู้ดูแลและสิทธิ์',
    description: 'บัญชี ตำแหน่ง Role และ Permission',
    items: [
      { title: 'บัญชีผู้ดูแล', href: '/admin-accounts', permissions: ['admin.view', 'admin.access.view'] },
      { title: 'Roles และ Permissions', href: '/admin-roles', permissions: ['admin.access.view'] },
      { title: 'คำเชิญผู้ดูแล', href: '/admin-invitations', permissions: ['admin.create'] },
      { title: 'Audit Logs', href: '/audit', permissions: ['admin.view', 'admin.access.view'] },
    ],
  },
  {
    id: 'system',
    title: 'ระบบและการตั้งค่า',
    description: 'บริการ ความปลอดภัย และ Integration',
    items: [
      { title: 'ตั้งค่าเว็บไซต์', href: '/settings', permissions: ['settings.update', 'settings.website.view'] },
      { title: 'CAPTCHA และ Anti-bot', href: '/anti-bot', permissions: ['security.anti_bot.view'] },
      { title: 'ความปลอดภัย', href: '/security' },
      { title: 'Provider Credentials', href: '/provider-credentials', permissions: ['provider.update', 'game.providers.manage'] },
      { title: 'ทดสอบ API ค่าย', href: '/adapter-test', permissions: ['provider.update', 'game.providers.manage'] },
      { title: 'ตั้งค่า API เดิม', href: '/game-api-settings', permissions: ['provider.update'] },
    ],
  },
] as const;

const additionalRoutePermissions: readonly AdminNavItem[] = [
  { title: 'Access Control', href: '/access', permissions: ['admin.access.view'] },
  { title: 'Activity', href: '/activity', permissions: ['admin.view', 'admin.access.view'] },
  { title: 'Exports', href: '/exports', permissions: ['reports.export', 'reports.view'] },
  { title: 'Finance', href: '/finance', permissions: ['wallet.view', 'reports.view'] },
  { title: 'KYC Review', href: '/kyc', permissions: ['users.view', 'risk.view'] },
  { title: 'Ledgers', href: '/ledgers', permissions: ['wallet.view'] },
  { title: 'Member Detail', href: '/member-detail', permissions: ['users.view'] },
  { title: 'Money Ops', href: '/money-ops', permissions: ['wallet.view'] },
  { title: 'Provider Adapters', href: '/provider-adapters', permissions: ['game.providers.view', 'provider.view'] },
  { title: 'Provider Wallet Snapshots', href: '/provider-wallet-snapshots', permissions: ['game.providers.view', 'provider.view'] },
  { title: 'Webhook Settlement', href: '/webhook-settlement', permissions: ['provider.view', 'game.providers.view'] },
  { title: 'Webhook Test', href: '/webhook-test', permissions: ['provider.update', 'game.providers.manage'] },
];

export function canAccessNavItem(item: AdminNavItem, permissions: readonly string[]) {
  if (permissions.includes('*')) return true;
  if (!item.permissions || item.permissions.length === 0) return true;
  return item.permissions.some((permission) => permissions.includes(permission));
}

export function requiredPermissionsForPath(pathname: string) {
  const routeItems = [...navGroups.flatMap((group) => group.items), ...additionalRoutePermissions]
    .sort((a, b) => b.href.length - a.href.length);
  for (const item of routeItems) {
    if (pathname === item.href || pathname.startsWith(`${item.href}/`)) return item.permissions ?? [];
  }
  return [] as readonly string[];
}
