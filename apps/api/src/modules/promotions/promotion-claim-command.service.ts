import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { buildAdminAuditData } from '../../common/audit/admin-audit.builder';
import { PrismaService } from '../../database/prisma.service';
import { campaignIsActive, normalizePromotionCampaigns, type PromotionCampaign, type PromotionClaimLimitPeriod } from './promotion-asset-campaigns';
import { mapPromotionBonusLedger, mapPromotionClaim, promotionClaimMetadata } from './promotion.mapper';
import { PromotionDomainRepository } from './promotion-domain.repository';

type Actor = { id: string };
type ClaimInput = { campaignId?: string; note?: string; topupId?: string; depositAmount?: number };
type ReviewInput = { status?: 'APPROVED' | 'REJECTED'; adminNote?: string };

const CLAIM_REF_TYPE = 'PROMOTION_CLAIM';
const BONUS_REF_TYPE = 'BONUS_LEDGER';
const ACTIVE_CLAIM_STATUSES = ['OPEN', 'REVIEWING', 'RESOLVED'] as const;
const BANGKOK_OFFSET_MS = 7 * 60 * 60 * 1000;

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

    await this.assertClaimLimit(user.id, campaign);
    const linkedTopup = await this.resolveClaimTopup(user.id, campaign, input);
    if (linkedTopup && await this.findClaimUsingTopup(linkedTopup.id)) {
      throw new BadRequestException('รายการฝากนี้ถูกใช้รับโปรไปแล้ว');
    }

    const depositAmount = linkedTopup?.amount ?? Number(input.depositAmount || campaign.minDeposit || 0);
    if (campaign.requiresApprovedDeposit && !linkedTopup) {
      throw new BadRequestException('ไม่พบรายการฝากที่อนุมัติและเข้าเงื่อนไขโปรโมชั่น');
    }
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
    return normalizePromotionCampaigns(setting?.valueJson).filter((item) => campaignIsActive(item));
  }

  private async assertClaimLimit(memberId: string, campaign: PromotionCampaign) {
    if (campaign.maxClaimsPerMember <= 0) return;
    const createdAt = this.claimPeriodStart(campaign.claimLimitPeriod);
    const where: Prisma.RiskAlertWhereInput = {
      refType: CLAIM_REF_TYPE,
      memberId,
      refId: campaign.id,
      status: { in: [...ACTIVE_CLAIM_STATUSES] },
      ...(createdAt ? { createdAt: { gte: createdAt } } : {}),
    };
    const count = await this.prisma.riskAlert.count({ where });
    if (count >= campaign.maxClaimsPerMember) {
      const periodLabel = campaign.claimLimitPeriod === 'day' ? 'วันนี้'
        : campaign.claimLimitPeriod === 'week' ? 'สัปดาห์นี้'
          : campaign.claimLimitPeriod === 'month' ? 'เดือนนี้'
            : campaign.claimLimitPeriod === 'year' ? 'ปีนี้'
              : 'สำหรับบัญชีนี้';
      throw new BadRequestException(`รับโปรโมชั่นนี้ครบ ${campaign.maxClaimsPerMember} ครั้ง${periodLabel}แล้ว`);
    }
  }

  private async resolveClaimTopup(userId: string, campaign: PromotionCampaign, input: ClaimInput) {
    const explicitTopupId = this.cleanText(input.topupId);
    if (explicitTopupId) return this.validateTopup(userId, explicitTopupId, campaign);
    if (!campaign.requiresApprovedDeposit) return null;

    const approved = await this.prisma.topUpRequest.findMany({
      where: { userId, status: 'APPROVED' },
      orderBy: { createdAt: 'asc' },
      take: 300,
    });
    if (!approved.length) throw new BadRequestException('ยังไม่มีรายการฝากที่อนุมัติสำหรับรับโปรโมชั่นนี้');

    const usedTopupIds = await this.usedTopupIds(userId);
    const windowStart = campaign.depositWindowHours > 0
      ? Date.now() - campaign.depositWindowHours * 60 * 60 * 1000
      : Number.NEGATIVE_INFINITY;
    const eligible = approved.filter((topup) => {
      const amount = Number(topup.amount);
      const effectiveTime = (topup.reviewedAt ?? topup.createdAt).getTime();
      return amount >= campaign.minDeposit && effectiveTime >= windowStart && !usedTopupIds.has(topup.id);
    });

    let selected = null as (typeof approved)[number] | null;
    if (campaign.depositOrdinal > 0) {
      const ordinal = approved[campaign.depositOrdinal - 1] ?? null;
      if (ordinal && eligible.some((item) => item.id === ordinal.id)) selected = ordinal;
    } else if (campaign.consecutiveDepositDays > 1) {
      selected = this.findConsecutiveDeposit(eligible, campaign.consecutiveDepositDays);
    } else {
      selected = eligible.at(-1) ?? null;
    }

    if (!selected) {
      if (campaign.consecutiveDepositDays > 1) {
        throw new BadRequestException(`ต้องมีรายการฝากที่เข้าเงื่อนไขต่อเนื่อง ${campaign.consecutiveDepositDays} วัน`);
      }
      if (campaign.depositOrdinal > 0) {
        throw new BadRequestException(`รายการฝากลำดับที่ ${campaign.depositOrdinal} ไม่เข้าเงื่อนไขหรือถูกใช้รับโปรโมชั่นแล้ว`);
      }
      throw new BadRequestException('ไม่พบรายการฝากที่อนุมัติและเข้าเงื่อนไขโปรโมชั่น');
    }
    return this.formatTopup(selected);
  }

  private async validateTopup(userId: string, topupId: string, campaign: PromotionCampaign) {
    const topup = await this.prisma.topUpRequest.findFirst({ where: { id: topupId, userId } });
    if (!topup) throw new NotFoundException('Deposit not found');
    if (topup.status !== 'APPROVED') throw new BadRequestException('ใช้ได้เฉพาะรายการฝากที่อนุมัติแล้วเท่านั้น');
    const amount = Number(topup.amount);
    if (!Number.isFinite(amount) || amount <= 0) throw new BadRequestException('Deposit amount is invalid');
    if (amount < campaign.minDeposit) {
      throw new BadRequestException(`ยอดฝากต้องไม่น้อยกว่า ${campaign.minDeposit.toLocaleString('th-TH', { minimumFractionDigits: 2 })} THB`);
    }
    if (campaign.depositWindowHours > 0) {
      const effectiveTime = (topup.reviewedAt ?? topup.createdAt).getTime();
      if (effectiveTime < Date.now() - campaign.depositWindowHours * 60 * 60 * 1000) {
        throw new BadRequestException('รายการฝากอยู่นอกช่วงเวลาที่โปรโมชั่นกำหนด');
      }
    }
    return this.formatTopup(topup);
  }

  private formatTopup(topup: {
    id: string; amount: unknown; currency: string; status: string; method: string;
    referenceCode: string | null; reviewedAt: Date | null; createdAt: Date;
  }) {
    return {
      id: topup.id, amount: Number(topup.amount), currency: topup.currency, status: topup.status,
      method: topup.method, referenceCode: topup.referenceCode, reviewedAt: topup.reviewedAt, createdAt: topup.createdAt,
    };
  }

  private findConsecutiveDeposit<T extends { reviewedAt: Date | null; createdAt: Date }>(items: T[], requiredDays: number): T | null {
    const byDay = new Map<string, T>();
    for (const item of items) byDay.set(this.bangkokDateKey(item.reviewedAt ?? item.createdAt), item);
    const days = [...byDay.keys()].sort();
    let run = 0;
    let previous = '';
    for (const day of days) {
      run = previous && this.dayDifference(previous, day) === 1 ? run + 1 : 1;
      if (run >= requiredDays) return byDay.get(day) ?? null;
      previous = day;
    }
    return null;
  }

  private async usedTopupIds(memberId: string) {
    const claims = await this.prisma.riskAlert.findMany({
      where: { refType: CLAIM_REF_TYPE, memberId, status: { in: [...ACTIVE_CLAIM_STATUSES] } },
      orderBy: { createdAt: 'desc' },
      take: 1000,
    });
    return new Set(claims.map((claim) => promotionClaimMetadata(claim.metadata).topupId).filter((id): id is string => typeof id === 'string' && Boolean(id)));
  }

  private async findClaimUsingTopup(topupId: string) {
    const claims = await this.prisma.riskAlert.findMany({ where: { refType: CLAIM_REF_TYPE }, orderBy: { createdAt: 'desc' }, take: 1000 });
    return claims.find((claim) => promotionClaimMetadata(claim.metadata).topupId === topupId) ?? null;
  }

  private bonusPreview(campaign: PromotionCampaign | null, depositAmount: number) {
    const deposit = Math.max(Number(depositAmount || campaign?.minDeposit || 0), 0);
    const rawBonus = campaign?.bonusType === 'fixed'
      ? Number(campaign.bonusValue || 0)
      : deposit * (Number(campaign?.bonusValue || 0) / 100);
    const estimatedBonus = Number(campaign?.maxBonus || 0) > 0
      ? Math.min(rawBonus, Number(campaign?.maxBonus || 0))
      : rawBonus;
    const turnoverBase = campaign?.turnoverBasis === 'deposit_plus_bonus'
      ? deposit + estimatedBonus
      : campaign?.turnoverBasis === 'deposit'
        ? deposit
        : estimatedBonus;
    return {
      estimatedBonus: Math.max(estimatedBonus, 0),
      turnoverRequired: Math.max(turnoverBase, 0) * Math.max(Number(campaign?.turnoverMultiplier || 0), 0),
      turnoverBasis: campaign?.turnoverBasis ?? 'bonus',
    };
  }

  private claimPeriodStart(period: PromotionClaimLimitPeriod) {
    if (period === 'lifetime') return undefined;
    const nowBangkok = new Date(Date.now() + BANGKOK_OFFSET_MS);
    let year = nowBangkok.getUTCFullYear();
    let month = nowBangkok.getUTCMonth();
    let day = nowBangkok.getUTCDate();
    if (period === 'week') day -= nowBangkok.getUTCDay();
    if (period === 'month') day = 1;
    if (period === 'year') { month = 0; day = 1; }
    return new Date(Date.UTC(year, month, day) - BANGKOK_OFFSET_MS);
  }

  private bangkokDateKey(value: Date) { return new Date(value.getTime() + BANGKOK_OFFSET_MS).toISOString().slice(0, 10); }
  private dayDifference(left: string, right: string) { return Math.round((Date.parse(`${right}T00:00:00Z`) - Date.parse(`${left}T00:00:00Z`)) / 86_400_000); }
  private cleanText(value: unknown) { return typeof value === 'string' ? value.trim() : ''; }
  private requireText(value: unknown, label: string) {
    const text = this.cleanText(value);
    if (!text) throw new BadRequestException(`${label} is required`);
    return text;
  }
  private safeJson(value: unknown) { return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue; }
}
