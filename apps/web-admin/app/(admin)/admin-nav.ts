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
 * Every permission-allowed operational route remains discoverable, but dense
 * workspaces are split into focused collapsible groups so the sidebar does not
 * become one enormous list.
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
    id: 'finance',
    title: 'การเงิน',
    titleEn: 'Finance',
    description: 'ฝาก ถอน กระเป๋าเงิน และรายงาน',
    descriptionEn: 'Deposits, withdrawals, wallets, and reporting',
    items: [
      { title: 'รายการฝาก', titleEn: 'Deposits', href: '/topups', permissions: ['topups.view', 'deposit.view'], badgeKey: 'topups' },
      { title: 'รายการถอน', titleEn: 'Withdrawals', href: '/withdrawals', permissions: ['withdraw.view'], badgeKey: 'withdrawals' },
      { title: 'จัดการหลายรายการ', titleEn: 'Bulk review', href: '/bulk-queue-operations', permissions: ['topups.view', 'deposit.view', 'withdraw.view'] },
      { title: 'กระเป๋าเงินสมาชิก', titleEn: 'Member wallets', href: '/wallets', permissions: ['wallet.view'] },
      { title: 'ประวัติยอดเงิน', titleEn: 'Wallet ledger', href: '/wallet-ledgers', permissions: ['wallet.view'] },
      { title: 'รายการเดินบัญชี', titleEn: 'Wallet statement', href: '/wallet-statement', permissions: ['wallet.view'] },
      { title: 'วิเคราะห์กระเป๋าเงิน', titleEn: 'Wallet analytics', href: '/wallet-analytics', permissions: ['wallet.view', 'reports.view'] },
      { title: 'กระทบยอด', titleEn: 'Reconciliation', href: '/reconciliation-center', permissions: ['game.providers.view', 'provider.view'] },
      { title: 'รายงานการเงิน', titleEn: 'Finance reports', href: '/reports', permissions: ['reports.view'] },
      { title: 'ส่งออกรายงาน', titleEn: 'Exports', href: '/exports', permissions: ['reports.export', 'reports.view'] },
    ],
  },
  {
    id: 'members',
    title: 'สมาชิก',
    titleEn: 'Members',
    description: 'บัญชีสมาชิก KYC และงานช่วยเหลือ',
    descriptionEn: 'Member accounts, KYC, and support',
    items: [
      { title: 'รายชื่อสมาชิก', titleEn: 'Member directory', href: '/members', permissions: ['users.view'] },
      { title: 'ข้อมูลเชิงลึกสมาชิก', titleEn: 'Member insights', href: '/member-insights', permissions: ['users.view'] },
      { title: 'บัญชีธนาคาร', titleEn: 'Bank accounts', href: '/bank-accounts', permissions: ['users.view', 'deposit.view'] },
      { title: 'ตรวจ KYC', titleEn: 'KYC review', href: '/kyc-center', permissions: ['users.view', 'risk.view'] },
      { title: 'ช่วยเหลือสมาชิก', titleEn: 'Support', href: '/support-center', permissions: ['users.view'] },
    ],
  },
  {
    id: 'risk',
    title: 'ความเสี่ยง',
    titleEn: 'Risk & compliance',
    description: 'แจ้งเตือน การตรวจสอบ และกำกับดูแล',
    descriptionEn: 'Alerts, investigations, and compliance',
    items: [
      { title: 'ความเสี่ยงและกำกับดูแล', titleEn: 'Risk & compliance', href: '/risk-alerts', permissions: ['risk.view'] },
      { title: 'ตรวจความเสี่ยงค่ายเกม', titleEn: 'Provider risk', href: '/provider-risk', permissions: ['risk.view', 'provider.view'] },
      { title: 'ตรวจบันทึกความเสี่ยง', titleEn: 'Risk audit', href: '/audit-risk', permissions: ['risk.view'] },
    ],
  },
  {
    id: 'providers',
    title: 'ค่ายเกมและการเชื่อมต่อ',
    titleEn: 'Providers & integrations',
    description: 'ค่ายเกม API Webhook และการกระทบยอด',
    descriptionEn: 'Providers, APIs, webhooks, and settlement',
    items: [
      { title: 'สถานะค่ายเกม', titleEn: 'Provider health', href: '/provider-health', permissions: ['game.providers.view', 'provider.view'] },
      { title: 'ตั้งค่าค่ายเกม', titleEn: 'Provider setup', href: '/simple-game-settings', permissions: ['game.providers.manage', 'provider.update'] },
      { title: 'เพิ่มค่ายเกม', titleEn: 'Add provider', href: '/provider-setup-wizard', permissions: ['game.providers.manage', 'provider.update'] },
      { title: 'ชุดตั้งค่าค่ายเกม', titleEn: 'Provider presets', href: '/provider-presets', permissions: ['game.providers.manage', 'provider.update'] },
      { title: 'ค่ายเกมทั้งหมด', titleEn: 'Game providers', href: '/game-providers', permissions: ['game.providers.view', 'provider.view'] },
      { title: 'ข้อมูลเชื่อมต่อ', titleEn: 'Provider credentials', href: '/provider-credentials', permissions: ['provider.update', 'game.providers.manage'] },
      { title: 'ตัวเชื่อมต่อค่ายเกม', titleEn: 'Provider adapters', href: '/provider-adapters', permissions: ['game.providers.view', 'provider.view'] },
      { title: 'ยอดเงินฝั่งค่ายเกม', titleEn: 'Provider wallet snapshots', href: '/provider-wallet-snapshots', permissions: ['game.providers.view', 'provider.view'] },
      { title: 'บันทึก Webhook', titleEn: 'Webhook logs', href: '/webhook-logs', permissions: ['game.providers.view'] },
      { title: 'กระทบยอด Webhook', titleEn: 'Webhook settlement', href: '/webhook-settlement', permissions: ['provider.view', 'game.providers.view'] },
      { title: 'ทดสอบ Webhook', titleEn: 'Webhook test', href: '/webhook-test', permissions: ['provider.update', 'game.providers.manage'] },
      { title: 'ทดสอบ API ค่ายเกม', titleEn: 'Provider API test', href: '/adapter-test', permissions: ['provider.update', 'game.providers.manage'] },
      { title: 'ตั้งค่า API แบบเดิม', titleEn: 'Legacy API settings', href: '/game-api-settings', permissions: ['provider.update'] },
    ],
  },
  {
    id: 'games',
    title: 'เกม',
    titleEn: 'Games',
    description: 'รายการเกม เซสชัน และการโอนเงิน',
    descriptionEn: 'Catalog, sessions, and transfers',
    items: [
      { title: 'ศูนย์ควบคุมเกม', titleEn: 'Game control center', href: '/game-control', permissions: ['game.providers.view', 'provider.view'] },
      { title: 'ตั้งค่าเกมหน้าแรก', titleEn: 'Home game settings', href: '/game-control/home-games', permissions: ['settings.features.view', 'game.providers.view', 'provider.view'] },
      { title: 'รูปเกมและรูปค่าย', titleEn: 'Game & provider assets', href: '/game-assets', permissions: ['game.providers.view', 'provider.view'] },
      { title: 'Tournament และ Radar Bot', titleEn: 'Tournament & Radar Bot', href: '/game-control/tournaments', permissions: ['game.providers.view', 'provider.view'] },
      { title: 'รายการเกม', titleEn: 'Game catalog', href: '/games', permissions: ['game.providers.view', 'provider.view'] },
      { title: 'เซสชันเกม', titleEn: 'Game sessions', href: '/game-sessions', permissions: ['game.providers.view', 'provider.view'] },
      { title: 'รายการโอนเงินเกม', titleEn: 'Game transfers', href: '/game-transfers', permissions: ['game.providers.view', 'provider.view'] },
    ],
  },
  {
    id: 'growth',
    title: 'โปรโมชันและพันธมิตร',
    titleEn: 'Growth & partners',
    description: 'โปรโมชัน โบนัส Affiliate และคอมมิชชัน',
    descriptionEn: 'Promotions, bonuses, affiliates, and commissions',
    items: [
      { title: 'ภาพรวมการเติบโต', titleEn: 'Growth overview', href: '/growth-center', permissions: ['promotion.view', 'affiliate.view'] },
      { title: 'งานโปรโมชัน', titleEn: 'Promotion operations', href: '/promotion-operations', permissions: ['promotion.view', 'promotions.claims.view'] },
      { title: 'โปรโมชันและโบนัส', titleEn: 'Promotions & bonuses', href: '/promotion-center', permissions: ['settings.features.view'] },
      { title: 'คำขอรับโปรโมชัน', titleEn: 'Promotion claims', href: '/promotion-claims', permissions: ['promotions.claims.view'] },
      { title: 'โบนัสย้อนหลัง', titleEn: 'Bonus ledger', href: '/bonus-ledgers', permissions: ['bonus.ledger.view'] },
      { title: 'Affiliate และคอมมิชชัน', titleEn: 'Affiliate & commission', href: '/affiliate-center', permissions: ['affiliate.view'] },
      { title: 'ประวัติคอมมิชชัน', titleEn: 'Commission ledger', href: '/commission-ledgers', permissions: ['commission.view'] },
    ],
  },
  {
    id: 'content',
    title: 'เนื้อหาและสื่อ',
    titleEn: 'Content & media',
    description: 'CMS รูปภาพ วิดีโอ และเนื้อหาหน้า Member',
    descriptionEn: 'CMS, images, video, and member content',
    items: [
      { title: 'CMS / Asset Library', titleEn: 'CMS / Asset Library', href: '/content-center', permissions: ['settings.features.view'] },
    ],
  },
  {
    id: 'administration',
    title: 'การดูแลระบบ',
    titleEn: 'Administration',
    description: 'บัญชี สิทธิ์ ความปลอดภัย และการตั้งค่า',
    descriptionEn: 'Accounts, access, security, and settings',
    items: [
      { title: 'บัญชีผู้ดูแล', titleEn: 'Admin accounts', href: '/admin-accounts', permissions: ['admin.view', 'admin.access.view'] },
      { title: 'บทบาทและสิทธิ์', titleEn: 'Roles & permissions', href: '/admin-roles', permissions: ['admin.access.view'] },
      { title: 'คำเชิญผู้ดูแล', titleEn: 'Admin invitations', href: '/admin-invitations', permissions: ['admin.create'] },
      { title: 'บันทึกการใช้งาน', titleEn: 'Audit log', href: '/audit', permissions: ['admin.view', 'admin.access.view'] },
      { title: 'ความปลอดภัย', titleEn: 'Security', href: '/security' },
      { title: 'CAPTCHA และป้องกันบอต', titleEn: 'CAPTCHA & bot protection', href: '/anti-bot', permissions: ['security.anti_bot.view'] },
      {
        title: 'การตั้งค่าระบบ',
        titleEn: 'System settings',
        href: '/system-settings',
        permissions: ['provider.view', 'provider.update', 'game.providers.view', 'game.providers.manage', 'settings.features.view'],
      },
      {
        title: 'การตั้งค่า',
        titleEn: 'Settings',
        href: '/settings',
        permissions: [
          'settings.update', 'settings.website.view', 'settings.branding.view', 'settings.theme.view',
          'settings.seo.view', 'settings.contact.view', 'settings.maintenance.view', 'settings.scripts.view',
          'settings.features.view', 'settings.legal.view',
        ],
      },
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
  { title: 'ตั้งค่ากิจกรรม', href: '/settings/activities', permissions: ['settings.features.view'] },
  { title: 'ประวัติ Branding', href: '/settings/branding/history', permissions: ['settings.branding.view'] },
  { title: 'ตัวอย่าง Branding', href: '/settings/branding/preview', permissions: ['settings.branding.view'] },
  { title: 'ตั้งค่า Branding', href: '/settings/branding', permissions: ['settings.branding.view'] },
  { title: 'ตั้งค่า Icons', href: '/settings/icons', permissions: ['settings.branding.view'] },
  { title: 'ตั้งค่า Website', href: '/settings/website', permissions: ['settings.website.view'] },
  { title: 'ตั้งค่า Theme', href: '/settings/theme', permissions: ['settings.theme.view'] },
  { title: 'ตั้งค่า SEO', href: '/settings/seo', permissions: ['settings.seo.view'] },
  { title: 'ตั้งค่า Contact', href: '/settings/contact', permissions: ['settings.contact.view'] },
  { title: 'ตั้งค่า Maintenance', href: '/settings/maintenance', permissions: ['settings.maintenance.view'] },
  { title: 'ตั้งค่า Scripts', href: '/settings/scripts', permissions: ['settings.scripts.view'] },
  { title: 'ตั้งค่า Features', href: '/settings/features', permissions: ['settings.features.view'] },
  { title: 'ตั้งค่า Legal', href: '/settings/legal', permissions: ['settings.legal.view'] },
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
  if (required.some((permission) => permission === denyUnregisteredRoutePermission)) return false;
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