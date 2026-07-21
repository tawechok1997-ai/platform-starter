export type AdminNavItem = {
  title: string;
  titleEn?: string;
  href: string;
  permissions?: readonly string[];
  badgeKey?: 'topups' | 'withdrawals' | 'pending';
  /** Keep advanced routes available through Command Palette and deep links, but out of the daily sidebar. */
  sidebar?: boolean;
};

export type AdminNavGroup = {
  id: string;
  title: string;
  titleEn?: string;
  description?: string;
  descriptionEn?: string;
  items: readonly AdminNavItem[];
};

export type AdminLocale = 'th' | 'en';

export function localizedNavTitle(item: Pick<AdminNavItem, 'title' | 'titleEn'>, locale: AdminLocale) {
  return locale === 'en' ? item.titleEn ?? item.title : item.title;
}

export function localizedNavGroupTitle(group: Pick<AdminNavGroup, 'title' | 'titleEn'>, locale: AdminLocale) {
  return locale === 'en' ? group.titleEn ?? group.title : group.title;
}

export function localizedNavGroupDescription(group: Pick<AdminNavGroup, 'description' | 'descriptionEn'>, locale: AdminLocale) {
  return locale === 'en' ? group.descriptionEn ?? group.description : group.description;
}

export const navGroups: readonly AdminNavGroup[] = [
  {
    id: 'overview', title: 'ภาพรวม', titleEn: 'Overview', description: 'สถานะและคิวงาน', descriptionEn: 'System status and queues',
    items: [
      { title: 'Dashboard', titleEn: 'Dashboard', href: '/dashboard', badgeKey: 'pending' },
      { title: 'งานที่ต้องตรวจ', titleEn: 'Review queue', href: '/operations', badgeKey: 'pending' },
      { title: 'กิจกรรมล่าสุด', titleEn: 'Activity', href: '/activity-center', permissions: ['admin.view', 'admin.access.view', 'risk.view', 'reports.view'] },
    ],
  },
  {
    id: 'finance', title: 'การเงิน', titleEn: 'Finance', description: 'ฝาก ถอน และยอดเงิน', descriptionEn: 'Deposits, withdrawals, and balances',
    items: [
      { title: 'รายการฝาก', titleEn: 'Top ups', href: '/topups', permissions: ['topups.view', 'deposit.view'], badgeKey: 'topups' },
      { title: 'รายการถอน', titleEn: 'Withdrawals', href: '/withdrawals', permissions: ['withdraw.view'], badgeKey: 'withdrawals' },
      { title: 'จัดการหลายรายการ', titleEn: 'Bulk review', href: '/bulk-queue-operations', permissions: ['topups.view', 'deposit.view', 'withdraw.view'], sidebar: false },
      { title: 'กระเป๋าเงินสมาชิก', titleEn: 'Member wallets', href: '/wallets', permissions: ['wallet.view'] },
      { title: 'ประวัติยอดเงิน', titleEn: 'Wallet ledger', href: '/wallet-ledgers', permissions: ['wallet.view'] },
      { title: 'Wallet Statement', titleEn: 'Wallet statement', href: '/wallet-statement', permissions: ['wallet.view'], sidebar: false },
      { title: 'Wallet Analytics', titleEn: 'Wallet analytics', href: '/wallet-analytics', permissions: ['wallet.view', 'reports.view'], sidebar: false },
      { title: 'กระทบยอด', titleEn: 'Reconciliation', href: '/reconciliation-center', permissions: ['game.providers.view', 'provider.view'] },
      { title: 'รายงานการเงิน', titleEn: 'Finance reports', href: '/reports', permissions: ['reports.view'] },
      { title: 'ส่งออกรายงาน', titleEn: 'Exports', href: '/exports', permissions: ['reports.export', 'reports.view'], sidebar: false },
    ],
  },
  {
    id: 'members', title: 'สมาชิก', titleEn: 'Members', description: 'บัญชีและการยืนยันตัวตน', descriptionEn: 'Accounts and verification',
    items: [
      { title: 'รายชื่อสมาชิก', titleEn: 'Members', href: '/members', permissions: ['users.view'] },
      { title: 'ข้อมูลเชิงลึกสมาชิก', titleEn: 'Member insights', href: '/member-insights', permissions: ['users.view'] },
      { title: 'บัญชีธนาคาร', titleEn: 'Bank accounts', href: '/bank-accounts', permissions: ['users.view', 'deposit.view'] },
      { title: 'ตรวจ KYC', titleEn: 'KYC review', href: '/kyc-center', permissions: ['users.view', 'risk.view'] },
      { title: 'ช่วยเหลือสมาชิก', titleEn: 'Support', href: '/support-center', permissions: ['users.view'] },
    ],
  },
  {
    id: 'risk', title: 'ความเสี่ยง', titleEn: 'Risk', description: 'รายการเตือนและการตรวจสอบ', descriptionEn: 'Alerts and reviews',
    items: [
      { title: 'รายการเตือน', titleEn: 'Risk alerts', href: '/risk-alerts', permissions: ['risk.view'] },
      { title: 'ตรวจความเสี่ยงค่ายเกม', titleEn: 'Provider risk', href: '/provider-risk', permissions: ['risk.view', 'provider.view'] },
      { title: 'ตรวจบันทึกความเสี่ยง', titleEn: 'Risk audit', href: '/audit-risk', permissions: ['risk.view'] },
    ],
  },
  {
    id: 'providers', title: 'เกมและค่ายเกม', titleEn: 'Games & providers', description: 'เกม API และการเชื่อมต่อ', descriptionEn: 'Games, APIs, and connections',
    items: [
      { title: 'สถานะค่ายเกม', titleEn: 'Provider health', href: '/provider-health', permissions: ['game.providers.view', 'provider.view'] },
      { title: 'ตั้งค่าค่ายเกม', titleEn: 'Provider setup', href: '/simple-game-settings', permissions: ['game.providers.manage', 'provider.update'] },
      { title: 'เพิ่มค่ายเกม', titleEn: 'Add provider', href: '/provider-setup-wizard', permissions: ['game.providers.manage', 'provider.update'] },
      { title: 'ชุดตั้งค่าค่ายเกม', titleEn: 'Provider presets', href: '/provider-presets', permissions: ['game.providers.manage', 'provider.update'] },
      { title: 'ค่ายเกมทั้งหมด', titleEn: 'Game providers', href: '/game-providers', permissions: ['game.providers.view', 'provider.view'] },
      { title: 'เกมทั้งหมด', titleEn: 'Games', href: '/games', permissions: ['game.providers.view', 'provider.view'] },
      { title: 'Session เกม', titleEn: 'Game sessions', href: '/game-sessions', permissions: ['game.providers.view', 'provider.view'] },
      { title: 'รายการโอนเงินเกม', titleEn: 'Game transfers', href: '/game-transfers', permissions: ['game.providers.view', 'provider.view'] },
      { title: 'บันทึก Webhook', titleEn: 'Webhook logs', href: '/webhook-logs', permissions: ['provider.view', 'game.providers.view'] },
    ],
  },
  {
    id: 'growth', title: 'โปรโมชันและเนื้อหา', titleEn: 'Growth & content', description: 'โปรโมชัน โบนัส และเนื้อหา', descriptionEn: 'Promotions, bonuses, and content',
    items: [
      { title: 'ภาพรวมการตลาด', titleEn: 'Growth overview', href: '/growth-center', permissions: ['promotion.view', 'affiliate.view'] },
      { title: 'Promotion Operations', titleEn: 'Promotion operations', href: '/promotion-operations', permissions: ['promotion.view', 'promotions.claims.view'] },
      { title: 'โปรโมชันและโบนัส', titleEn: 'Promotions & bonuses', href: '/promotion-center', permissions: ['promotion.view'] },
      { title: 'คำขอรับโปรโมชัน', titleEn: 'Promotion claims', href: '/promotion-claims', permissions: ['promotions.claims.view'] },
      { title: 'ประวัติโบนัส', titleEn: 'Bonus ledger', href: '/bonus-ledgers', permissions: ['bonus.ledger.view'] },
      { title: 'ตัวแทนและ Affiliate', titleEn: 'Affiliates', href: '/affiliate-center', permissions: ['affiliate.view'] },
      { title: 'ประวัติคอมมิชชัน', titleEn: 'Commission ledger', href: '/commission-ledgers', permissions: ['commission.view'] },
      { title: 'จัดการเนื้อหาเว็บไซต์', titleEn: 'Content', href: '/content-center', permissions: ['settings.website.view', 'settings.update'] },
    ],
  },
  {
    id: 'administration', title: 'บัญชีผู้ดูแลและสิทธิ์', titleEn: 'Administration', description: 'บัญชี บทบาท และการตรวจสอบ', descriptionEn: 'Accounts, roles, and audit',
    items: [
      { title: 'บัญชีผู้ดูแล', titleEn: 'Admin accounts', href: '/admin-accounts', permissions: ['admin.view', 'admin.access.view'] },
      { title: 'บทบาทและสิทธิ์', titleEn: 'Roles & permissions', href: '/admin-roles', permissions: ['admin.access.view'] },
      { title: 'คำเชิญผู้ดูแล', titleEn: 'Admin invitations', href: '/admin-invitations', permissions: ['admin.create'] },
      { title: 'บันทึกการใช้งาน', titleEn: 'Audit log', href: '/audit', permissions: ['admin.view', 'admin.access.view'] },
    ],
  },
  {
    id: 'system', title: 'ระบบและการตั้งค่า', titleEn: 'System & settings', description: 'เว็บไซต์ ความปลอดภัย และการเชื่อมต่อ', descriptionEn: 'Website, security, and connections',
    items: [
      { title: 'ตั้งค่าเว็บไซต์', titleEn: 'Website settings', href: '/settings', permissions: ['settings.update', 'settings.website.view'] },
      { title: 'CAPTCHA และป้องกันบอต', titleEn: 'CAPTCHA & bot protection', href: '/anti-bot', permissions: ['security.anti_bot.view'] },
      { title: 'ความปลอดภัย', titleEn: 'Security', href: '/security' },
      { title: 'ข้อมูลเชื่อมต่อค่ายเกม', titleEn: 'Provider credentials', href: '/provider-credentials', permissions: ['provider.update', 'game.providers.manage'], sidebar: false },
      { title: 'ทดสอบ API ค่ายเกม', titleEn: 'Provider API test', href: '/adapter-test', permissions: ['provider.update', 'game.providers.manage'], sidebar: false },
      { title: 'ตั้งค่า API แบบเดิม', titleEn: 'Legacy API settings', href: '/game-api-settings', permissions: ['provider.update'], sidebar: false },
    ],
  },
] as const;

const additionalRoutePermissions: readonly AdminNavItem[] = [
  { title: 'โปรไฟล์ของฉัน', href: '/profile' },
  { title: 'จัดการสิทธิ์', href: '/access', permissions: ['admin.access.view'] },
  { title: 'กิจกรรม', href: '/activity', permissions: ['admin.view', 'admin.access.view'] },
  { title: 'AML Review Center', href: '/aml', permissions: ['risk.view'] },
  { title: 'บันทึกการใช้งานเดิม', href: '/audit-logs', permissions: ['admin.view', 'admin.access.view'] },
  { title: 'บัญชีดำ', href: '/blacklist', permissions: ['risk.view'] },
  { title: 'การเงิน', href: '/finance', permissions: ['wallet.view', 'reports.view'] },
  { title: 'ตรวจ KYC', href: '/kyc', permissions: ['users.view', 'risk.view'] },
  { title: 'ประวัติยอดเงิน', href: '/ledgers', permissions: ['wallet.view'] },
  { title: 'ข้อมูลสมาชิก', href: '/member-detail', permissions: ['users.view'] },
  { title: 'จัดการยอดเงิน', href: '/money-ops', permissions: ['wallet.view'] },
  { title: 'ตัวเชื่อมต่อค่ายเกม', href: '/provider-adapters', permissions: ['game.providers.view', 'provider.view'] },
  { title: 'ยอดเงินฝั่งค่ายเกม', href: '/provider-wallet-snapshots', permissions: ['game.providers.view', 'provider.view'] },
  { title: 'ปฏิบัติการความเสี่ยง', href: '/risk-operations', permissions: ['risk.view'] },
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
