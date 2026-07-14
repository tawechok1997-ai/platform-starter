import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, RiskAlertStatus } from '@prisma/client';
import { buildAdminAuditData } from '../../common/audit/admin-audit.builder';
import { PrismaService } from '../../database/prisma.service';
import { mapPromotionBonusLedger, promotionBonusMetadata } from './promotion.mapper';
import { PromotionDomainRepository } from './promotion-domain.repository';
import { PromotionSettlementRepository } from './promotion-settlement.repository';

type Actor = { id: string };
type SettlementAction = 'RELEASE' | 'RETRY' | 'REVERSE';

const BONUS_REF_TYPE = 'BONUS_LEDGER';

@Injectable()
export class SettlementCommandService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly domain: PromotionDomainRepository,
    private readonly settlements: PromotionSettlementRepository,
  ) {}

  async execute(admin: Actor, id: string, action: SettlementAction, note = '') {
    const item = await this.prisma.riskAlert.findFirst({ where: { id, refType: BONUS_REF_TYPE } });
    if (!item) throw new NotFoundException('Bonus ledger not found');
    const metadata = promotionBonusMetadata(item.metadata);
    const rawMetadata = item.metadata && typeof item.metadata === 'object' && !Array.isArray(item.metadata)
      ? item.metadata as Record<string, unknown>
      : {};
    const normalizedNote = String(note ?? '').trim();

    if (action === 'RELEASE' && !metadata.turnoverCompleted) {
      throw new BadRequestException('ต้องทำเทิร์นให้ครบก่อน release โบนัส');
    }
    if (action === 'RETRY' && metadata.lifecycleStatus !== 'SETTLEMENT_FAILED') {
      throw new BadRequestException('Only failed settlements can be retried');
    }
    if (action === 'REVERSE' && metadata.lifecycleStatus !== 'SETTLED') {
      throw new BadRequestException('Only settled bonuses can be reversed');
    }
    if (action === 'REVERSE' && !normalizedNote) {
      throw new BadRequestException('note is required for settlement reversal');
    }

    const idempotencyKey = action === 'REVERSE'
      ? `bonus:${id}:settlement:reversal`
      : `bonus:${id}:settlement`;

    try {
      if (action === 'RELEASE') {
        const lifecycle = await this.domain.updateLifecycle(id, 'RELEASE');
        if (!lifecycle) throw new BadRequestException('Bonus lifecycle transition was rejected');
      }

      const settlement = action === 'REVERSE'
        ? await this.settlements.reverse({ sourceRiskAlertId: id, adminUserId: admin.id, idempotencyKey })
        : await this.settlements.settle({ sourceRiskAlertId: id, adminUserId: admin.id, idempotencyKey });

      const lifecycleStatus = action === 'REVERSE' ? 'REVERSED' : 'SETTLED';
      const walletCreditStatus = action === 'REVERSE' ? 'REVERSED' : 'CREDITED';
      const eventAction = action === 'RETRY' ? 'BONUS_SETTLEMENT_RETRIED' : action === 'REVERSE' ? 'BONUS_SETTLEMENT_REVERSED' : 'BONUS_SETTLED';
      const events = [
        ...metadata.events,
        { by: 'admin', adminUserId: admin.id, action: eventAction, message: normalizedNote, createdAt: new Date().toISOString() },
      ];
      const nextStatus: RiskAlertStatus = action === 'REVERSE' ? 'DISMISSED' : 'RESOLVED';

      const updated = await this.prisma.$transaction(async (tx) => {
        const next = await tx.riskAlert.update({
          where: { id },
          data: {
            status: nextStatus,
            resolvedAt: new Date(),
            metadata: this.safeJson({
              ...rawMetadata,
              lifecycleStatus,
              walletCreditEnabled: action !== 'REVERSE',
              walletCreditStatus,
              walletLedgerId: (settlement as any)?.wallet_ledger_id ?? rawMetadata.walletLedgerId ?? null,
              reversalWalletLedgerId: (settlement as any)?.reversal_wallet_ledger_id ?? rawMetadata.reversalWalletLedgerId ?? null,
              settlementIdempotencyKey: idempotencyKey,
              settlementAttemptCount: Number(rawMetadata.settlementAttemptCount ?? 0) + 1,
              settlementLastError: null,
              lifecycleNote: normalizedNote,
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
            action: `bonus.settlement.${action.toLowerCase()}`,
            targetId: id,
            oldData: item,
            newData: { updated: next, settlement },
          }),
        });
        return next;
      });
      return { ok: true, item: mapPromotionBonusLedger(updated), settlement };
    } catch (error) {
      if (action === 'REVERSE') throw error;
      const message = error instanceof Error ? error.message : 'Settlement failed';
      await this.prisma.$transaction(async (tx) => {
        const failedMetadata = {
          ...rawMetadata,
          lifecycleStatus: 'SETTLEMENT_FAILED',
          walletCreditEnabled: false,
          walletCreditStatus: 'FAILED',
          settlementIdempotencyKey: idempotencyKey,
          settlementAttemptCount: Number(rawMetadata.settlementAttemptCount ?? 0) + 1,
          settlementLastError: message,
          events: [
            ...metadata.events,
            { by: 'system', adminUserId: admin.id, action: 'BONUS_SETTLEMENT_FAILED', message, createdAt: new Date().toISOString() },
          ],
        };
        const next = await tx.riskAlert.update({ where: { id }, data: { status: 'REVIEWING', resolvedAt: null, metadata: this.safeJson(failedMetadata) } });
        await tx.adminAuditLog.create({
          data: buildAdminAuditData({
            adminUserId: admin.id,
            module: 'promotions',
            action: 'bonus.settlement.failed',
            targetId: id,
            oldData: item,
            newData: { updated: next, error: message },
          }),
        });
      });
      throw error;
    }
  }

  private safeJson(value: unknown) {
    return JSON.parse(JSON.stringify(value ?? null)) as Prisma.InputJsonValue;
  }
}
