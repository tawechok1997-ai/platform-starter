import { IconKey, MemberFeatureFlags } from './site-settings';

type MemberNavigationPlacement = 'bottom' | 'drawer' | 'home';
type NavigationLocale = 'th' | 'en';

type MemberNavigationItem = {
  key: string;
  title: string;
  shortTitle?: string;
  href: string;
  description: string;
  iconKey: IconKey;
  placements: MemberNavigationPlacement[];
  feature?: keyof MemberFeatureFlags;
  badge?: 'pending';
};

type NavigationCopy = {
  title: string;
  shortTitle?: string;
  description: string;
};

export const memberNavigationItems: MemberNavigationItem[] = [
  {
    key: 'home',
    title: 'หน้าแรก',
    shortTitle: 'เมนู',
    href: '/',
    description: 'ภาพรวมบัญชีและทางลัด',
    iconKey: 'home',
    placements: ['bottom'],
  },
  {
    key: 'games',
    title: 'เกม',
    href: '/games',
    description: 'เลือกเกม แนะนำ มาใหม่ และยอดนิยม',
    iconKey: 'games',
    placements: ['drawer', 'home'],
    feature: 'games',
  },
  {
    key: 'deposit',
    title: 'ฝากเงิน',
    shortTitle: 'ฝาก',
    href: '/deposit',
    description: 'เพิ่มยอดเข้าสู่บัญชี',
    iconKey: 'deposit',
    placements: ['bottom', 'home'],
    feature: 'deposit',
  },
  {
    key: 'withdraw',
    title: 'ถอนเงิน',
    shortTitle: 'ถอน',
    href: '/withdraw',
    description: 'ส่งคำขอถอนเงิน',
    iconKey: 'withdraw',
    placements: ['bottom', 'drawer', 'home'],
    feature: 'withdraw',
  },
  {
    key: 'transactions',
    title: 'ประวัติรายการ',
    href: '/transactions',
    description: 'ดูรายการฝาก ถอน และโบนัส',
    iconKey: 'history',
    placements: ['drawer'],
    badge: 'pending',
  },
  {
    key: 'promotions',
    title: 'โปรโมชัน',
    href: '/promotions',
    description: 'ดูโปรที่เปิดให้รับสิทธิ์',
    iconKey: 'promotion',
    placements: ['drawer', 'home'],
    feature: 'promotion',
  },
  {
    key: 'bonus',
    title: 'โบนัส',
    href: '/bonus',
    description: 'ดูสถานะโบนัสและเทิร์น',
    iconKey: 'bonus',
    placements: ['drawer', 'home'],
    feature: 'bonus',
  },
  {
    key: 'affiliate',
    title: 'ตัวแทน',
    href: '/affiliate',
    description: 'ลิงก์แนะนำและค่าคอม',
    iconKey: 'affiliate',
    placements: ['drawer', 'home'],
    feature: 'affiliate',
  },
  {
    key: 'bank',
    title: 'การจัดการบัญชีธนาคาร',
    shortTitle: 'บัญชี',
    href: '/bank-accounts',
    description: 'เพิ่มหรือแก้ไขบัญชีธนาคาร',
    iconKey: 'bank',
    placements: ['drawer', 'home'],
    feature: 'kyc',
  },
  {
    key: 'support',
    title: 'ช่วยเหลือ',
    href: '/support',
    description: 'เปิด ticket และดูคำตอบ',
    iconKey: 'support',
    placements: ['drawer', 'home'],
    feature: 'support',
  },
  {
    key: 'profile',
    title: 'โปรไฟล์',
    href: '/profile',
    description: 'ข้อมูลบัญชีและความปลอดภัย',
    iconKey: 'profile',
    placements: ['drawer'],
    feature: 'profile',
  },
  {
    key: 'notifications',
    title: 'แจ้งเตือน',
    href: '/notifications',
    description: 'ข้อความและสถานะสำคัญ',
    iconKey: 'notification',
    placements: ['drawer'],
    feature: 'notifications',
  },
  {
    key: 'guide',
    title: 'คู่มือการใช้งาน',
    href: '/guide',
    description: 'วิธีฝากเงินและใช้งานระบบ',
    iconKey: 'history',
    placements: ['drawer', 'home'],
  },
  {
    key: 'contact',
    title: 'ติดต่อเรา',
    shortTitle: 'ติดต่อ',
    href: '/contact',
    description: 'ช่องทางช่วยเหลือและเวลาบริการ',
    iconKey: 'support',
    placements: ['bottom', 'drawer'],
    feature: 'support',
  },
];

const ENGLISH_NAVIGATION_COPY: Record<string, NavigationCopy> = {
  home: { title: 'Home', shortTitle: 'Menu', description: 'Account overview and shortcuts' },
  games: { title: 'Games', description: 'Browse recommended, new, and popular games' },
  deposit: { title: 'Deposit', shortTitle: 'Deposit', description: 'Add funds to your account' },
  withdraw: { title: 'Withdraw', shortTitle: 'Withdraw', description: 'Submit a withdrawal request' },
  transactions: { title: 'Transactions', description: 'Review deposits, withdrawals, and bonuses' },
  promotions: { title: 'Promotions', description: 'View currently available offers' },
  bonus: { title: 'Bonuses', description: 'Review bonus and turnover status' },
  affiliate: { title: 'Affiliate', description: 'Referral links and commissions' },
  bank: { title: 'Bank accounts', shortTitle: 'Accounts', description: 'Add or update bank accounts' },
  support: { title: 'Support', description: 'Open tickets and review answers' },
  profile: { title: 'Profile', description: 'Account and security information' },
  notifications: { title: 'Notifications', description: 'Important messages and status updates' },
  guide: { title: 'User guide', description: 'Deposits and system usage instructions' },
  contact: { title: 'Contact us', shortTitle: 'Contact', description: 'Support channels and service hours' },
};

function currentNavigationLocale(): NavigationLocale {
  if (typeof document === 'undefined') return 'th';
  return document.documentElement.dataset.memberLocale === 'en' ? 'en' : 'th';
}

function localizeNavigationItem(item: MemberNavigationItem, locale: NavigationLocale): MemberNavigationItem {
  if (locale === 'th') return item;
  const copy = ENGLISH_NAVIGATION_COPY[item.key];
  if (!copy) return item;
  if (copy.shortTitle) return { ...item, title: copy.title, shortTitle: copy.shortTitle, description: copy.description };
  return { ...item, title: copy.title, description: copy.description };
}

export function navigationFor(placement: MemberNavigationPlacement, features: MemberFeatureFlags) {
  const locale = currentNavigationLocale();
  return memberNavigationItems
    .filter((item) => item.placements.includes(placement) && (!item.feature || features[item.feature]))
    .map((item) => localizeNavigationItem(item, locale));
}

export function activeNavigationHref(pathname: string | null | undefined) {
  const safePathname = pathname ?? '/';
  const matches = memberNavigationItems
    .filter((item) => item.href !== '/' && safePathname.startsWith(item.href))
    .sort((a, b) => b.href.length - a.href.length);
  return matches[0]?.href ?? '/';
}
