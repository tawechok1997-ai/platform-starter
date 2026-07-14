import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, RiskAlertStatus } from '@prisma/client';
import { buildAdminAuditData } from '../../common/audit/admin-audit.builder';
import { PrismaService } from '../../database/prisma.service';
import { mapPromotionBonusLedger, promotionBonusMetadata } from './promotion.mapper';
import { PromotionDomainRepository } from './promotion-domain.repository';
import { SettlementCommandService } from './settlement-command.service';

type Actor = { id: string };
type TurnoverInput = { amount?: number | string; note?: string };
type BonusLifecycleInput = { action?: 'RELEASE' | 'RETRY' | 'REVERSE' | 'EXPIRE' | 'REVOKE'; note?: string };

const BONUS_REF_TYPE = 'BONUS_LEDGER';

@Injectable()
export class BonusLifecycleCommandService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly domain: PromotionDomainRepository,
    private readonly settlementCommands: SettlementCommandService,
  ) {}

  async addTurnoverProgress(admin: Actor, id: string, input: TurnoverInput) {
    const item = await this.prisma.riskAlert.findFirst({ where: { id, refType: BONUS_REF_TYPE } });
    if (!item) throw new NotFoundException('Bonus ledger not found');

    const amount = Number(input.amount ?? 0);
    if (!Number.isFinite(amount) || amount <= 0) throw new BadRequestException('amount must be positive');
    const metadata = promotionBonusMetadata(item.metadata);
    if (['REVOKED', 'EXPIRED', 'REVERSED'].includes(metadata.lifecycleStatus)) {
      throw new BadRequestException('Cannot update turnover for inactive bonus');
    }

    const domainLedger = await this.domain.addTurnover(id, amount);
    if (!domainLedger) throw new BadRequestException('Bonus domain ledger is not active');
    const turnoverProgress = Number(domainLedger.turnover_progress ?? 0);
    const turnoverRequired = Number(domainLedger.turnover_required ?? 0);
    const completed = String(domainLedger.status) === 'TURNOVER_COMPLETED';
    const lifecycleStatus = completed ? 'TURNOVER_COMPLETED' : metadata.lifecycleStatus;
    const walletCreditStatus = completed ? 'READY_FOR_MANUAL_RELEASE' : metadata.walletCreditStatus;
    const events = [
      ...metadata.events,
      { by: 'admin', adminUserId: admin.id, action: 'TURNOVER_PROGRESS', amount, message: input.note ?? '', createdAt: new Date().toISOString() },
    ];

    const updated = await this.prisma.$transaction(async (tx) => {
      const next = await tx.riskAlert.update({
        where: { id },
        data: {
          status: completed ? 'RESOLVED' : item.status,
          resolvedAt: completed ? new Date() : item.resolvedAt,
          metadata: this.safeJson({
            ...metadata,
            turnoverProgress,
            turnoverRequired,
            turnoverCompleted: completed,
            lifecycleStatus,
            walletCreditEnabled: false,
            walletCreditStatus,
            events,
          }),
        },
      });
      await tx.adminAuditLog.create({
        data: buildAdminAuditData({
          adminUserId: admin.id,
          module: 'promotions',
          action: 'bonus.turnover.progress',
          targetId: id,
          oldData: item,
          newData: next,
        }),
      });
      return next;
    });

    return { ok: true, item: mapPromotionBonusLedger(updated) };
  }

  async updateBonusLifecycle(admin: Actor, id: string, input: BonusLifecycleInput) {
    const action = String(input.action ?? '').toUpperCase() as BonusLifecycleInput['action'];
    if (!['RELEASE', 'RETRY', 'REVERSE', 'EXPIRE', 'REVOKE'].includes(action ?? '')) {
      throw new BadRequestException('action must be RELEASE, RETRY, REVERSE, EXPIRE, or REVOKE');
    }
    if (action === 'RELEASE' || action === 'RETRY' || action === 'REVERSE') {
      return this.settlementCommands.execute(admin, id, action, input.note);
    }

    const item = await this.prisma.riskAlert.findFirst({ where: { id, refType: BONUS_REF_TYPE } });
    if (!item) throw new NotFoundException('Bonus ledger not found');
    const metadata = promotionBonusMetadata(item.metadata);
    const note = typeof input.note === 'string' ? input.note.trim() : '';
    if (!note) throw new BadRequestException('note is required for expire or revoke');
    if (['REVOKED', 'EXPIRED', 'SETTLED', 'REVERSED'].includes(metadata.lifecycleStatus)) {
      throw new BadRequestException(`Bonus is already ${metadata.lifecycleStatus.toLowerCase()}`);
    }

    const domainLifecycle = await this.domain.updateLifecycle(id, action);
    if (!domainLifecycle) throw new BadRequestException('Bonus lifecycle transition was rejected');
    const lifecycleStatus = action === 'EXPIRE' ? 'EXPIRED' : 'REVOKED';
    const walletCreditStatus = action === 'EXPIRE' ? 'EXPIRED_NO_WALLET_CREDIT' : 'REVOKED_NO_WALLET_CREDIT';
    const nextStatus: RiskAlertStatus = 'DISMISSED';
    const events = [
      ...metadata.events,
      { by: 'admin', adminUserId: admin.id, action: `BONUS_${action}`, message: note, createdAt: new Date().toISOString() },
    ];

    const updated = await this.prisma.$transaction(async (tx) => {
      const next = await tx.riskAlert.update({
        where: { id },
        data: {
          status: nextStatus,
          resolvedAt: new Date(),
          metadata: this.safeJson({
            ...metadata,
            lifecycleStatus,
            walletCreditEnabled: false,
            walletCreditStatus,
            lifecycleNote: note,
            lifecycleUpdatedAt: new Date().toISOString(),
            lifecycleUpdatedBy: admin.id,
            events,
          }),
        },
      });
      await tx.adminAuditLog.create({
        data: buildAdminAuditData({
          adminUserId: admin.id,
          module: 'promotions',
          action: `bonus.lifecycle.${String(action).toLowerCase()}`,
          targetId: id,
          oldData: item,
          newData: next,
        }),
      });
      return next;
    });

    return { ok: true, item: mapPromotionBonusLedger(updated) };
  }

  private safeJson(value: unknown) {
    return JSON.parse(JSON.stringify(value ?? null)) as Prisma.InputJsonValue;
  }
}
