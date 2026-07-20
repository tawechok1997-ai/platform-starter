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
    id: 'overview', title: 'ภาพรวม', description: 'สถานะระบบและงานที่ต้องตรวจ',
    items: [
      { title: 'Dashboard', href: '/dashboard', badgeKey: 'pending' },
      { title: 'งานที่ต้องตรวจ', href: '/operations', badgeKey: 'pending' },
      { title: 'กิจกรรมล่าสุด', href: '/activity-center', permissions: ['admin.view', 'admin.access.view', 'risk.view', 'reports.view'] },
    ],
  },
  {
    id: 'finance', title: 'การเงิน', description: 'ฝาก ถอน กระเป๋าเงิน และกระทบยอด',
    items: [
      { title: 'รายการฝาก', href: '/topups', permissions: ['topups.view', 'deposit.view'], badgeKey: 'topups' },
      { title: 'รายการถอน', href: '/withdrawals', permissions: ['withdraw.view'], badgeKey: 'withdrawals' },
      { title: 'จัดการหลายรายการ', href: '/bulk-queue-operations', permissions: ['topups.view', 'deposit.view', 'withdraw.view'] },
      { title: 'กระเป๋าเงินสมาชิก', href: '/wallets', permissions: ['wallet.view'] },
      { title: 'ประวัติยอดเงิน', href: '/wallet-ledgers', permissions: ['wallet.view'] },
      { title: 'กระทบยอด', href: '/reconciliation-center', permissions: ['game.providers.view', 'provider.view'] },
      { title: 'รายงานการเงิน', href: '/reports', permissions: ['reports.view'] },
      { title: 'ส่งออกรายงาน', href: '/exports', permissions: ['reports.export', 'reports.view'] },
    ],
  },
  {
    id: 'members', title: 'สมาชิก', description: 'บัญชี ข้อมูล และการยืนยันตัวตน',
    items: [
      { title: 'รายชื่อสมาชิก', href: '/members', permissions: ['users.view'] },
      { title: 'ข้อมูลเชิงลึกสมาชิก', href: '/member-insights', permissions: ['users.view'] },
      { title: 'บัญชีธนาคาร', href: '/bank-accounts', permissions: ['users.view', 'deposit.view'] },
      { title: 'ตรวจ KYC', href: '/kyc-center', permissions: ['users.view', 'risk.view'] },
      { title: 'ช่วยเหลือสมาชิก', href: '/support-center', permissions: ['users.view'] },
    ],
  },
  {
    id: 'risk', title: 'ความเสี่ยง', description: 'รายการเตือน การตรวจสอบ และบันทึกย้อนหลัง',
    items: [
      { title: 'รายการเตือน', href: '/risk-alerts', permissions: ['risk.view'] },
      { title: 'ตรวจความเสี่ยงค่ายเกม', href: '/provider-risk', permissions: ['risk.view', 'provider.view'] },
      { title: 'ตรวจบันทึกความเสี่ยง', href: '/audit-risk', permissions: ['risk.view'] },
    ],
  },
  {
    id: 'providers', title: 'เกมและค่ายเกม', description: 'เกม API และสถานะการเชื่อมต่อ',
    items: [
      { title: 'สถานะค่ายเกม', href: '/provider-health', permissions: ['game.providers.view', 'provider.view'] },
      { title: 'ตั้งค่าค่ายเกม', href: '/simple-game-settings', permissions: ['game.providers.manage', 'provider.update'] },
      { title: 'เพิ่มค่ายเกม', href: '/provider-setup-wizard', permissions: ['game.providers.manage', 'provider.update'] },
      { title: 'ชุดตั้งค่าค่ายเกม', href: '/provider-presets', permissions: ['game.providers.manage', 'provider.update'] },
      { title: 'ค่ายเกมทั้งหมด', href: '/game-providers', permissions: ['game.providers.view', 'provider.view'] },
      { title: 'เกมทั้งหมด', href: '/games', permissions: ['game.providers.view', 'provider.view'] },
      { title: 'Session เกม', href: '/game-sessions', permissions: ['game.providers.view', 'provider.view'] },
      { title: 'รายการโอนเงินเกม', href: '/game-transfers', permissions: ['game.providers.view', 'provider.view'] },
      { title: 'บันทึก Webhook', href: '/webhook-logs', permissions: ['provider.view', 'game.providers.view'] },
    ],
  },
  {
    id: 'growth', title: 'โปรโมชันและเนื้อหา', description: 'โปรโมชัน โบนัส ตัวแทน และหน้าเว็บไซต์',
    items: [
      { title: 'ภาพรวมการตลาด', href: '/growth-center', permissions: ['promotion.view', 'affiliate.view'] },
      { title: 'โปรโมชันและโบนัส', href: '/promotion-center', permissions: ['promotion.view'] },
      { title: 'คำขอรับโปรโมชัน', href: '/promotion-claims', permissions: ['promotions.claims.view'] },
      { title: 'ประวัติโบนััส', href: '/bonus-ledgers', permissions: ['bonus.ledger.view'] },
      { title: 'ตัวแทนและ Affiliate', href: '/affiliate-center', permissions: ['affiliate.view'] },
      { title: 'ประวัติคอมมิชชัน', href: '/commission-ledgers', permissions: ['commission.view'] },
      { title: 'จัดการเนื้อหาเว็บไซต์', href: '/content-center', permissions: ['settings.website.view', 'settings.update'] },
    ],
  },
  {
    id: 'administration', title: 'ผู้ดูแลและสิทธิ์', description: 'บัญชี บทบาท และสิทธิ์การใช้งาน',
    items: [
      { title: 'บัญชีผู้ดูแล', href: '/admin-accounts', permissions: ['admin.view', 'admin.access.view'] },
      { title: 'บทบาทและสิทธิ์', href: '/admin-roles', permissions: ['admin.access.view'] },
      { title: 'คำเชิญผู้ดูแล', href: '/admin-invitations', permissions: ['admin.create'] },
      { title: 'บันทึกการใช้งาน', href: '/audit', permissions: ['admin.view', 'admin.access.view'] },
    ],
  },
  {
    id: 'system', title: 'ระบบและการตั้งค่า', description: 'เว็บไซต์ ความปลอดภัย และการเชื่อมต่อ',
    items: [
      { title: 'ตั้งค่าเว็บไซต์', href: '/settings', permissions: ['settings.update', 'settings.website.view'] },
      { title: 'CAPTCHA และป้องกันบอต', href: '/anti-bot', permissions: ['security.anti_bot.view'] },
      { title: 'ความปลอดภัย', href: '/security' },
      { title: 'ข้อมูลเชื่อมต่อค่ายเกม', href: '/provider-credentials', permissions: ['provider.update', 'game.providers.manage'] },
      { title: 'ทดสอบ API ค่ายเกม', href: '/adapter-test', permissions: ['provider.update', 'game.providers.manage'] },
      { title: 'ตั้งค่า API แบบเดิม', href: '/game-api-settings', permissions: ['provider.update'] },
    ],
  },
] as const;

const additionalRoutePermissions: readonly AdminNavItem[] = [
  { title: 'จัดการสิทธิ์', href: '/access', permissions: ['admin.access.view'] },
  { title: 'กิจกรรม', href: '/activity', permissions: ['admin.view', 'admin.access.view'] },
  { title: 'บันทึกการใช้งานระบบ', href: '/audit-logs', permissions: ['admin.view', 'admin.access.view'] },
  { title: 'การเงิน', href: '/finance', permissions: ['wallet.view', 'reports.view'] },
  { title: 'ตรวจ KYC', href: '/kyc', permissions: ['users.view', 'risk.view'] },
  { title: 'ประวัติยอดเงิน', href: '/ledgers', permissions: ['wallet.view'] },
  { title: 'ข้อมูลสมาชิก', href: '/member-detail', permissions: ['users.view'] },
  { title: 'จัดการยอดเงิน', href: '/money-ops', permissions: ['wallet.view'] },
  { title: 'ตัวเชื่อมต่อค่ายเกม', href: '/provider-adapters', permissions: ['game.providers.view', 'provider.view'] },
  { title: 'ยอดเงินฝั่งค่ายเกม', href: '/provider-wallet-snapshots', permissions: ['game.providers.view', 'provider.view'] },
  { title: 'กระทบยอด Webhook', href: '/webhook-settlement', permissions: ['provider.view', 'game.providers.view'] },
  { title: 'ทดสอบ Webhook', href: '/webhook-test', permissions: ['provider.update', 'game.providers.manage'] },
];

export function canAccessNavItem(item: AdminNavItem, permissions: readonly string[]) {
  if (permissions.includes('*')) return true;
  if (!item.permissions || item.permissions.length === 0) return true;
  return item.permissions.some((permission) => permissions.includes(permission));
}

export function requiredPermissionsForPath(pathname: string) {
  const routeItems = [...navGroups.flatMap((group) => group.items), ...additionalRoutePermissions].sort((a, b) => b.href.length - a.href.length);
  for (const item of routeItems) if (pathname === item.href || pathname.startsWith(`${item.href}/`)) return item.permissions ?? [];
  return [] as readonly string[];
}
