import type { BrandRuntimeConfig } from '../../brand/brand-config';
import { resolveBrandAsset } from '../../brand/brand-asset-manifest';

type AuthMode = 'login' | 'register';

export type AuthBrandViewModel = {
  mode: AuthMode;
  siteName: string;
  description: string;
  logoUrl: string;
  backgroundImageUrl: string;
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
  const logoUrl = resolveBrandAsset(brand.assets, login ? 'logoLogin' : 'logoRegister');

  return {
    mode,
    siteName: brand.name,
    description: brand.description,
    logoUrl,
    backgroundImageUrl: '',
    eyebrow: login ? 'MEMBER ACCESS' : 'CREATE ACCOUNT',
    title: login ? 'เข้าสู่ระบบสมาชิก' : 'สมัครสมาชิก',
    subtitle: login ? 'เข้าสู่ระบบเพื่อใช้งานบัญชีของคุณ' : 'สร้างบัญชีเพื่อเริ่มใช้งาน',
    ...overrides,
    mode,
  };
}

export function authBrandDataAttributes(model: AuthBrandViewModel) {
  return {
    'data-auth-mode': model.mode,
    'data-has-brand-logo': model.logoUrl ? 'true' : 'false',
    'data-has-auth-background': model.backgroundImageUrl ? 'true' : 'false',
  } as const;
}
