/** Public boundary for the CMS feature. Keep private implementation files unexported. */
export const CMS_FEATURE_BOUNDARY = 'cms' as const;

export { default as ContentCenterPage } from './content-center-page';
export { default as PromotionCenterPage } from './promotion-center-page';
