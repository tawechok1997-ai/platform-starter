import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { buildAdminAuditData } from '../../common/audit/admin-audit.builder';
import { PrismaService } from '../../database/prisma.service';
import { mapPromotionBonusLedger, mapPromotionClaim, promotionClaimMetadata } from './promotion.mapper';
import { PromotionDomainRepository } from './promotion-domain.repository';

type Actor = { id: string };
type ClaimInput = { campaignId?: string; note?: string; topupId?: string; depositAmount?: number };
type ReviewInput = { status?: 'APPROVED' | 'REJECTED'; adminNote?: string };
type PromotionCampaign = {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
  bonusType: 'fixed' | 'percent';
  bonusValue: number;
  minDeposit: number;
  maxBonus: number;
  turnoverMultiplier: number;
  claimMode: 'manual_review' | 'auto_pending';
  startsAt?: string;
  endsAt?: string;
};

const CLAIM_REF_TYPE = 'PROMOTION_CLAIM';
const BONUS_REF_TYPE = 'BONUS_LEDGER';

@Injectable()
export class PromotionClaimCommandService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly domain: PromotionDomainRepository,
  ) {}

  async createClaim(user: Actor, input: ClaimInput) {
    const campaignId = this.requireText(input.campaignId, 'campaignId');
    const campaign = (await this.activeCampaigns()).find((item) => item.id === campaignId);
    if (!campaign) throw new NotFoundException('Promotion campaign not found or inactive');

    const linkedTopup = await this.resolveClaimTopup(user.id, campaign, input);
    const duplicate = await this.prisma.riskAlert.findFirst({
      where: { refType: CLAIM_REF_TYPE, memberId: user.id, refId: campaignId, status: { in: ['OPEN', 'REVIEWING'] } },
    });
    if (duplicate) throw new BadRequestException('คุณมีคำขอรับโปรนี้ที่กำลังรอตรวจอยู่แล้ว');
    if (linkedTopup && await this.findClaimUsingTopup(linkedTopup.id)) {
      throw new BadRequestException('รายการฝากนี้ถูกใช้รับโปรไปแล้ว');
    }

    const depositAmount = linkedTopup?.amount ?? Number(input.depositAmount || campaign.minDeposit || 0);
    if (depositAmount < campaign.minDeposit) {
      throw new BadRequestException(`ยอดฝากต้องไม่น้อยกว่า ${campaign.minDeposit.toLocaleString('th-TH', { minimumFractionDigits: 2 })} THB`);
    }
    const preview = this.bonusPreview(campaign, depositAmount);
    const metadata = {
      campaign,
      campaignId,
      topupId: linkedTopup?.id ?? input.topupId ?? null,
      linkedTopup,
      depositAmount,
      memberNote: input.note ?? '',
      requestedAt: new Date().toISOString(),
      bonusPreview: preview,
      settlement: { enabled: false, reason: 'Bonus ledger pending approval' },
      events: [{ by: 'member', action: 'CLAIM_CREATED', message: input.note ?? '', createdAt: new Date().toISOString() }],
    };

    const item = await this.prisma.riskAlert.create({
      data: {
        type: 'WALLET_LEDGER_MISMATCH', severity: 'LOW', status: 'OPEN', memberId: user.id,
        refType: CLAIM_REF_TYPE, refId: campaignId, title: `Promotion claim: ${campaign.title}`,
        description: input.note?.trim() || `ขอรับโปร ${campaign.title}`, metadata: this.safeJson(metadata),
      },
    });
    try {
      await this.domain.createClaim({
        id: item.id, memberId: user.id, campaignId, topUpRequestId: linkedTopup?.id ?? null,
        sourceRiskAlertId: item.id, depositAmount, bonusAmount: preview.estimatedBonus, memberNote: input.note ?? null,
      });
    } catch (error) {
      await this.prisma.riskAlert.delete({ where: { id: item.id } }).catch(() => null);
      throw error;
    }
    return { ok: true, item: mapPromotionClaim(item) };
  }

  async reviewClaim(admin: Actor, id: string, input: ReviewInput) {
    const item = await this.prisma.riskAlert.findFirst({ where: { id, refType: CLAIM_REF_TYPE } });
    if (!item) throw new NotFoundException('Promotion claim not found');
    if (input.status === 'REJECTED' && !input.adminNote?.trim()) {
      throw new BadRequestException('adminNote is required when rejecting a promotion claim');
    }

    const metadata = promotionClaimMetadata(item.metadata);
    const nextStatus = input.status === 'APPROVED' ? 'RESOLVED' : input.status === 'REJECTED' ? 'DISMISSED' : 'REVIEWING';
    const events = [...metadata.events, {
      by: 'admin', adminUserId: admin.id, action: input.status ?? 'REVIEWING',
      message: input.adminNote ?? '', createdAt: new Date().toISOString(),
    }];
    const settlement = input.status === 'APPROVED'
      ? { enabled: true, mode: 'bonus_ledger_only', reason: 'Bonus ledger created; wallet settlement requires completed turnover' }
      : { enabled: false, reason: 'Claim not approved' };

    await this.domain.markClaimReviewed({
      sourceRiskAlertId: id, status: input.status ?? 'REVIEWING', adminUserId: admin.id, adminNote: input.adminNote ?? null,
    });
    const updated = await this.prisma.riskAlert.update({
      where: { id },
      data: {
        status: nextStatus,
        severity: nextStatus === 'RESOLVED' ? 'LOW' : item.severity,
        resolvedAt: nextStatus === 'RESOLVED' || nextStatus === 'DISMISSED' ? new Date() : undefined,
        metadata: this.safeJson({ ...metadata, adminNote: input.adminNote ?? metadata.adminNote, reviewResult: input.status ?? 'REVIEWING', settlement, events }),
      },
    });
    const bonusLedger = input.status === 'APPROVED' ? await this.createBonusLedgerFromClaim(updated, admin.id) : null;
    await this.prisma.adminAuditLog.create({
      data: buildAdminAuditData({
        adminUserId: admin.id,
        module: 'promotions',
        action: 'promotion.claim.review',
        targetId: id,
        oldData: item,
        newData: { updated, bonusLedger },
      }),
    });
    return {
      ok: true,
      item: mapPromotionClaim(updated),
      bonusLedger: bonusLedger ? mapPromotionBonusLedger(bonusLedger) : null,
    };
  }

  private async createBonusLedgerFromClaim(claim: Record<string, any>, adminUserId: string) {
    const metadata = promotionClaimMetadata(claim.metadata);
    const existing = await this.prisma.riskAlert.findFirst({ where: { refType: BONUS_REF_TYPE, refId: claim.id } });
    if (existing) return existing;
    const campaign = metadata.campaign as PromotionCampaign | null;
    const preview = this.bonusPreview(campaign, Number(metadata.depositAmount || campaign?.minDeposit || 0));
    const turnoverCompleted = preview.turnoverRequired <= 0;
    const ledgerMetadata = {
      claimId: claim.id, campaignId: metadata.campaignId || claim.refId, topupId: metadata.topupId,
      linkedTopup: metadata.linkedTopup, depositAmount: metadata.depositAmount, campaign,
      amount: preview.estimatedBonus, currency: 'THB', turnoverRequired: preview.turnoverRequired,
      turnoverProgress: 0, turnoverCompleted, lifecycleStatus: turnoverCompleted ? 'TURNOVER_COMPLETED' : 'ACTIVE',
      walletCreditEnabled: false,
      walletCreditStatus: turnoverCompleted ? 'READY_FOR_MANUAL_RELEASE' : 'BLOCKED_UNTIL_TURNOVER_GUARD',
      events: [{ by: 'system', adminUserId, action: 'BONUS_LEDGER_CREATED', message: 'Created from approved promotion claim', createdAt: new Date().toISOString() }],
    };
    const riskLedger = await this.prisma.riskAlert.create({
      data: {
        type: 'WALLET_LEDGER_MISMATCH', severity: 'LOW', status: turnoverCompleted ? 'RESOLVED' : 'OPEN',
        memberId: claim.memberId, refType: BONUS_REF_TYPE, refId: claim.id,
        title: `Bonus ledger: ${campaign?.title ?? metadata.campaignId}`,
        description: `โบนัส ${preview.estimatedBonus.toFixed(2)} THB · เทิร์น ${preview.turnoverRequired.toFixed(2)}`,
        metadata: this.safeJson(ledgerMetadata),
      },
    });
    try {
      await this.domain.createBonusLedger({
        id: riskLedger.id, promotionClaimId: claim.id, memberId: claim.memberId,
        sourceRiskAlertId: riskLedger.id, amount: preview.estimatedBonus, currency: 'THB', turnoverRequired: preview.turnoverRequired,
      });
    } catch (error) {
      await this.prisma.riskAlert.delete({ where: { id: riskLedger.id } }).catch(() => null);
      throw error;
    }
    return riskLedger;
  }

  private async activeCampaigns() {
    const setting = await this.prisma.siteSetting.findUnique({ where: { key: 'features.promotion_campaigns' } });
    const now = Date.now();
    return this.normalizeCampaigns(setting?.valueJson).filter((item) => item.enabled && this.inWindow(item, now));
  }

  private async resolveClaimTopup(userId: string, campaign: PromotionCampaign, input: ClaimInput) {
    const topupId = this.cleanText(input.topupId);
    if (!topupId) return null;
    const topup = await this.prisma.topUpRequest.findFirst({ where: { id: topupId, userId } });
    if (!topup) throw new NotFoundException('Deposit not found');
    if (topup.status !== 'APPROVED') throw new BadRequestException('ใช้ได้เฉพาะรายการฝากที่อนุมัติแล้วเท่านั้น');
    const amount = Number(topup.amount);
    if (!Number.isFinite(amount) || amount <= 0) throw new BadRequestException('Deposit amount is invalid');
    if (amount < campaign.minDeposit) {
      throw new BadRequestException(`ยอดฝากต้องไม่น้อยกว่า ${campaign.minDeposit.toLocaleString('th-TH', { minimumFractionDigits: 2 })} THB`);
    }
    return {
      id: topup.id, amount, currency: topup.currency, status: topup.status, method: topup.method,
      referenceCode: topup.referenceCode, reviewedAt: topup.reviewedAt, createdAt: topup.createdAt,
    };
  }

  private async findClaimUsingTopup(topupId: string) {
    const claims = await this.prisma.riskAlert.findMany({ where: { refType: CLAIM_REF_TYPE }, orderBy: { createdAt: 'desc' }, take: 500 });
    return claims.find((claim) => promotionClaimMetadata(claim.metadata).topupId === topupId) ?? null;
  }

  private normalizeCampaigns(value: unknown): PromotionCampaign[] {
    if (!Array.isArray(value)) return [];
    return value.map((item: any, index) => ({
      id: String(item.id ?? `promotion-${index + 1}`), title: String(item.title ?? 'Promotion'), description: String(item.description ?? ''),
      enabled: item.enabled === true, bonusType: item.bonusType === 'fixed' ? 'fixed' : 'percent', bonusValue: Number(item.bonusValue ?? 0),
      minDeposit: Number(item.minDeposit ?? 0), maxBonus: Number(item.maxBonus ?? 0), turnoverMultiplier: Number(item.turnoverMultiplier ?? 0),
      claimMode: item.claimMode === 'auto_pending' ? 'auto_pending' : 'manual_review', startsAt: typeof item.startsAt === 'string' ? item.startsAt : undefined,
      endsAt: typeof item.endsAt === 'string' ? item.endsAt : undefined,
    }));
  }

  private inWindow(item: PromotionCampaign, now: number) {
    const start = item.startsAt ? Date.parse(item.startsAt) : NaN;
    const end = item.endsAt ? Date.parse(item.endsAt) : NaN;
    return !(Number.isFinite(start) && now < start) && !(Number.isFinite(end) && now > end);
  }

  private bonusPreview(campaign: PromotionCampaign | null, depositAmount: number) {
    const base = Number(depositAmount || campaign?.minDeposit || 0);
    const raw = campaign?.bonusType === 'fixed' ? Number(campaign.bonusValue || 0) : base * (Number(campaign?.bonusValue || 0) / 100);
    const capped = Number(campaign?.maxBonus || 0) > 0 ? Math.min(raw, Number(campaign?.maxBonus || 0)) : raw;
    return { estimatedBonus: Math.max(capped, 0), turnoverRequired: Math.max(capped, 0) * Math.max(Number(campaign?.turnoverMultiplier || 0), 0) };
  }

  private cleanText(value: unknown) { return typeof value === 'string' ? value.trim() : ''; }
  private requireText(value: unknown, label: string) {
    const text = this.cleanText(value);
    if (!text) throw new BadRequestException(`${label} is required`);
    return text;
  }
  private safeJson(value: unknown) { return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue; }
}
