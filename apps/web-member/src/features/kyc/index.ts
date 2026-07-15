/** Public boundary for the KYC feature. Keep private implementation files unexported. */
export const KYC_FEATURE_BOUNDARY = 'kyc' as const;
export { default as MemberKycPage } from './member-kyc-page';
