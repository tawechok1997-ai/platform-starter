import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import {
  PROMOTION_ASSET_CAMPAIGNS,
  normalizePromotionCampaigns,
  type PromotionCampaign,
} from './promotion-asset-campaigns';

const PROMOTION_SETTINGS_KEY = 'features.promotion_campaigns';

export async function loadPromotionCampaignSettings(prisma: PrismaService): Promise<PromotionCampaign[]> {
  const setting = await prisma.siteSetting.findUnique({ where: { key: PROMOTION_SETTINGS_KEY } });
  const merged = mergePromotionCampaignSettings(setting?.valueJson);

  if (!setting || hasMissingAssetCampaigns(setting.valueJson)) {
    await prisma.siteSetting.upsert({
      where: { key: PROMOTION_SETTINGS_KEY },
      update: {
        valueJson: merged as unknown as Prisma.InputJsonValue,
        group: 'FEATURES',
        type: 'JSON',
        isPublic: true,
        isSensitive: false,
      },
      create: {
        key: PROMOTION_SETTINGS_KEY,
        valueJson: merged as unknown as Prisma.InputJsonValue,
        group: 'FEATURES',
        type: 'JSON',
        isPublic: true,
        isSensitive: false,
      },
    });
  }

  return merged;
}

export function mergePromotionCampaignSettings(value: unknown): PromotionCampaign[] {
  const configured = Array.isArray(value)
    ? value.filter(isRecord)
    : [];
  const missingTemplates = PROMOTION_ASSET_CAMPAIGNS.filter((template) => (
    !configured.some((item) => matchesTemplate(item, template))
  ));

  return normalizePromotionCampaigns([...configured, ...missingTemplates])
    .map(canonicalizePromotionCampaignMedia);
}

export function canonicalizePromotionCampaignMedia<T extends PromotionCampaign>(campaign: T): T {
  const canonicalImage = firstText(
    campaign.imageUrl,
    campaign.desktopImageUrl,
    campaign.mobileImageUrl,
    campaign.sourceImageUrl,
  );

  return {
    ...campaign,
    imageUrl: canonicalImage,
    desktopImageUrl: canonicalImage,
    mobileImageUrl: canonicalImage,
  };
}

function hasMissingAssetCampaigns(value: unknown) {
  if (!Array.isArray(value) || value.length === 0) return true;
  const configured = value.filter(isRecord);
  return PROMOTION_ASSET_CAMPAIGNS.some((template) => (
    !configured.some((item) => matchesTemplate(item, template))
  ));
}

function matchesTemplate(item: Record<string, unknown>, template: PromotionCampaign) {
  if (String(item.id ?? '') === template.id) return true;
  const sourcePromotionId = Number(item.sourcePromotionId);
  return Number.isFinite(sourcePromotionId)
    && sourcePromotionId === template.sourcePromotionId;
}

function firstText(...values: unknown[]) {
  return values.find((value) => typeof value === 'string' && value.trim())?.toString().trim() ?? '';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}
