import { IconKey, MemberFeatureFlags } from './site-settings';

export type MemberNavigationPlacement = 'bottom' | 'drawer' | 'home';

export type MemberNavigationItem = {
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

export const memberNavigationItems: MemberNavigationItem[] = [
  { key: 'home', title: 'หน้าแรก', href: '/', description: 'ภาพรวมบัญชีและทางลัด', iconKey: 'home', placements: ['bottom'] },
  { key: 'games', title: 'เกมทั้งหมด', shortTitle: 'เกม', href: '/games', description: 'เลือกเกม แนะนำ มาใหม่ และยอดนิยม', iconKey: 'games', placements: ['bottom', 'drawer', 'home'], feature: 'games' },
  { key: 'deposit', title: 'ฝาก', href: '/deposit', description: 'เพิ่มยอดเข้าสู่บัญชี', iconKey: 'deposit', placements: ['bottom', 'home'], feature: 'deposit' },
  { key: 'withdraw', title: 'ถอนเงิน', href: '/withdraw', description: 'ส่งคำขอถอนเงิน', iconKey: 'withdraw', placements: ['bottom', 'home'], feature: 'withdraw' },
  { key: 'transactions', title: 'สถานะรายการ', shortTitle: 'ประวัติ', href: '/transactions', description: 'เช็กรายการรอตรวจสอบ', iconKey: 'history', placements: ['bottom', 'drawer'], badge: 'pending' },
  { key: 'promotions', title: 'โปรโมชัน', shortTitle: 'โปร', href: '/promotions', description: 'ดูโปรที่เปิดให้รับสิทธิ์', iconKey: 'promotion', placements: ['drawer', 'home'], feature: 'promotion' },
  { key: 'bonus', title: 'โบนัส', href: '/bonus', description: 'ดูสถานะโบนัสและเทิร์น', iconKey: 'bonus', placements: ['drawer', 'home'], feature: 'bonus' },
  { key: 'affiliate', title: 'ตัวแทน', href: '/affiliate', description: 'ลิงก์แนะนำและค่าคอม', iconKey: 'affiliate', placements: ['drawer', 'home'], feature: 'affiliate' },
  { key: 'bank', title: 'การจัดการบัญชีธนาคาร', shortTitle: 'บัญชี', href: '/bank-accounts', description: 'เพิ่มหรือแก้ไขบัญชีธนาคาร', iconKey: 'bank', placements: ['drawer', 'home'], feature: 'kyc' },
  { key: 'support', title: 'ช่วยเหลือ', href: '/support', description: 'เปิด ticket และดูคำตอบ', iconKey: 'support', placements: ['drawer', 'home'], feature: 'support' },
  { key: 'profile', title: 'โปรไฟล์', href: '/profile', description: 'ข้อมูลบัญชีและความปลอดภัย', iconKey: 'profile', placements: ['drawer'], feature: 'profile' },
  { key: 'notifications', title: 'แจ้งเตือน', href: '/notifications', description: 'ข้อความและสถานะสำคัญ', iconKey: 'notification', placements: ['drawer'], feature: 'notifications' },
  { key: 'contact', title: 'ติดต่อเรา', href: '/contact', description: 'ช่องทางช่วยเหลือและเวลาบริการ', iconKey: 'support', placements: ['drawer'] },
];

export function navigationFor(
  placement: MemberNavigationPlacement,
  features: MemberFeatureFlags,
) {
  return memberNavigationItems.filter(
    (item) => item.placements.includes(placement) && (!item.feature || features[item.feature]),
  );
}

export function activeNavigationHref(pathname: string) {
  const matches = memberNavigationItems
    .filter((item) => item.href !== '/' && pathname.startsWith(item.href))
    .sort((a, b) => b.href.length - a.href.length);
  return matches[0]?.href ?? '/';
}
