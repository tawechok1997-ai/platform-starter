import type { MemberFeatureFlags } from './site-settings';

export type MemberRouteRule = {
  prefix: string;
  label: string;
  feature?: keyof MemberFeatureFlags;
  public?: boolean;
  authRedirectHome?: boolean;
};

export const memberRouteRules: MemberRouteRule[] = [
  { prefix: '/login', label: 'เข้าสู่ระบบ', public: true, authRedirectHome: true },
  { prefix: '/register', label: 'สมัครสมาชิก', public: true, authRedirectHome: true },
  { prefix: '/contact', label: 'ติดต่อเรา', public: true },
  { prefix: '/legal', label: 'นโยบาย', public: true },
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

export function routeRuleFor(pathname: string) {
  return memberRouteRules
    .filter((rule) => pathname.startsWith(rule.prefix))
    .sort((a, b) => b.prefix.length - a.prefix.length)[0];
}

export function isPublicMemberRoute(pathname: string) {
  return Boolean(routeRuleFor(pathname)?.public);
}

export function disabledMemberRoute(pathname: string, features: MemberFeatureFlags) {
  const rule = routeRuleFor(pathname);
  if (!rule?.feature || features[rule.feature]) return undefined;
  return rule;
}
