import type { AdminLocale } from './admin-locale';

export type AdminNavItem = {
  title: string;
  titleEn?: string;
  href: string;
  permissions?: readonly string[];
  permissionTargets?: readonly { href: string; permissions: readonly string[] }[];
  badgeKey?: 'topups' | 'withdrawals' | 'pending';
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

export type { AdminLocale } from './admin-locale';

export function localizedNavTitle(item: Pick<AdminNavItem, 'title' | 'titleEn'>, locale: AdminLocale) {
  return locale === 'en' ? item.titleEn ?? item.title : item.title;
}

export function localizedNavGroupTitle(group: Pick<AdminNavGroup, 'title' | 'titleEn'>, locale: AdminLocale) {
  return locale === 'en' ? group.titleEn ?? group.title : group.title;
}

export function localizedNavGroupDescription(group: Pick<AdminNavGroup, 'description' | 'descriptionEn'>, locale: AdminLocale) {
  return locale === 'en' ? group.descriptionEn ?? group.description : group.description;
}

/**
 * The sidebar exposes every permission-allowed operational route. Groups remain
 * collapsible and searchable so specialist tools are discoverable without losing
 * the task-oriented structure of the workspace.
 */
export const navGroups: readonly AdminNavGroup[] = [
  {
    id: 'overview',
    title: 'ภาพรวม',
    titleEn: 'Overview',
    description: 'สถานะระบบและงานเร่งด่วน',
    descriptionEn: 'System status and urgent work',
    items: [
      { title: 'ศูนย์บัญชาการ', titleEn: 'Command center', href: '/dashboard', badgeKey: 'pending' },
      { title: 'งานที่ต้องตรวจ', titleEn: 'Review queue', href: '/operations', badgeKey: 'pending' },
      { title: 'กิจกรรมล่าสุด', titleEn: 'Activity center', href: '/activity-center', permissions: ['admin.view', 'admin.access.view', 'risk.view', 'reports.view'] },
    ],
  },
  {
    id: 'operations',
    title: 'งานปฏิบัติการ',
    titleEn: 'Operations',
    description: 'การเงิน สมาชิก ความเสี่ยง และผู้ให้บริการ',
    descriptionEn: 'Finance, members, risk, and providers',
    items: [
      {
        title: 'การเงิน',
        titleEn: 'Finance',
        href: '/topups',
        permissions: ['topups.view', 'deposit.view', 'withdraw.view', 'wallet.view', 'reports.view', 'reports.export', 'game.providers.view', 'provider.view'],
        permissionTargets: [
          { href: '/topups', permissions: ['topups.view', 'deposit.view'] },
          { href: '/withdrawals', permissions: ['withdraw.view'] },
          { href: '/wallets', permissions: ['wallet.view'] },
          { href: '/reports', permissions: ['reports.view'] },
          { href: '/exports', permissions: ['reports.export'] },
          { href: '/reconciliation-center', permissions: ['game.providers.view', 'provider.view'] },
        ],
        badgeKey: 'pending',
      },
      { title: 'รายการถอน', titleEn: 'Withdrawals', href: '/withdrawals', permissions: ['withdraw.view'], badgeKey: 'withdrawals' },
      { title: 'จัดการหลายรายการ', titleEn: 'Bulk review', href: '/bulk-queue-operations', permissions: ['topups.view', 'deposit.view', 'withdraw.view'] },
      { title: 'กระเป๋าเงินสมาชิก', titleEn: 'Member wallets', href: '/wallets', permissions: ['wallet.view'] },
      { title: 'ประวัติยอดเงิน', titleEn: 'Wallet ledger', href: '/wallet-ledgers', permissions: ['wallet.view'] },
      { title: 'รายการเดินบัญชี', titleEn: 'Wallet statement', href: '/wallet-statement', permissions: ['wallet.view'] },
      { title: 'วิเคราะห์กระเป๋าเงิน', titleEn: 'Wallet analytics', href: '/wallet-analytics', permissions: ['wallet.view', 'reports.view'] },
      { title: 'กระทบยอด', titleEn: 'Reconciliation', href: '/reconciliation-center', permissions: ['game.providers.view', 'provider.view'] },
      { title: 'รายงานการเงิน', titleEn: 'Finance reports', href: '/reports', permissions: ['reports.view'] },
      { title: 'ส่งออกรายงาน', titleEn: 'Exports', href: '/exports', permissions: ['reports.export', 'reports.view'] },

      { title: 'สมาชิก', titleEn: 'Members', href: '/members', permissions: ['users.view'] },
      { title: 'ข้อมูลเชิงลึกสมาชิก', titleEn: 'Member insights', href: '/member-insights', permissions: ['users.view'] },
      { title: 'บัญชีธนาคาร', titleEn: 'Bank accounts', href: '/bank-accounts', permissions: ['users.view', 'deposit.view'] },
      { title: 'ตรวจ KYC', titleEn: 'KYC review', href: '/kyc-center', permissions: ['users.view', 'risk.view'] },
      { title: 'ช่วยเหลือสมาชิก', titleEn: 'Support', href: '/support-center', permissions: ['users.view'] },

      { title: 'ความเสี่ยงและกำกับดูแล', titleEn: 'Risk & compliance', href: '/risk-alerts', permissions: ['risk.view'] },
      { title: 'ตรวจความเสี่ยงค่ายเกม', titleEn: 'Provider risk', href: '/provider-risk', permissions: ['risk.view', 'provider.view'] },
      { title: 'ตรวจบันทึกความเสี่ยง', titleEn: 'Risk audit', href: '/audit-risk', permissions: ['risk.view'] },

      { title: 'ปฏิบัติการค่ายเกม', titleEn: 'Provider operations', href: '/provider-health', permissions: ['game.providers.view', 'provider.view'] },
      { title: 'ตั้งค่าค่ายเกม', titleEn: 'Provider setup', href: '/simple-game-settings', permissions: ['game.providers.manage', 'provider.update'] },
      { title: 'เพิ่มค่ายเกม', titleEn: 'Add provider', href: '/provider-setup-wizard', permissions: ['game.providers.manage', 'provider.update'] },
      { title: 'ชุดตั้งค่าค่ายเกม', titleEn: 'Provider presets', href: '/provider-presets', permissions: ['game.providers.manage', 'provider.update'] },
      { title: 'ค่ายเกมทั้งหมด', titleEn: 'Game providers', href: '/game-providers', permissions: ['game.providers.view', 'provider.view'] },
      { title: 'ข้อมูลเชื่อมต่อค่ายเกม', titleEn: 'Provider credentials', href: '/provider-credentials', permissions: ['provider.update', 'game.providers.manage'] },
      { title: 'บันทึก Webhook', titleEn: 'Webhook logs', href: '/webhook-logs', permissions: ['game.providers.view'] },
      { title: 'ตัวเชื่อมต่อค่ายเกม', titleEn: 'Provider adapters', href: '/provider-adapters', permissions: ['game.providers.view', 'provider.view'] },
      { title: 'ยอดเงินฝั่งค่ายเกม', titleEn: 'Provider wallet snapshots', href: '/provider-wallet-snapshots', permissions: ['game.providers.view', 'provider.view'] },
      { title: 'กระทบยอด Webhook', titleEn: 'Webhook settlement', href: '/webhook-settlement', permissions: ['provider.view', 'game.providers.view'] },
      { title: 'ทดสอบ Webhook', titleEn: 'Webhook test', href: '/webhook-test', permissions: ['provider.update', 'game.providers.manage'] },
      { title: 'ทดสอบ API ค่ายเกม', titleEn: 'Provider API test', href: '/adapter-test', permissions: ['provider.update', 'game.providers.manage'] },
      { title: 'ตั้งค่า API แบบเดิม', titleEn: 'Legacy API settings', href: '/game-api-settings', permissions: ['provider.update'] },

      { title: 'เกม', titleEn: 'Games', href: '/games', permissions: ['game.providers.view', 'provider.view'] },
      { title: 'เซสชันเกม', titleEn: 'Game sessions', href: '/game-sessions', permissions: ['game.providers.view', 'provider.view'] },
      { title: 'รายการโอนเงินเกม', titleEn: 'Game transfers', href: '/game-transfers', permissions: ['game.providers.view', 'provider.view'] },
    ],
  },
  {
    id: 'growth',
    title: 'การเติบโต',
    titleEn: 'Growth',
    description: 'โปรโมชัน พันธมิตร และเนื้อหา',
    descriptionEn: 'Promotions, affiliates, and content',
    items: [
      { title: 'การเติบโตและโปรโมชัน', titleEn: 'Growth & promotions', href: '/growth-center', permissions: ['promotion.view', 'affiliate.view'] },
      { title: 'งานโปรโมชัน', titleEn: 'Promotion operations', href: '/promotion-operations', permissions: ['promotion.view', 'promotions.claims.view'] },
      { title: 'โปรโมชันและโบนัส', titleEn: 'Promotions & bonuses', href: '/promotion-center', permissions: ['promotion.view'] },
      { title: 'คำขอรับโปรโมชัน', titleEn: 'Promotion claims', href: '/promotion-claims', permissions: ['promotions.claims.view'] },
      { title: 'โบนัสย้อนหลัง', titleEn: 'Bonus ledger', href: '/bonus-ledgers', permissions: ['bonus.ledger.view'] },
      { title: 'Affiliate และคอมมิชชัน', titleEn: 'Affiliate & commission', href: '/affiliate-center', permissions: ['affiliate.view'] },
      { title: 'ประวัติคอมมิชชัน', titleEn: 'Commission ledger', href: '/commission-ledgers', permissions: ['commission.view'] },
      { title: 'เนื้อหาและสื่อ', titleEn: 'Content & assets', href: '/content-center', permissions: ['settings.website.view', 'settings.update'] },
    ],
  },
  {
    id: 'administration',
    title: 'การดูแลระบบ',
    titleEn: 'Administration',
    description: 'บัญชี สิทธิ์ ความปลอดภัย และการตั้งค่า',
    descriptionEn: 'Accounts, access, security, and settings',
    items: [
      { title: 'สิทธิ์และความปลอดภัย', titleEn: 'Access & security', href: '/admin-accounts', permissions: ['admin.view', 'admin.access.view'] },
      { title: 'บทบาทและสิทธิ์', titleEn: 'Roles & permissions', href: '/admin-roles', permissions: ['admin.access.view'] },
      { title: 'คำเชิญผู้ดูแล', titleEn: 'Admin invitations', href: '/admin-invitations', permissions: ['admin.create'] },
      { title: 'บันทึกการใช้งาน', titleEn: 'Audit log', href: '/audit', permissions: ['admin.view', 'admin.access.view'] },
      { title: 'ความปลอดภัย', titleEn: 'Security', href: '/security' },
      { title: 'CAPTCHA และป้องกันบอต', titleEn: 'CAPTCHA & bot protection', href: '/anti-bot', permissions: ['security.anti_bot.view'] },
      { title: 'การตั้งค่า', titleEn: 'Settings', href: '/settings', permissions: ['settings.update', 'settings.website.view'] },
    ],
  },
] as const;

const additionalRoutePermissions: readonly AdminNavItem[] = [
  { title: 'โปรไฟล์ของฉัน', href: '/profile' },
  { title: 'จัดการสิทธิ์', href: '/access', permissions: ['admin.access.view'] },
  { title: 'กิจกรรม', href: '/activity', permissions: ['admin.view', 'admin.access.view'] },
  { title: 'AML Review Center', href: '/aml', permissions: ['risk.view'] },
  { title: 'การสืบสวน', href: '/investigation', permissions: ['risk.view'] },
  { title: 'บันทึกการใช้งานเดิม', href: '/audit-logs', permissions: ['admin.view', 'admin.access.view'] },
  { title: 'บัญชีดำ', href: '/blacklist', permissions: ['risk.view'] },
  { title: 'การเงิน', href: '/finance', permissions: ['wallet.view', 'reports.view'] },
  { title: 'ตรวจ KYC', href: '/kyc', permissions: ['users.view', 'risk.view'] },
  { title: 'ประวัติยอดเงิน', href: '/ledgers', permissions: ['wallet.view'] },
  { title: 'ข้อมูลสมาชิก', href: '/member-detail', permissions: ['users.view'] },
  { title: 'จัดการยอดเงิน', href: '/money-ops', permissions: ['game.providers.view'] },
  { title: 'ปฏิบัติการความเสี่ยง', href: '/risk-operations', permissions: ['risk.view'] },
];

const safeSelfServicePaths = ['/dashboard', '/operations', '/profile', '/security'] as const;
const denyUnregisteredRoutePermission = '__admin.route.unregistered__' as const;

export function isSafeSelfServicePath(pathname: string) {
  return safeSelfServicePaths.some((href) => pathname === href || pathname.startsWith(`${href}/`));
}

export function resolveNavItemHref(item: AdminNavItem, permissions: readonly string[]) {
  if (!item.permissionTargets?.length || permissions.includes('*')) return item.href;
  return item.permissionTargets.find((target) => target.permissions.some((permission) => permissions.includes(permission)))?.href ?? item.href;
}

export function canAccessPath(pathname: string, permissions: readonly string[]) {
  if (isSafeSelfServicePath(pathname)) return true;
  const required = requiredPermissionsForPath(pathname);
  return permissions.includes('*') || required.some((permission) => permissions.includes(permission));
}

export function canAccessNavItem(item: AdminNavItem, permissions: readonly string[]) {
  if (!item.permissions || item.permissions.length === 0) return isSafeSelfServicePath(item.href);
  if (permissions.includes('*')) return true;
  return item.permissions.some((permission) => permissions.includes(permission));
}

export function requiredPermissionsForPath(pathname: string) {
  const routeItems = [...navGroups.flatMap((group) => group.items), ...additionalRoutePermissions].sort((a, b) => b.href.length - a.href.length);
  for (const item of routeItems) if (pathname === item.href || pathname.startsWith(`${item.href}/`)) return item.permissions ?? [];
  return [denyUnregisteredRoutePermission] as const;
}
