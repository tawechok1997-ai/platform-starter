type AdminNavItem = {
  title: string;
  href: string;
  permissions?: readonly string[];
};

type AdminNavGroup = {
  title: string;
  items: readonly AdminNavItem[];
};

export const navGroups: readonly AdminNavGroup[] = [
  {
    title: 'งานหลัก',
    items: [
      { title: 'Dashboard', href: '/dashboard' },
      { title: 'งานแอดมิน', href: '/operations' },
      { title: 'ตรวจฝาก', href: '/topups', permissions: ['topups.view', 'deposit.view'] },
      { title: 'ตรวจถอน', href: '/withdrawals', permissions: ['withdraw.view'] },
      { title: 'สมาชิก', href: '/members', permissions: ['users.view'] },
      { title: 'บัญชีธนาคาร', href: '/bank-accounts', permissions: ['users.view', 'deposit.view'] },
    ],
  },
  {
    title: 'การเงิน',
    items: [
      { title: 'วอเลต', href: '/wallets', permissions: ['wallet.view'] },
      { title: 'ประวัติเงิน', href: '/wallet-ledgers', permissions: ['wallet.view'] },
      { title: 'ปัญหาที่ต้องดู', href: '/risk-alerts', permissions: ['risk.view'] },
      { title: 'รายงาน', href: '/reports', permissions: ['reports.view'] },
    ],
  },
  {
    title: 'ค่ายเกม',
    items: [
      { title: 'ตั้งค่าง่าย', href: '/simple-game-settings', permissions: ['game.providers.manage', 'provider.update'] },
      { title: 'เพิ่มค่ายใหม่', href: '/provider-setup-wizard', permissions: ['game.providers.manage', 'provider.update'] },
      { title: 'แบบตั้งค่าค่าย', href: '/provider-presets', permissions: ['game.providers.manage', 'provider.update'] },
      { title: 'ดูการโยกเงิน', href: '/game-transfers', permissions: ['game.providers.view', 'provider.view'] },
      { title: 'ตรวจยอดค่าย', href: '/reconciliation-center', permissions: ['game.providers.view', 'provider.view'] },
    ],
  },
  {
    title: 'สินค้า/การตลาด',
    items: [
      { title: 'ศูนย์ฟีเจอร์สินค้า', href: '/growth-center', permissions: ['promotion.view', 'affiliate.view'] },
      { title: 'โปรโมชัน/โบนัส', href: '/promotion-center', permissions: ['promotion.view'] },
      { title: 'คำขอรับโปร', href: '/promotion-claims', permissions: ['promotions.claims.view'] },
      { title: 'Bonus Ledger', href: '/bonus-ledgers', permissions: ['bonus.ledger.view'] },
      { title: 'ตัวแทน/Affiliate', href: '/affiliate-center', permissions: ['affiliate.view'] },
      { title: 'Commission Ledger', href: '/commission-ledgers', permissions: ['commission.view'] },
      { title: 'CMS/คอนเทนต์', href: '/content-center', permissions: ['settings.website.view', 'settings.update'] },
      { title: 'KYC/ตรวจบัญชี', href: '/kyc-center', permissions: ['users.view', 'risk.view'] },
      { title: 'Support', href: '/support-center', permissions: ['users.view'] },
    ],
  },
  {
    title: 'ขั้นสูง',
    items: [
      { title: 'เปลี่ยน API Key', href: '/provider-credentials', permissions: ['provider.update', 'game.providers.manage'] },
      { title: 'ทดสอบ API ค่าย', href: '/adapter-test', permissions: ['provider.update', 'game.providers.manage'] },
      { title: 'Webhook', href: '/webhook-logs', permissions: ['provider.view', 'game.providers.view'] },
      { title: 'ตรวจค่ายละเอียด', href: '/provider-risk', permissions: ['risk.view', 'provider.view'] },
      { title: 'ตั้งค่า API เดิม', href: '/game-api-settings', permissions: ['provider.update'] },
      { title: 'ค่ายทั้งหมด', href: '/game-providers', permissions: ['game.providers.view', 'provider.view'] },
      { title: 'เกมทั้งหมด', href: '/games', permissions: ['game.providers.view', 'provider.view'] },
      { title: 'Session เกม', href: '/game-sessions', permissions: ['game.providers.view', 'provider.view'] },
      { title: 'Audit Risk', href: '/audit-risk', permissions: ['risk.view'] },
      { title: 'Audit Logs', href: '/audit', permissions: ['admin.view', 'admin.access.view'] },
    ],
  },
  {
    title: 'ตั้งค่า',
    items: [
      { title: 'ตั้งค่าเว็บไซต์', href: '/settings', permissions: ['settings.update', 'settings.website.view'] },
      { title: 'CAPTCHA / Anti-bot', href: '/anti-bot', permissions: ['security.anti_bot.view'] },
      { title: 'บัญชีผู้ดูแล', href: '/admin-accounts', permissions: ['admin.view', 'admin.access.view'] },
      { title: 'Roles & Permissions', href: '/admin-roles', permissions: ['admin.access.view'] },
      { title: 'คำเชิญผู้ดูแล', href: '/admin-invitations', permissions: ['admin.create'] },
      { title: 'ความปลอดภัย', href: '/security' },
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
