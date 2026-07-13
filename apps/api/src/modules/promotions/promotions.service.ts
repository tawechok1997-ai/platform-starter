import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, RiskAlertStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { PromotionDomainRepository } from './promotion-domain.repository';

type Actor = { id: string };
type ClaimInput = { campaignId?: string; note?: string; topupId?: string; depositAmount?: number };
type ReviewInput = { status?: 'APPROVED' | 'REJECTED'; adminNote?: string };
type TurnoverInput = { amount?: number | string; note?: string };
type BonusLifecycleInput = { action?: 'RELEASE' | 'EXPIRE' | 'REVOKE'; note?: string };
type PromotionCampaign = { id: string; title: string; description: string; enabled: boolean; bonusType: 'fixed' | 'percent'; bonusValue: number; minDeposit: number; maxBonus: number; turnoverMultiplier: number; claimMode: 'manual_review' | 'auto_pending'; startsAt?: string; endsAt?: string };

const CLAIM_REF_TYPE = 'PROMOTION_CLAIM';
const BONUS_REF_TYPE = 'BONUS_LEDGER';
const CLAIM_STATUSES = ['OPEN', 'REVIEWING', 'RESOLVED', 'DISMISSED'] as const;
const BONUS_STATUSES = ['OPEN', 'REVIEWING', 'RESOLVED', 'DISMISSED'] as const;

@Injectable()
export class PromotionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly domain: PromotionDomainRepository,
  ) {}

  async listPublicCampaigns() { return { items: await this.activeCampaigns() }; }

  async createClaim(user: Actor, input: ClaimInput) {
    const campaignId = this.requireText(input.campaignId, 'campaignId');
    const campaign = (await this.activeCampaigns()).find((item) => item.id === campaignId);
    if (!campaign) throw new NotFoundException('Promotion campaign not found or inactive');
    const linkedTopup = await this.resolveClaimTopup(user.id, campaign, input);
    const duplicateCampaign = await this.prisma.riskAlert.findFirst({ where: { refType: CLAIM_REF_TYPE, memberId: user.id, refId: campaignId, status: { in: ['OPEN', 'REVIEWING'] } } });
    if (duplicateCampaign) throw new BadRequestException('คุณมีคำขอรับโปรนี้ที่กำลังรอตรวจอยู่แล้ว');
    if (linkedTopup && await this.findClaimUsingTopup(linkedTopup.id)) throw new BadRequestException('รายการฝากนี้ถูกใช้รับโปรไปแล้ว');

    const depositAmount = linkedTopup ? linkedTopup.amount : Number(input.depositAmount || campaign.minDeposit || 0);
    if (depositAmount < campaign.minDeposit) throw new BadRequestException(`ยอดฝากต้องไม่น้อยกว่า ${campaign.minDeposit.toLocaleString('th-TH', { minimumFractionDigits: 2 })} THB`);
    const preview = this.bonusPreview(campaign, depositAmount);
    const metadata = { campaign, campaignId, topupId: linkedTopup?.id ?? input.topupId ?? null, linkedTopup, depositAmount, memberNote: input.note ?? '', requestedAt: new Date().toISOString(), bonusPreview: preview, settlement: { enabled: false, reason: 'Bonus ledger pending approval' }, events: [{ by: 'member', action: 'CLAIM_CREATED', message: input.note ?? '', createdAt: new Date().toISOString() }] };

    const item = await this.prisma.riskAlert.create({ data: { type: 'WALLET_LEDGER_MISMATCH', severity: 'LOW', status: 'OPEN', memberId: user.id, refType: CLAIM_REF_TYPE, refId: campaignId, title: `Promotion claim: ${campaign.title}`, description: input.note?.trim() || `ขอรับโปร ${campaign.title}`, metadata: this.safeJson(metadata) } });
    try {
      await this.domain.createClaim({ id: item.id, memberId: user.id, campaignId, topUpRequestId: linkedTopup?.id ?? null, sourceRiskAlertId: item.id, depositAmount, bonusAmount: preview.estimatedBonus, memberNote: input.note ?? null });
    } catch (error) {
      await this.prisma.riskAlert.delete({ where: { id: item.id } }).catch(() => null);
      throw error;
    }
    return { ok: true, item: this.formatClaim(item) };
  }

  async listMemberClaims(user: Actor) { const items = await this.prisma.riskAlert.findMany({ where: { refType: CLAIM_REF_TYPE, memberId: user.id }, orderBy: { createdAt: 'desc' }, take: 50 }); return { items: items.map((item) => this.formatClaim(item)) }; }

  async listAdminClaims(query: { status?: string }) {
    const where: Prisma.RiskAlertWhereInput = { refType: CLAIM_REF_TYPE };
    if (query.status && query.status !== 'ALL' && CLAIM_STATUSES.includes(query.status as any)) where.status = query.status as RiskAlertStatus;
    const items = await this.prisma.riskAlert.findMany({ where, orderBy: { createdAt: 'desc' }, take: 100 });
    const memberMap = await this.memberMap(items.map((item) => item.memberId).filter(Boolean) as string[]);
    return { items: items.map((item) => this.formatClaim({ ...item, member: item.memberId ? memberMap.get(item.memberId) : undefined })), total: items.length };
  }

  async reviewClaim(admin: Actor, id: string, input: ReviewInput) {
    const item = await this.prisma.riskAlert.findFirst({ where: { id, refType: CLAIM_REF_TYPE } });
    if (!item) throw new NotFoundException('Promotion claim not found');
    const metadata = this.claimMetadata(item.metadata);
    const nextStatus = input.status === 'APPROVED' ? 'RESOLVED' : input.status === 'REJECTED' ? 'DISMISSED' : 'REVIEWING';
    if (input.status === 'REJECTED' && !input.adminNote?.trim()) throw new BadRequestException('adminNote is required when rejecting a promotion claim');
    const events = [...metadata.events, { by: 'admin', adminUserId: admin.id, action: input.status ?? 'REVIEWING', message: input.adminNote ?? '', createdAt: new Date().toISOString() }];
    const settlement = input.status === 'APPROVED' ? { enabled: true, mode: 'bonus_ledger_only', reason: 'Bonus ledger created; wallet settlement requires completed turnover' } : { enabled: false, reason: 'Claim not approved' };

    await this.domain.markClaimReviewed({ sourceRiskAlertId: id, status: input.status ?? 'REVIEWING', adminUserId: admin.id, adminNote: input.adminNote ?? null });
    const updated = await this.prisma.riskAlert.update({ where: { id }, data: { status: nextStatus, severity: nextStatus === 'RESOLVED' ? 'LOW' : item.severity, resolvedAt: nextStatus === 'RESOLVED' || nextStatus === 'DISMISSED' ? new Date() : undefined, metadata: this.safeJson({ ...metadata, adminNote: input.adminNote ?? metadata.adminNote ?? '', reviewResult: input.status ?? 'REVIEWING', settlement, events }) } });
    const bonusLedger = input.status === 'APPROVED' ? await this.createBonusLedgerFromClaim(updated, admin.id) : null;
    await this.audit(admin.id, 'promotion.claim.review', id, item, { updated, bonusLedger });
    return { ok: true, item: this.formatClaim(updated), bonusLedger: bonusLedger ? this.formatBonusLedger(bonusLedger) : null };
  }

  async listAdminBonusLedgers(query: { status?: string }) {
    const where: Prisma.RiskAlertWhereInput = { refType: BONUS_REF_TYPE };
    if (query.status && query.status !== 'ALL' && BONUS_STATUSES.includes(query.status as any)) where.status = query.status as RiskAlertStatus;
    const items = await this.prisma.riskAlert.findMany({ where, orderBy: { createdAt: 'desc' }, take: 100 });
    const memberMap = await this.memberMap(items.map((item) => item.memberId).filter(Boolean) as string[]);
    return { items: items.map((item) => this.formatBonusLedger({ ...item, member: item.memberId ? memberMap.get(item.memberId) : undefined })), total: items.length };
  }

  async listMemberBonusLedgers(user: Actor) { const items = await this.prisma.riskAlert.findMany({ where: { refType: BONUS_REF_TYPE, memberId: user.id }, orderBy: { createdAt: 'desc' }, take: 50 }); return { items: items.map((item) => this.formatBonusLedger(item)) }; }

  async addTurnoverProgress(admin: Actor, id: string, input: TurnoverInput) {
    const item = await this.prisma.riskAlert.findFirst({ where: { id, refType: BONUS_REF_TYPE } });
    if (!item) throw new NotFoundException('Bonus ledger not found');
    const amount = Number(input.amount ?? 0);
    if (!Number.isFinite(amount) || amount <= 0) throw new BadRequestException('amount must be positive');
    const metadata = this.bonusMetadata(item.metadata);
    if (metadata.lifecycleStatus === 'REVOKED' || metadata.lifecycleStatus === 'EXPIRED') throw new BadRequestException('Cannot update turnover for expired or revoked bonus');

    const domainLedger = await this.domain.addTurnover(id, amount);
    if (!domainLedger) throw new BadRequestException('Bonus domain ledger is not active');
    const turnoverProgress = Number(domainLedger.turnover_progress ?? 0);
    const turnoverRequired = Number(domainLedger.turnover_required ?? 0);
    const completed = String(domainLedger.status) === 'TURNOVER_COMPLETED';
    const lifecycleStatus = completed ? 'TURNOVER_COMPLETED' : metadata.lifecycleStatus;
    const walletCreditStatus = completed ? 'READY_FOR_MANUAL_RELEASE' : metadata.walletCreditStatus;
    const events = [...metadata.events, { by: 'admin', adminUserId: admin.id, action: 'TURNOVER_PROGRESS', amount, message: input.note ?? '', createdAt: new Date().toISOString() }];
    const updated = await this.prisma.riskAlert.update({ where: { id }, data: { status: completed ? 'RESOLVED' : item.status, resolvedAt: completed ? new Date() : item.resolvedAt, metadata: this.safeJson({ ...metadata, turnoverProgress, turnoverRequired, turnoverCompleted: completed, lifecycleStatus, walletCreditEnabled: false, walletCreditStatus, events }) } });
    await this.audit(admin.id, 'bonus.turnover.progress', id, item, updated);
    return { ok: true, item: this.formatBonusLedger(updated) };
  }

  async updateBonusLifecycle(admin: Actor, id: string, input: BonusLifecycleInput) {
    const action = String(input.action ?? '').toUpperCase() as BonusLifecycleInput['action'];
    if (!['RELEASE', 'EXPIRE', 'REVOKE'].includes(action ?? '')) throw new BadRequestException('action must be RELEASE, EXPIRE, or REVOKE');
    const item = await this.prisma.riskAlert.findFirst({ where: { id, refType: BONUS_REF_TYPE } });
    if (!item) throw new NotFoundException('Bonus ledger not found');
    const metadata = this.bonusMetadata(item.metadata);
    const note = this.cleanText(input.note);
    if ((action === 'EXPIRE' || action === 'REVOKE') && !note) throw new BadRequestException('note is required for expire or revoke');
    if (['REVOKED', 'EXPIRED', 'SETTLED'].includes(metadata.lifecycleStatus)) throw new BadRequestException(`Bonus is already ${metadata.lifecycleStatus.toLowerCase()}`);
    if (action === 'RELEASE' && !metadata.turnoverCompleted) throw new BadRequestException('ต้องทำเทิร์นให้ครบก่อน release โบนัส');

    const domainLifecycle = await this.domain.updateLifecycle(id, action!);
    if (!domainLifecycle) throw new BadRequestException('Bonus lifecycle transition was rejected');
    let settlement: Record<string, unknown> | null = null;
    if (action === 'RELEASE') settlement = await this.domain.settleBonus({ sourceRiskAlertId: id, adminUserId: admin.id, idempotencyKey: `bonus:${id}:settlement` }) as Record<string, unknown>;

    const lifecycleStatus = action === 'RELEASE' ? 'SETTLED' : action === 'EXPIRE' ? 'EXPIRED' : 'REVOKED';
    const walletCreditStatus = action === 'RELEASE' ? 'CREDITED' : action === 'EXPIRE' ? 'EXPIRED_NO_WALLET_CREDIT' : 'REVOKED_NO_WALLET_CREDIT';
    const nextStatus: RiskAlertStatus = action === 'RELEASE' ? 'RESOLVED' : 'DISMISSED';
    const events = [...metadata.events, { by: 'admin', adminUserId: admin.id, action: `BONUS_${action}`, message: note, createdAt: new Date().toISOString() }];
    const updated = await this.prisma.riskAlert.update({ where: { id }, data: { status: nextStatus, resolvedAt: new Date(), metadata: this.safeJson({ ...metadata, lifecycleStatus, walletCreditEnabled: action === 'RELEASE', walletCreditStatus, walletLedgerId: settlement?.wallet_ledger_id ?? null, lifecycleNote: note, lifecycleUpdatedAt: new Date().toISOString(), lifecycleUpdatedBy: admin.id, events }) } });
    await this.audit(admin.id, `bonus.lifecycle.${String(action).toLowerCase()}`, id, item, { updated, settlement });
    return { ok: true, item: this.formatBonusLedger(updated) };
  }

  private async resolveClaimTopup(userId: string, campaign: PromotionCampaign, input: ClaimInput) {
    const topupId = this.cleanText(input.topupId); if (!topupId) return null;
    const topup = await this.prisma.topUpRequest.findFirst({ where: { id: topupId, userId } });
    if (!topup) throw new NotFoundException('Deposit not found');
    if (topup.status !== 'APPROVED') throw new BadRequestException('ใช้ได้เฉพาะรายการฝากที่อนุมัติแล้วเท่านั้น');
    const amount = Number(topup.amount);
    if (!Number.isFinite(amount) || amount <= 0) throw new BadRequestException('Deposit amount is invalid');
    if (amount < campaign.minDeposit) throw new BadRequestException(`ยอดฝากต้องไม่น้อยกว่า ${campaign.minDeposit.toLocaleString('th-TH', { minimumFractionDigits: 2 })} THB`);
    return { id: topup.id, amount, currency: topup.currency, status: topup.status, method: topup.method, referenceCode: topup.referenceCode, reviewedAt: topup.reviewedAt, createdAt: topup.createdAt };
  }

  private async findClaimUsingTopup(topupId: string) { const claims = await this.prisma.riskAlert.findMany({ where: { refType: CLAIM_REF_TYPE }, orderBy: { createdAt: 'desc' }, take: 500 }); return claims.find((claim) => this.claimMetadata(claim.metadata).topupId === topupId) ?? null; }

  private async createBonusLedgerFromClaim(claim: any, adminUserId: string) {
    const claimMetadata = this.claimMetadata(claim.metadata);
    const existing = await this.prisma.riskAlert.findFirst({ where: { refType: BONUS_REF_TYPE, refId: claim.id } });
    if (existing) return existing;
    const campaign = claimMetadata.campaign as PromotionCampaign | null;
    const preview = this.bonusPreview(campaign ?? claimMetadata.campaign, Number(claimMetadata.depositAmount || campaign?.minDeposit || 0));
    const turnoverCompleted = preview.turnoverRequired <= 0;
    const metadata = { claimId: claim.id, campaignId: claimMetadata.campaignId || claim.refId, topupId: claimMetadata.topupId, linkedTopup: claimMetadata.linkedTopup, depositAmount: claimMetadata.depositAmount, campaign, amount: preview.estimatedBonus, currency: 'THB', turnoverRequired: preview.turnoverRequired, turnoverProgress: 0, turnoverCompleted, lifecycleStatus: turnoverCompleted ? 'TURNOVER_COMPLETED' : 'ACTIVE', walletCreditEnabled: false, walletCreditStatus: turnoverCompleted ? 'READY_FOR_MANUAL_RELEASE' : 'BLOCKED_UNTIL_TURNOVER_GUARD', events: [{ by: 'system', adminUserId, action: 'BONUS_LEDGER_CREATED', message: 'Created from approved promotion claim', createdAt: new Date().toISOString() }] };
    const riskLedger = await this.prisma.riskAlert.create({ data: { type: 'WALLET_LEDGER_MISMATCH', severity: 'LOW', status: turnoverCompleted ? 'RESOLVED' : 'OPEN', memberId: claim.memberId, refType: BONUS_REF_TYPE, refId: claim.id, title: `Bonus ledger: ${campaign?.title ?? claimMetadata.campaignId}`, description: `โบนัส ${preview.estimatedBonus.toFixed(2)} THB · เทิร์น ${preview.turnoverRequired.toFixed(2)}`, metadata: this.safeJson(metadata) } });
    try {
      await this.domain.createBonusLedger({ id: riskLedger.id, promotionClaimId: claim.id, memberId: claim.memberId, sourceRiskAlertId: riskLedger.id, amount: preview.estimatedBonus, currency: 'THB', turnoverRequired: preview.turnoverRequired });
    } catch (error) {
      await this.prisma.riskAlert.delete({ where: { id: riskLedger.id } }).catch(() => null);
      throw error;
    }
    return riskLedger;
  }

  private async activeCampaigns() { const settings = await this.prisma.siteSetting.findUnique({ where: { key: 'features.promotion_campaigns' } }); const campaigns = this.normalizeCampaigns(settings?.valueJson); const now = Date.now(); return campaigns.filter((item) => item.enabled && this.inWindow(item, now)); }
  private normalizeCampaigns(value: unknown): PromotionCampaign[] { if (!Array.isArray(value)) return []; return value.map((item: any, index) => ({ id: String(item.id ?? `promotion-${index + 1}`), title: String(item.title ?? 'Promotion'), description: String(item.description ?? ''), enabled: item.enabled === true, bonusType: item.bonusType === 'fixed' ? 'fixed' : 'percent', bonusValue: Number(item.bonusValue ?? 0), minDeposit: Number(item.minDeposit ?? 0), maxBonus: Number(item.maxBonus ?? 0), turnoverMultiplier: Number(item.turnoverMultiplier ?? 0), claimMode: item.claimMode === 'auto_pending' ? 'auto_pending' : 'manual_review', startsAt: typeof item.startsAt === 'string' ? item.startsAt : undefined, endsAt: typeof item.endsAt === 'string' ? item.endsAt : undefined })); }
  private inWindow(item: PromotionCampaign, now: number) { const start = item.startsAt ? Date.parse(item.startsAt) : NaN; const end = item.endsAt ? Date.parse(item.endsAt) : NaN; if (Number.isFinite(start) && now < start) return false; if (Number.isFinite(end) && now > end) return false; return true; }
  private bonusPreview(campaign: PromotionCampaign | any, depositAmount: number) { const base = Number(depositAmount || campaign?.minDeposit || 0); const raw = campaign?.bonusType === 'fixed' ? Number(campaign?.bonusValue || 0) : base * (Number(campaign?.bonusValue || 0) / 100); const capped = Number(campaign?.maxBonus || 0) > 0 ? Math.min(raw, Number(campaign?.maxBonus || 0)) : raw; return { estimatedBonus: Math.max(capped, 0), turnoverRequired: Math.max(capped, 0) * Math.max(Number(campaign?.turnoverMultiplier || 0), 0) }; }
  private claimMetadata(value: unknown) { const data = value && typeof value === 'object' && !Array.isArray(value) ? value as any : {}; return { campaign: data.campaign ?? null, campaignId: String(data.campaignId ?? ''), topupId: data.topupId ?? null, linkedTopup: data.linkedTopup ?? null, depositAmount: Number(data.depositAmount ?? 0), memberNote: data.memberNote ?? '', adminNote: data.adminNote ?? '', reviewResult: data.reviewResult ?? null, settlement: data.settlement ?? { enabled: false }, events: Array.isArray(data.events) ? data.events : [] }; }
  private bonusMetadata(value: unknown) { const data = value && typeof value === 'object' && !Array.isArray(value) ? value as any : {}; return { claimId: String(data.claimId ?? ''), campaignId: String(data.campaignId ?? ''), topupId: data.topupId ?? null, linkedTopup: data.linkedTopup ?? null, depositAmount: Number(data.depositAmount ?? 0), campaign: data.campaign ?? null, amount: Number(data.amount ?? 0), currency: String(data.currency ?? 'THB'), turnoverRequired: Number(data.turnoverRequired ?? 0), turnoverProgress: Number(data.turnoverProgress ?? 0), turnoverCompleted: data.turnoverCompleted === true, lifecycleStatus: String(data.lifecycleStatus ?? (data.turnoverCompleted ? 'TURNOVER_COMPLETED' : 'ACTIVE')), lifecycleNote: String(data.lifecycleNote ?? ''), walletCreditEnabled: data.walletCreditEnabled === true, walletCreditStatus: String(data.walletCreditStatus ?? 'BLOCKED'), events: Array.isArray(data.events) ? data.events : [] }; }
  private formatClaim(item: any) { const metadata = this.claimMetadata(item.metadata); return { id: item.id, campaignId: metadata.campaignId || item.refId, campaign: metadata.campaign, topupId: metadata.topupId, linkedTopup: metadata.linkedTopup, depositAmount: metadata.depositAmount, status: claimStatusLabel(item.status), rawStatus: item.status, memberNote: metadata.memberNote, adminNote: metadata.adminNote, settlement: metadata.settlement, events: metadata.events, member: item.member ?? undefined, createdAt: item.createdAt, updatedAt: item.updatedAt, resolvedAt: item.resolvedAt }; }
  private formatBonusLedger(item: any) { const metadata = this.bonusMetadata(item.metadata); return { id: item.id, claimId: metadata.claimId || item.refId, campaignId: metadata.campaignId, topupId: metadata.topupId, linkedTopup: metadata.linkedTopup, depositAmount: metadata.depositAmount, campaign: metadata.campaign, amount: metadata.amount, currency: metadata.currency, turnoverRequired: metadata.turnoverRequired, turnoverProgress: metadata.turnoverProgress, turnoverCompleted: metadata.turnoverCompleted, lifecycleStatus: metadata.lifecycleStatus, lifecycleNote: metadata.lifecycleNote, walletCreditEnabled: metadata.walletCreditEnabled, walletCreditStatus: metadata.walletCreditStatus, status: bonusStatusLabel(item.status, metadata), rawStatus: item.status, events: metadata.events, member: item.member ?? undefined, createdAt: item.createdAt, updatedAt: item.updatedAt, resolvedAt: item.resolvedAt }; }
  private async memberMap(memberIds: string[]) { const uniqueIds = Array.from(new Set(memberIds)); if (!uniqueIds.length) return new Map<string, any>(); const users = await this.prisma.user.findMany({ where: { id: { in: uniqueIds } }, select: { id: true, username: true, phone: true, email: true, status: true } }); return new Map(users.map((user) => [user.id, user])); }
  private cleanText(value: unknown) { return typeof value === 'string' ? value.trim() : ''; }
  private requireText(value: unknown, label: string) { const text = this.cleanText(value); if (!text) throw new BadRequestException(`${label} is required`); return text; }
  private safeJson(value: unknown) { return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue; }
  private audit(adminUserId: string, action: string, targetId: string, oldData: unknown, newData: unknown) { return this.prisma.adminAuditLog.create({ data: { adminUserId, module: 'promotions', action, targetId, oldData: this.safeJson(oldData ?? null), newData: this.safeJson(newData ?? null) } }).catch(() => null); }
}

function claimStatusLabel(status: string) { const map: Record<string, string> = { OPEN: 'PENDING', REVIEWING: 'REVIEWING', RESOLVED: 'APPROVED', DISMISSED: 'REJECTED' }; return map[status] ?? status; }
function bonusStatusLabel(status: string, metadata: any) { if (metadata.lifecycleStatus === 'SETTLED') return 'SETTLED'; if (metadata.lifecycleStatus === 'RELEASE_READY') return 'RELEASE_READY'; if (metadata.lifecycleStatus === 'REVOKED') return 'REVOKED'; if (metadata.lifecycleStatus === 'EXPIRED') return 'EXPIRED'; if (metadata.turnoverCompleted) return 'TURNOVER_COMPLETED'; const map: Record<string, string> = { OPEN: 'ACTIVE', REVIEWING: 'REVIEWING', RESOLVED: 'COMPLETED', DISMISSED: 'EXPIRED' }; return map[status] ?? status; }
