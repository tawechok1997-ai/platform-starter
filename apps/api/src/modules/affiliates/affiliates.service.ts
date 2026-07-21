import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, RiskAlertStatus } from '@prisma/client';
import { buildAdminAuditData } from '../../common/audit/admin-audit.builder';
import { PrismaService } from '../../database/prisma.service';

type Actor = { id: string };
type CreateProfileInput = { displayName?: string; referralCode?: string };
type LinkReferralInput = { referralCode?: string };
type CreateCommissionInput = { agentProfileId?: string; amount?: number | string; basis?: string; note?: string; basisAmount?: number | string; ratePercent?: number | string; capAmount?: number | string };
type CommissionPreviewInput = { agentProfileId?: string; basisAmount?: number | string; ratePercent?: number | string; capAmount?: number | string; basis?: string };

const AFFILIATE_PROFILE_REF_TYPE = 'AFFILIATE_PROFILE';
const AFFILIATE_LINK_REF_TYPE = 'AFFILIATE_LINK';
const COMMISSION_LEDGER_REF_TYPE = 'COMMISSION_LEDGER';
const AFFILIATE_STATUSES = ['OPEN', 'REVIEWING', 'RESOLVED', 'DISMISSED'] as const;
const DEFAULT_COMMISSION_RATE_PERCENT = 5;

@Injectable()
export class AffiliatesService {
  constructor(private readonly prisma: PrismaService) {}

  async getMemberProfile(user: Actor) {
    const profile = await this.findProfileByMember(user.id);
    const links = profile ? await this.downlinesForProfile(profile.referralCode) : [];
    const commissions = profile ? await this.listMemberCommissions(user) : { items: [] };
    return { profile, downlines: links, commissions: commissions.items };
  }

  async createOrUpdateMemberProfile(user: Actor, input: CreateProfileInput) {
    const existing = await this.prisma.riskAlert.findFirst({ where: { refType: AFFILIATE_PROFILE_REF_TYPE, memberId: user.id } });
    const referralCode = this.normalizeCode(input.referralCode || existing?.refId || this.codeFromUserId(user.id));
    const used = await this.prisma.riskAlert.findFirst({ where: { refType: AFFILIATE_PROFILE_REF_TYPE, refId: referralCode, memberId: { not: user.id } } });
    if (used) throw new BadRequestException('Referral code นี้ถูกใช้แล้ว');
    const existingMeta = existing ? this.profileMetadata(existing.metadata) : null;
    const metadata = { referralCode, displayName: this.cleanText(input.displayName) || existingMeta?.displayName || `Agent ${referralCode}`, commissionRate: existingMeta?.commissionRate || DEFAULT_COMMISSION_RATE_PERCENT, payoutEnabled: false, payoutStatus: 'COMMISSION_LEDGER_REVIEW_ONLY', events: [...(existingMeta?.events ?? []), { by: 'member', action: existing ? 'AFFILIATE_PROFILE_UPDATED' : 'AFFILIATE_PROFILE_CREATED', createdAt: new Date().toISOString() }] };
    const item = existing ? await this.prisma.riskAlert.update({ where: { id: existing.id }, data: { refId: referralCode, title: `Affiliate: ${metadata.displayName}`, metadata: this.safeJson(metadata) } }) : await this.prisma.riskAlert.create({ data: { type: 'WALLET_LEDGER_MISMATCH', severity: 'LOW', status: 'OPEN', memberId: user.id, refType: AFFILIATE_PROFILE_REF_TYPE, refId: referralCode, title: `Affiliate: ${metadata.displayName}`, description: 'Affiliate profile pending admin review', metadata: this.safeJson(metadata) } });
    return { ok: true, profile: await this.formatProfile(item) };
  }

  async linkMemberReferral(user: Actor, input: LinkReferralInput) {
    const referralCode = this.normalizeCode(input.referralCode);
    if (!referralCode) throw new BadRequestException('referralCode is required');
    const agent = await this.prisma.riskAlert.findFirst({ where: { refType: AFFILIATE_PROFILE_REF_TYPE, refId: referralCode } });
    if (!agent) throw new NotFoundException('Referral code not found');
    if (agent.memberId === user.id) throw new BadRequestException('ไม่สามารถใช้ referral code ของตัวเองได้');
    const existing = await this.prisma.riskAlert.findFirst({ where: { refType: AFFILIATE_LINK_REF_TYPE, memberId: user.id } });
    if (existing) throw new BadRequestException('บัญชีนี้ผูก referral แล้ว');
    const metadata = { referralCode, agentMemberId: agent.memberId, linkedAt: new Date().toISOString(), commissionEnabled: false, commissionStatus: 'COMMISSION_LEDGER_REVIEW_ONLY', events: [{ by: 'member', action: 'REFERRAL_LINKED', referralCode, createdAt: new Date().toISOString() }] };
    const item = await this.prisma.riskAlert.create({ data: { type: 'WALLET_LEDGER_MISMATCH', severity: 'LOW', status: 'RESOLVED', memberId: user.id, refType: AFFILIATE_LINK_REF_TYPE, refId: referralCode, title: `Referral linked: ${referralCode}`, description: 'Member linked to affiliate agent', metadata: this.safeJson(metadata), resolvedAt: new Date() } });
    return { ok: true, link: await this.formatLink(item) };
  }

  async listAdminProfiles(query: { status?: string }) {
    const where: Prisma.RiskAlertWhereInput = { refType: AFFILIATE_PROFILE_REF_TYPE };
    if (query.status && query.status !== 'ALL' && AFFILIATE_STATUSES.includes(query.status as any)) where.status = query.status as RiskAlertStatus;
    const items = await this.prisma.riskAlert.findMany({ where, orderBy: { createdAt: 'desc' }, take: 100 });
    const profiles = await Promise.all(items.map((item) => this.formatProfile(item)));
    return { items: profiles, total: profiles.length };
  }

  async reviewProfile(admin: Actor, id: string, input: { status?: 'APPROVED' | 'REJECTED'; adminNote?: string }) {
    const item = await this.prisma.riskAlert.findFirst({ where: { id, refType: AFFILIATE_PROFILE_REF_TYPE } });
    if (!item) throw new NotFoundException('Affiliate profile not found');
    if (input.status === 'REJECTED' && !input.adminNote?.trim()) throw new BadRequestException('adminNote is required when rejecting affiliate profile');
    const metadata = this.profileMetadata(item.metadata);
    const nextStatus = input.status === 'APPROVED' ? 'RESOLVED' : input.status === 'REJECTED' ? 'DISMISSED' : 'REVIEWING';
    const events = [...metadata.events, { by: 'admin', adminUserId: admin.id, action: input.status ?? 'REVIEWING', message: input.adminNote ?? '', createdAt: new Date().toISOString() }];
    const updated = await this.prisma.riskAlert.update({ where: { id }, data: { status: nextStatus, resolvedAt: nextStatus === 'RESOLVED' || nextStatus === 'DISMISSED' ? new Date() : undefined, metadata: this.safeJson({ ...metadata, adminNote: input.adminNote ?? metadata.adminNote ?? '', events }) } });
    await this.audit(admin.id, 'affiliate.profile.review', id, item, updated);
    return { ok: true, profile: await this.formatProfile(updated) };
  }

  async previewCommission(input: CommissionPreviewInput) {
    const agent = await this.requireApprovedAgent(this.cleanText(input.agentProfileId));
    const agentMeta = this.profileMetadata(agent.metadata);
    const preview = this.calculateCommission(input, agentMeta.commissionRate || DEFAULT_COMMISSION_RATE_PERCENT);
    const referralCode = agentMeta.referralCode || agent.refId;
    const downlineCount = referralCode ? (await this.downlinesForProfile(referralCode)).length : 0;
    return { agent: await this.formatProfile(agent), downlineCount, rule: preview.rule, amount: preview.amount, currency: 'THB', payoutEnabled: false, payoutStatus: 'PREVIEW_ONLY_NO_WALLET_SETTLEMENT' };
  }

  async createCommissionLedger(admin: Actor, input: CreateCommissionInput) {
    const agent = await this.requireApprovedAgent(this.cleanText(input.agentProfileId));
    const agentMeta = this.profileMetadata(agent.metadata);
    const calculated = this.calculateCommission(input, agentMeta.commissionRate || DEFAULT_COMMISSION_RATE_PERCENT);
    const manualAmount = Number(input.amount ?? 0);
    const amount = Number.isFinite(manualAmount) && manualAmount > 0 ? manualAmount : calculated.amount;
    if (!Number.isFinite(amount) || amount <= 0) throw new BadRequestException('amount must be positive');
    const metadata = { agentProfileId: agent.id, referralCode: agentMeta.referralCode || agent.refId, amount, currency: 'THB', basis: this.cleanText(input.basis) || calculated.rule.basis, basisAmount: calculated.rule.basisAmount, ratePercent: calculated.rule.ratePercent, capAmount: calculated.rule.capAmount, calculatedAmount: calculated.amount, manualOverride: Number.isFinite(manualAmount) && manualAmount > 0 && manualAmount !== calculated.amount, note: this.cleanText(input.note), payoutEnabled: false, payoutStatus: 'PAYOUT_DISABLED_PENDING_COMMISSION_LEDGER_GUARD', events: [{ by: 'admin', adminUserId: admin.id, action: 'COMMISSION_CREATED', amount, message: input.note ?? '', createdAt: new Date().toISOString() }] };
    const item = await this.prisma.riskAlert.create({ data: { type: 'WALLET_LEDGER_MISMATCH', severity: metadata.manualOverride ? 'MEDIUM' : 'LOW', status: 'OPEN', memberId: agent.memberId, refType: COMMISSION_LEDGER_REF_TYPE, refId: agent.id, title: `Commission: ${agentMeta.displayName || agentMeta.referralCode}`, description: `Commission ${amount.toFixed(2)} THB · ${metadata.basis}`, metadata: this.safeJson(metadata) } });
    await this.audit(admin.id, 'commission.create', item.id, null, item);
    return { ok: true, item: await this.formatCommission(item) };
  }

  async listAdminCommissions(query: { status?: string }) {
    const where: Prisma.RiskAlertWhereInput = { refType: COMMISSION_LEDGER_REF_TYPE };
    if (query.status && query.status !== 'ALL' && AFFILIATE_STATUSES.includes(query.status as any)) where.status = query.status as RiskAlertStatus;
    const items = await this.prisma.riskAlert.findMany({ where, orderBy: { createdAt: 'desc' }, take: 100 });
    return { items: await Promise.all(items.map((item) => this.formatCommission(item))), total: items.length };
  }

  async listMemberCommissions(user: Actor) {
    const items = await this.prisma.riskAlert.findMany({ where: { refType: COMMISSION_LEDGER_REF_TYPE, memberId: user.id }, orderBy: { createdAt: 'desc' }, take: 50 });
    return { items: await Promise.all(items.map((item) => this.formatCommission(item))) };
  }

  async reviewCommission(admin: Actor, id: string, input: { status?: 'APPROVED' | 'REJECTED'; adminNote?: string }) {
    const item = await this.prisma.riskAlert.findFirst({ where: { id, refType: COMMISSION_LEDGER_REF_TYPE } });
    if (!item) throw new NotFoundException('Commission ledger not found');
    if (input.status === 'REJECTED' && !input.adminNote?.trim()) throw new BadRequestException('adminNote is required when rejecting commission');
    const metadata = this.commissionMetadata(item.metadata);
    const nextStatus = input.status === 'APPROVED' ? 'RESOLVED' : input.status === 'REJECTED' ? 'DISMISSED' : 'REVIEWING';
    const events = [...metadata.events, { by: 'admin', adminUserId: admin.id, action: input.status ?? 'REVIEWING', message: input.adminNote ?? '', createdAt: new Date().toISOString() }];
    const updated = await this.prisma.riskAlert.update({ where: { id }, data: { status: nextStatus, resolvedAt: nextStatus === 'RESOLVED' || nextStatus === 'DISMISSED' ? new Date() : undefined, metadata: this.safeJson({ ...metadata, adminNote: input.adminNote ?? metadata.adminNote ?? '', payoutEnabled: false, payoutStatus: 'PAYOUT_DISABLED_PENDING_WALLET_SETTLEMENT', events }) } });
    await this.audit(admin.id, 'commission.review', id, item, updated);
    return { ok: true, item: await this.formatCommission(updated) };
  }

  private async requireApprovedAgent(agentProfileId: string) { if (!agentProfileId) throw new BadRequestException('agentProfileId is required'); const agent = await this.prisma.riskAlert.findFirst({ where: { id: agentProfileId, refType: AFFILIATE_PROFILE_REF_TYPE } }); if (!agent) throw new NotFoundException('Affiliate profile not found'); if (agent.status !== 'RESOLVED') throw new BadRequestException('อนุมัติตัวแทนก่อนสร้าง commission'); return agent; }
  private calculateCommission(input: CommissionPreviewInput, defaultRatePercent: number) { const basisAmount = Number(input.basisAmount ?? 0); if (!Number.isFinite(basisAmount) || basisAmount <= 0) throw new BadRequestException('basisAmount must be positive'); const ratePercent = Number(input.ratePercent ?? defaultRatePercent); if (!Number.isFinite(ratePercent) || ratePercent < 0 || ratePercent > 100) throw new BadRequestException('ratePercent must be between 0 and 100'); const capAmount = Number(input.capAmount ?? 0); const raw = basisAmount * (ratePercent / 100); const amount = capAmount > 0 ? Math.min(raw, capAmount) : raw; return { amount: roundMoney(amount), rule: { basis: this.cleanText(input.basis) || 'manual_basis', basisAmount, ratePercent, capAmount: Number.isFinite(capAmount) && capAmount > 0 ? capAmount : null } }; }
  private async findProfileByMember(memberId: string) { const item = await this.prisma.riskAlert.findFirst({ where: { refType: AFFILIATE_PROFILE_REF_TYPE, memberId } }); return item ? this.formatProfile(item) : null; }
  private async downlinesForProfile(referralCode: string) { const links = await this.prisma.riskAlert.findMany({ where: { refType: AFFILIATE_LINK_REF_TYPE, refId: referralCode }, orderBy: { createdAt: 'desc' }, take: 100 }); return Promise.all(links.map((item) => this.formatLink(item))); }
  private async formatProfile(item: any) { const metadata = this.profileMetadata(item.metadata); const member = item.memberId ? await this.member(item.memberId) : null; const downlines = await this.downlinesForProfile(metadata.referralCode || item.refId); return { id: item.id, referralCode: metadata.referralCode || item.refId, displayName: metadata.displayName, commissionRate: metadata.commissionRate, payoutEnabled: metadata.payoutEnabled, payoutStatus: metadata.payoutStatus, status: affiliateStatusLabel(item.status), rawStatus: item.status, adminNote: metadata.adminNote, events: metadata.events, member, downlines, downlineCount: downlines.length, createdAt: item.createdAt, updatedAt: item.updatedAt, resolvedAt: item.resolvedAt }; }
  private async formatLink(item: any) { const metadata = this.linkMetadata(item.metadata); const member = item.memberId ? await this.member(item.memberId) : null; return { id: item.id, referralCode: metadata.referralCode || item.refId, agentMemberId: metadata.agentMemberId, member, commissionEnabled: metadata.commissionEnabled, commissionStatus: metadata.commissionStatus, events: metadata.events, createdAt: item.createdAt, resolvedAt: item.resolvedAt }; }
  private async formatCommission(item: any) { const metadata = this.commissionMetadata(item.metadata); const member = item.memberId ? await this.member(item.memberId) : null; return { id: item.id, agentProfileId: metadata.agentProfileId || item.refId, referralCode: metadata.referralCode, amount: metadata.amount, currency: metadata.currency, basis: metadata.basis, basisAmount: metadata.basisAmount, ratePercent: metadata.ratePercent, capAmount: metadata.capAmount, calculatedAmount: metadata.calculatedAmount, manualOverride: metadata.manualOverride, note: metadata.note, payoutEnabled: metadata.payoutEnabled, payoutStatus: metadata.payoutStatus, status: affiliateStatusLabel(item.status), rawStatus: item.status, adminNote: metadata.adminNote, events: metadata.events, member, createdAt: item.createdAt, updatedAt: item.updatedAt, resolvedAt: item.resolvedAt }; }
  private async member(id: string) { return this.prisma.user.findUnique({ where: { id }, select: { id: true, username: true, phone: true, email: true, status: true } }); }
  private profileMetadata(value: unknown) { const data = value && typeof value === 'object' && !Array.isArray(value) ? value as any : {}; return { referralCode: String(data.referralCode ?? ''), displayName: String(data.displayName ?? ''), commissionRate: Number(data.commissionRate ?? DEFAULT_COMMISSION_RATE_PERCENT), payoutEnabled: data.payoutEnabled === true, payoutStatus: String(data.payoutStatus ?? 'COMMISSION_LEDGER_REVIEW_ONLY'), adminNote: String(data.adminNote ?? ''), events: Array.isArray(data.events) ? data.events : [] }; }
  private linkMetadata(value: unknown) { const data = value && typeof value === 'object' && !Array.isArray(value) ? value as any : {}; return { referralCode: String(data.referralCode ?? ''), agentMemberId: String(data.agentMemberId ?? ''), commissionEnabled: data.commissionEnabled === true, commissionStatus: String(data.commissionStatus ?? 'COMMISSION_LEDGER_REVIEW_ONLY'), events: Array.isArray(data.events) ? data.events : [] }; }
  private commissionMetadata(value: unknown) { const data = value && typeof value === 'object' && !Array.isArray(value) ? value as any : {}; return { agentProfileId: String(data.agentProfileId ?? ''), referralCode: String(data.referralCode ?? ''), amount: Number(data.amount ?? 0), currency: String(data.currency ?? 'THB'), basis: String(data.basis ?? ''), basisAmount: Number(data.basisAmount ?? 0), ratePercent: Number(data.ratePercent ?? 0), capAmount: data.capAmount === null || data.capAmount === undefined ? null : Number(data.capAmount), calculatedAmount: Number(data.calculatedAmount ?? data.amount ?? 0), manualOverride: data.manualOverride === true, note: String(data.note ?? ''), payoutEnabled: data.payoutEnabled === true, payoutStatus: String(data.payoutStatus ?? 'PAYOUT_DISABLED'), adminNote: String(data.adminNote ?? ''), events: Array.isArray(data.events) ? data.events : [] }; }
  private codeFromUserId(userId: string) { return `A${userId.replace(/-/g, '').slice(0, 8)}`; }
  private normalizeCode(value: unknown) { return String(value ?? '').trim().toUpperCase().replace(/[^A-Z0-9_-]+/g, '').slice(0, 24); }
  private cleanText(value: unknown) { return typeof value === 'string' ? value.trim() : ''; }
  private safeJson(value: unknown) { return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue; }
  private audit(adminUserId: string, action: string, targetId: string, oldData: unknown, newData: unknown) { return this.prisma.adminAuditLog.create({ data: buildAdminAuditData({ adminUserId, module: 'affiliates', action, targetId, oldData, newData }) }).catch(() => null); }
}

function affiliateStatusLabel(status: string) { const map: Record<string, string> = { OPEN: 'PENDING', REVIEWING: 'REVIEWING', RESOLVED: 'APPROVED', DISMISSED: 'REJECTED' }; return map[status] ?? status; }
function roundMoney(value: number) { return Math.round((Number(value) + Number.EPSILON) * 100) / 100; }
