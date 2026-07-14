import { Injectable } from '@nestjs/common';
import { Prisma, RiskAlertStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { mapPromotionBonusLedger, mapPromotionClaim } from './promotion.mapper';

const CLAIM_REF_TYPE = 'PROMOTION_CLAIM';
const BONUS_REF_TYPE = 'BONUS_LEDGER';
const CLAIM_STATUSES = ['OPEN', 'REVIEWING', 'RESOLVED', 'DISMISSED'] as const;
const BONUS_STATUSES = ['OPEN', 'REVIEWING', 'RESOLVED', 'DISMISSED'] as const;

@Injectable()
export class PromotionsQueryService {
  constructor(private readonly prisma: PrismaService) {}

  async listPublicCampaigns() {
    const settings = await this.prisma.siteSetting.findUnique({ where: { key: 'features.promotion_campaigns' } });
    const now = Date.now();
    const items = this.normalizeCampaigns(settings?.valueJson).filter((item) => item.enabled && this.inWindow(item, now));
    return { items };
  }

  async listMemberClaims(memberId: string) {
    const items = await this.prisma.riskAlert.findMany({ where: { refType: CLAIM_REF_TYPE, memberId }, orderBy: { createdAt: 'desc' }, take: 50 });
    return { items: items.map(mapPromotionClaim) };
  }

  async listMemberBonusLedgers(memberId: string) {
    const items = await this.prisma.riskAlert.findMany({ where: { refType: BONUS_REF_TYPE, memberId }, orderBy: { createdAt: 'desc' }, take: 50 });
    return { items: items.map(mapPromotionBonusLedger) };
  }

  async listAdminClaims(status?: string) {
    const where: Prisma.RiskAlertWhereInput = { refType: CLAIM_REF_TYPE };
    if (status && status !== 'ALL' && CLAIM_STATUSES.includes(status as any)) where.status = status as RiskAlertStatus;
    return this.withMembers(where, mapPromotionClaim);
  }

  async listAdminBonusLedgers(status?: string) {
    const where: Prisma.RiskAlertWhereInput = { refType: BONUS_REF_TYPE };
    if (status && status !== 'ALL' && BONUS_STATUSES.includes(status as any)) where.status = status as RiskAlertStatus;
    return this.withMembers(where, mapPromotionBonusLedger);
  }

  private async withMembers(where: Prisma.RiskAlertWhereInput, mapper: (item: Record<string, any>) => unknown) {
    const items = await this.prisma.riskAlert.findMany({ where, orderBy: { createdAt: 'desc' }, take: 100 });
    const ids = Array.from(new Set(items.map((item) => item.memberId).filter(Boolean) as string[]));
    const users = ids.length ? await this.prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true, username: true, phone: true, email: true, status: true } }) : [];
    const memberMap = new Map(users.map((user) => [user.id, user]));
    const mapped = items.map((item) => mapper({ ...item, member: item.memberId ? memberMap.get(item.memberId) : undefined }));
    return { items: mapped, total: mapped.length };
  }

  private normalizeCampaigns(value: unknown) {
    if (!Array.isArray(value)) return [];
    return value.map((item: any, index) => ({
      id: String(item.id ?? `promotion-${index + 1}`), title: String(item.title ?? 'Promotion'), description: String(item.description ?? ''),
      enabled: item.enabled === true, bonusType: item.bonusType === 'fixed' ? 'fixed' : 'percent', bonusValue: Number(item.bonusValue ?? 0),
      minDeposit: Number(item.minDeposit ?? 0), maxBonus: Number(item.maxBonus ?? 0), turnoverMultiplier: Number(item.turnoverMultiplier ?? 0),
      claimMode: item.claimMode === 'auto_pending' ? 'auto_pending' : 'manual_review', startsAt: typeof item.startsAt === 'string' ? item.startsAt : undefined,
      endsAt: typeof item.endsAt === 'string' ? item.endsAt : undefined,
    }));
  }

  private inWindow(item: { startsAt?: string; endsAt?: string }, now: number) {
    const start = item.startsAt ? Date.parse(item.startsAt) : NaN;
    const end = item.endsAt ? Date.parse(item.endsAt) : NaN;
    return !(Number.isFinite(start) && now < start) && !(Number.isFinite(end) && now > end);
  }
}
