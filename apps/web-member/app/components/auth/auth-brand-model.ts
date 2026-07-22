import type { BrandRuntimeConfig } from '../../brand/brand-config';

type AuthMode = 'login' | 'register';

export type AuthBrandViewModel = {
  mode: AuthMode;
  siteName: string;
  description: string;
  logoUrl: string;
  eyebrow: string;
  title: string;
  subtitle: string;
};

export function createAuthBrandViewModel(
  brand: BrandRuntimeConfig,
  mode: AuthMode,
  overrides: Partial<AuthBrandViewModel> = {},
): AuthBrandViewModel {
  const login = mode === 'login';
  const dedicatedLogo = login ? brand.assets.logoLogin : brand.assets.logoRegister;

  return {
    mode,
    siteName: brand.name,
    description: brand.description,
    logoUrl: dedicatedLogo || brand.assets.logo,
    eyebrow: login ? 'MEMBER ACCESS' : 'CREATE ACCOUNT',
    title: login ? 'เข้าสู่ระบบสมาชิก' : 'สมัครสมาชิก',
    subtitle: login ? 'เข้าสู่ระบบเพื่อใช้งานบัญชีของคุณ' : 'สร้างบัญชีเพื่อเริ่มใช้งาน',
    ...overrides,
  };
}

export function authBrandDataAttributes(model: AuthBrandViewModel) {
  return {
    'data-auth-mode': model.mode,
    'data-has-brand-logo': model.logoUrl ? 'true' : 'false',
  } as const;
}
