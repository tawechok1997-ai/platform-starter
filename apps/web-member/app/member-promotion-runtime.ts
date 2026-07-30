import {
  loadPublicPromotionCampaigns,
  PROMOTION_ASSET_CAMPAIGNS,
  type MemberPromotionCampaign,
  type PromotionMemberCategory,
} from './promotion-campaign-runtime';

export type { MemberPromotionCampaign, PromotionMemberCategory };

export const MEMBER_PROMOTION_FALLBACKS = PROMOTION_ASSET_CAMPAIGNS.map(canonicalizeMemberPromotion);

export async function loadMemberPromotionCampaigns(signal?: AbortSignal) {
  const campaigns = await loadPublicPromotionCampaigns(signal);
  return campaigns.map(canonicalizeMemberPromotion);
}

export function canonicalizeMemberPromotion<T extends MemberPromotionCampaign>(campaign: T): T {
  const image = memberPromotionImage(campaign);
  return {
    ...campaign,
    imageUrl: image,
    desktopImageUrl: image,
    mobileImageUrl: image,
  };
}

export function memberPromotionImage(campaign: Pick<MemberPromotionCampaign, 'imageUrl' | 'desktopImageUrl' | 'mobileImageUrl' | 'sourceImageUrl'>) {
  return firstText(
    campaign.imageUrl,
    campaign.desktopImageUrl,
    campaign.mobileImageUrl,
    campaign.sourceImageUrl,
  );
}

export function memberPromotionDetails(campaign: MemberPromotionCampaign) {
  return {
    summary: campaign.description || plainText(campaign.detailHtml) || campaign.title,
    detail: plainText(campaign.detailHtml),
    terms: plainText(campaign.termsHtml),
    allowedGames: campaign.allowedGames.trim(),
    excludedGames: campaign.excludedGames.trim(),
  };
}

function plainText(value: string) {
  return value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s+/g, '\n')
    .trim();
}

function firstText(...values: unknown[]) {
  return values.find((value) => typeof value === 'string' && value.trim())?.toString().trim() ?? '';
}
