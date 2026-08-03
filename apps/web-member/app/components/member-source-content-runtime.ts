import { memberApiFetch } from '../member-api';
import type {
  MemberPromotionCampaign,
  PromotionClaimLimitPeriod,
  PromotionMemberCategory,
  PromotionTurnoverBasis,
} from '../promotion-campaign-runtime';

type UnknownRecord = Record<string, unknown>;

type PublicPromotionsPayload = {
  items?: unknown;
};

export async function loadLivePromotionCampaigns(signal?: AbortSignal): Promise<MemberPromotionCampaign[]> {
  const response = await memberApiFetch('/public/promotions', {
    cache: 'no-store',
    credentials: 'omit',
    headers: { Accept: 'application/json' },
    ...(signal ? { signal } : {}),
    skipAuth: true,
    suppressSessionExpiryRedirect: true,
  });

  if (!response.ok) {
    throw new Error(`Public promotions request failed with ${response.status}`);
  }

  const payload = await response.json().catch(() => null) as PublicPromotionsPayload | null;
  const source = Array.isArray(payload?.items) ? payload.items : [];

  return source
    .filter(isRecord)
    .map(normalizeCampaign)
    .filter((campaign) => campaign.enabled && campaign.lifecycle === 'published' && inWindow(campaign))
    .sort((left, right) => right.priority - left.priority);
}

function normalizeCampaign(item: UnknownRecord, index: number): MemberPromotionCampaign {
  const lifecycle = normalizeLifecycle(item.lifecycle, item.enabled);
  const imageUrl = text(item.imageUrl, text(item.desktopImageUrl, ''));
  const desktopImageUrl = text(item.desktopImageUrl, imageUrl);
  const mobileImageUrl = text(item.mobileImageUrl, desktopImageUrl);

  return {
    id: text(item.id, `promotion-${index + 1}`),
    sourcePromotionId: optionalNumber(item.sourcePromotionId),
    sourceCode: optionalText(item.sourceCode),
    sourceType: optionalText(item.sourceType),
    promotionGroupId: optionalNumber(item.promotionGroupId),
    title: text(item.title, `โปรโมชั่น ${index + 1}`),
    description: text(item.description, ''),
    enabled: item.enabled !== false && lifecycle === 'published',
    lifecycle,
    memberCategory: normalizeCategory(item.memberCategory),
    bonusType: item.bonusType === 'fixed' ? 'fixed' : 'percent',
    bonusValue: numberValue(item.bonusValue, 0),
    minDeposit: numberValue(item.minDeposit, 0),
    maxBonus: numberValue(item.maxBonus, 0),
    turnoverMultiplier: numberValue(item.turnoverMultiplier, 0),
    turnoverBasis: normalizeTurnoverBasis(item.turnoverBasis),
    claimMode: item.claimMode === 'auto_pending' ? 'auto_pending' : 'manual_review',
    imageUrl,
    desktopImageUrl,
    mobileImageUrl,
    sourceImageUrl: text(item.sourceImageUrl, desktopImageUrl || mobileImageUrl),
    desktopAssetId: optionalText(item.desktopAssetId),
    mobileAssetId: optionalText(item.mobileAssetId),
    iconUrl: optionalText(item.iconUrl),
    badgeText: text(item.badgeText, 'PROMOTION'),
    accentColor: text(item.accentColor, '#944fe8'),
    href: text(item.href, ''),
    priority: numberValue(item.priority, index),
    startsAt: optionalText(item.startsAt),
    endsAt: optionalText(item.endsAt),
    detailHtml: text(item.detailHtml, ''),
    termsHtml: text(item.termsHtml, ''),
    allowedGames: text(item.allowedGames, ''),
    excludedGames: text(item.excludedGames, ''),
    claimButtonLabel: text(item.claimButtonLabel, 'กดรับโปรโมชั่น'),
    claimSuccessMessage: text(item.claimSuccessMessage, 'ส่งคำขอรับโปรโมชั่นเรียบร้อยแล้ว'),
    maxClaimsPerMember: Math.max(0, numberValue(item.maxClaimsPerMember, 1)),
    claimLimitPeriod: normalizeClaimLimitPeriod(item.claimLimitPeriod),
    requiresApprovedDeposit: booleanValue(item.requiresApprovedDeposit, false),
    depositOrdinal: Math.max(0, Math.trunc(numberValue(item.depositOrdinal, 0))),
    consecutiveDepositDays: Math.max(0, Math.trunc(numberValue(item.consecutiveDepositDays, 0))),
    depositWindowHours: Math.max(0, numberValue(item.depositWindowHours, 0)),
    maxWithdrawal: Math.max(0, numberValue(item.maxWithdrawal, 0)),
    disableBotWithdrawal: booleanValue(item.disableBotWithdrawal, false),
    isRecommended: booleanValue(item.isRecommended, false),
  };
}

function normalizeLifecycle(value: unknown, enabled: unknown): MemberPromotionCampaign['lifecycle'] {
  if (value === 'archived') return 'archived';
  if (value === 'draft' || enabled === false) return 'draft';
  return 'published';
}

function normalizeCategory(value: unknown): PromotionMemberCategory {
  return value === 'new_member' || value === 'daily' || value === 'privilege' || value === 'cashback'
    ? value
    : 'privilege';
}

function normalizeTurnoverBasis(value: unknown): PromotionTurnoverBasis {
  return value === 'deposit' || value === 'deposit_plus_bonus' || value === 'bonus'
    ? value
    : 'bonus';
}

function normalizeClaimLimitPeriod(value: unknown): PromotionClaimLimitPeriod {
  return value === 'day' || value === 'week' || value === 'month' || value === 'year' || value === 'lifetime'
    ? value
    : 'lifetime';
}

function inWindow(item: Pick<MemberPromotionCampaign, 'startsAt' | 'endsAt'>) {
  const now = Date.now();
  const start = item.startsAt ? Date.parse(item.startsAt) : NaN;
  const end = item.endsAt ? Date.parse(item.endsAt) : NaN;
  return !(Number.isFinite(start) && now < start) && !(Number.isFinite(end) && now > end);
}

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function text(value: unknown, fallback: string) {
  return typeof value === 'string' ? value : fallback;
}

function optionalText(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function optionalNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function numberValue(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function booleanValue(value: unknown, fallback: boolean) {
  return typeof value === 'boolean' ? value : fallback;
}
