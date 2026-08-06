import type { MemberFeatureFlags } from './site-settings';

type MemberRouteRule = {
  prefix: string;
  label: string;
  feature?: keyof MemberFeatureFlags;
  public?: boolean;
  authRedirectHome?: boolean;
};

const PUBLIC_MOBILE_MEMBER_ROUTES = new Set([
  '/mobile/member/vip',
  '/mobile/member/live',
  '/mobile/member/promotions',
  '/mobile/member/news',
  '/mobile/member/activity',
  '/mobile/member/guide',
]);

const memberRouteRules: MemberRouteRule[] = [
  { prefix: '/clone-preview', label: 'Frontend Clone Preview', public: true },
  { prefix: '/diagnostics', label: 'Web Member Diagnostics', public: true },
  { prefix: '/login', label: 'เข้าสู่ระบบ', public: true, authRedirectHome: true },
  { prefix: '/register', label: 'สมัครสมาชิก', public: true, authRedirectHome: true },
  { prefix: '/contact', label: 'ติดต่อเรา', public: true },
  { prefix: '/guide', label: 'คู่มือ', public: true },
  { prefix: '/legal', label: 'นโยบาย', public: true },
  { prefix: '/maintenance', label: 'ปิดปรับปรุง', public: true },
  { prefix: '/session-expired', label: 'เซสชันหมดอายุ', public: true },
  { prefix: '/browse', label: 'ข้อมูลสาธารณะ', public: true },
  { prefix: '/games', label: 'เกม', feature: 'games' },
  { prefix: '/deposit', label: 'ฝาก', feature: 'deposit' },
  { prefix: '/withdraw', label: 'ถอนเงิน', feature: 'withdraw' },
  { prefix: '/promotions', label: 'โปรโมชัน', feature: 'promotion' },
  { prefix: '/bonus', label: 'โบนัส', feature: 'bonus' },
  { prefix: '/affiliate', label: 'ตัวแทน', feature: 'affiliate' },
  { prefix: '/support', label: 'ช่วยเหลือ', feature: 'support' },
  { prefix: '/bank-accounts', label: 'บัญชีธนาคาร', feature: 'kyc' },
  { prefix: '/profile', label: 'โปรไฟล์', feature: 'profile' },
  { prefix: '/notifications', label: 'แจ้งเตือน', feature: 'notifications' },
];

export function routeRuleFor(pathname: string | null | undefined) {
  const safePathname = normalizeRoutePath(pathname);
  return memberRouteRules
    .filter((rule) => safePathname.startsWith(rule.prefix))
    .sort((a, b) => b.prefix.length - a.prefix.length)[0];
}

export function isPublicMemberRoute(pathname: string | null | undefined) {
  const safePathname = normalizeRoutePath(pathname);
  if (safePathname === '/' || PUBLIC_MOBILE_MEMBER_ROUTES.has(safePathname)) return true;
  return Boolean(routeRuleFor(safePathname)?.public);
}

export function disabledMemberRoute(pathname: string | null | undefined, features: MemberFeatureFlags) {
  const rule = routeRuleFor(pathname);
  if (!rule?.feature || features[rule.feature]) return undefined;
  return rule;
}

function normalizeRoutePath(pathname: string | null | undefined) {
  const value = (pathname ?? '/').trim() || '/';
  if (value === '/') return value;
  return value.replace(/\/+$/, '') || '/';
}
