import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, RiskAlertStatus } from '@prisma/client';
import { buildAdminAuditData } from '../../common/audit/admin-audit.builder';
import { PrismaService } from '../../database/prisma.service';
import { mapPromotionBonusLedger, promotionBonusMetadata } from './promotion.mapper';

type Actor = { id: string };
type SettlementAction = 'RELEASE' | 'RETRY' | 'REVERSE';
type TransactionClient = Prisma.TransactionClient;
type SettlementLedgerMetadata = {
  wallet_ledger_id?: unknown;
  reversal_wallet_ledger_id?: unknown;
};

const BONUS_REF_TYPE = 'BONUS_LEDGER';

@Injectable()
export class SettlementCommandService {
  constructor(private readonly prisma: PrismaService) {}

  async execute(admin: Actor, id: string, action: SettlementAction, note = '') {
    const initial = await this.prisma.riskAlert.findFirst({ where: { id, refType: BONUS_REF_TYPE } });
    if (!initial) throw new NotFoundException('Bonus ledger not found');
    this.assertActionAllowed(initial.metadata, action, note);

    const normalizedNote = String(note ?? '').trim();
    const idempotencyKey = action === 'REVERSE'
      ? `bonus:${id}:settlement:reversal`
      : `bonus:${id}:settlement`;
    let settlementStarted = false;

    try {
      return await this.prisma.$transaction(async (tx) => {
        const lockedRows = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
          SELECT "id" FROM "risk_alerts"
          WHERE "id" = ${id}::uuid AND "ref_type" = ${BONUS_REF_TYPE}
          FOR UPDATE
        `);
        if (!lockedRows[0]) throw new NotFoundException('Bonus ledger not found');

        const item = await tx.riskAlert.findFirst({ where: { id, refType: BONUS_REF_TYPE } });
        if (!item) throw new NotFoundException('Bonus ledger not found');
        this.assertActionAllowed(item.metadata, action, normalizedNote);

        const metadata = promotionBonusMetadata(item.metadata);
        const rawMetadata = this.rawMetadata(item.metadata);

        if (action === 'RELEASE') {
          const lifecycleRows = await tx.$queryRaw<Array<Record<string, unknown>>>(Prisma.sql`
            UPDATE "bonus_ledgers"
            SET "status" = 'RELEASE_READY', "updated_at" = CURRENT_TIMESTAMP
            WHERE "source_risk_alert_id" = ${id}::uuid
              AND "status" NOT IN ('SETTLED', 'EXPIRED', 'REVOKED')
              AND "turnover_progress" >= "turnover_required"
            RETURNING *
          `);
          if (!lifecycleRows[0]) throw new BadRequestException('Bonus lifecycle transition was rejected');
        }

        settlementStarted = true;
        const settlement = action === 'REVERSE'
          ? await this.reverseInTransaction(tx, { sourceRiskAlertId: id, adminUserId: admin.id, idempotencyKey })
          : await this.settleInTransaction(tx, { sourceRiskAlertId: id, adminUserId: admin.id, idempotencyKey });
        const settlementLedgerMetadata = settlement as SettlementLedgerMetadata;

        const lifecycleStatus = action === 'REVERSE' ? 'REVERSED' : 'SETTLED';
        const walletCreditStatus = action === 'REVERSE' ? 'REVERSED' : 'CREDITED';
        const eventAction = action === 'RETRY'
          ? 'BONUS_SETTLEMENT_RETRIED'
          : action === 'REVERSE'
            ? 'BONUS_SETTLEMENT_REVERSED'
            : 'BONUS_SETTLED';
        const events = [
          ...metadata.events,
          {
            by: 'admin',
            adminUserId: admin.id,
            action: eventAction,
            message: normalizedNote,
            createdAt: new Date().toISOString(),
          },
        ];
        const nextStatus: RiskAlertStatus = action === 'REVERSE' ? 'DISMISSED' : 'RESOLVED';
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
              walletLedgerId: settlementLedgerMetadata.wallet_ledger_id ?? rawMetadata.walletLedgerId ?? null,
              reversalWalletLedgerId: settlementLedgerMetadata.reversal_wallet_ledger_id ?? rawMetadata.reversalWalletLedgerId ?? null,
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

        return { ok: true, item: mapPromotionBonusLedger(next), settlement };
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      if (action === 'REVERSE' || !settlementStarted) throw error;
      await this.recordSettlementFailure(admin, id, idempotencyKey, error);
      throw error;
    }
  }

  private async settleInTransaction(
    tx: TransactionClient,
    input: { sourceRiskAlertId: string; adminUserId: string; idempotencyKey: string },
  ) {
    const bonusRows = await tx.$queryRaw<Array<Record<string, any>>>(Prisma.sql`
      SELECT * FROM "bonus_ledgers"
      WHERE "source_risk_alert_id" = ${input.sourceRiskAlertId}::uuid
      FOR UPDATE
    `);
    const bonus = bonusRows[0];
    if (!bonus) throw new NotFoundException('Bonus ledger not found');
    if (bonus.status === 'SETTLED') return bonus;
    if (!['TURNOVER_COMPLETED', 'RELEASE_READY'].includes(bonus.status)) {
      throw new BadRequestException('Bonus is not ready for settlement');
    }

    const walletRows = await tx.$queryRaw<Array<Record<string, any>>>(Prisma.sql`
      SELECT * FROM "wallets" WHERE "user_id" = ${bonus.member_id}::uuid FOR UPDATE
    `);
    const wallet = walletRows[0];
    if (!wallet || wallet.status !== 'ACTIVE') throw new BadRequestException('Active wallet not found');

    const existingRows = await tx.$queryRaw<Array<Record<string, any>>>(Prisma.sql`
      SELECT * FROM "wallet_ledgers" WHERE "idempotency_key" = ${input.idempotencyKey} LIMIT 1
    `);
    if (existingRows[0]) {
      const settledRows = await tx.$queryRaw<Array<Record<string, any>>>(Prisma.sql`
        UPDATE "bonus_ledgers"
        SET "status" = 'SETTLED', "wallet_ledger_id" = ${existingRows[0].id}::uuid,
            "settlement_idempotency_key" = ${input.idempotencyKey},
            "released_by_admin_id" = ${input.adminUserId}::uuid,
            "released_at" = COALESCE("released_at", CURRENT_TIMESTAMP), "updated_at" = CURRENT_TIMESTAMP
        WHERE "id" = ${bonus.id}::uuid
        RETURNING *
      `);
      return { ...settledRows[0], duplicate: true };
    }

    const ledgerIdRows = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`SELECT gen_random_uuid()::text AS id`);
    const ledgerId = ledgerIdRows[0].id;
    const before = new Prisma.Decimal(wallet.balance);
    const amount = new Prisma.Decimal(bonus.amount);
    const after = before.add(amount);

    await tx.$executeRaw(Prisma.sql`
      UPDATE "wallets" SET "balance" = ${after}::numeric, "updated_at" = CURRENT_TIMESTAMP
      WHERE "id" = ${wallet.id}::uuid
    `);
    await tx.$executeRaw(Prisma.sql`
      INSERT INTO "wallet_ledgers" (
        "id", "wallet_id", "user_id", "type", "direction", "amount",
        "balance_before", "balance_after", "reference_type", "reference_id",
        "idempotency_key", "created_by_admin_id", "created_at"
      ) VALUES (
        ${ledgerId}::uuid, ${wallet.id}::uuid, ${bonus.member_id}::uuid, 'BONUS', 'CREDIT',
        ${amount}::numeric, ${before}::numeric, ${after}::numeric, 'BONUS_LEDGER', ${bonus.id}::text,
        ${input.idempotencyKey}, ${input.adminUserId}::uuid, CURRENT_TIMESTAMP
      )
    `);
    const settledRows = await tx.$queryRaw<Array<Record<string, any>>>(Prisma.sql`
      UPDATE "bonus_ledgers"
      SET "status" = 'SETTLED', "wallet_ledger_id" = ${ledgerId}::uuid,
          "settlement_idempotency_key" = ${input.idempotencyKey},
          "released_by_admin_id" = ${input.adminUserId}::uuid,
          "released_at" = CURRENT_TIMESTAMP, "updated_at" = CURRENT_TIMESTAMP
      WHERE "id" = ${bonus.id}::uuid
      RETURNING *
    `);
    return { ...settledRows[0], duplicate: false };
  }

  private async reverseInTransaction(
    tx: TransactionClient,
    input: { sourceRiskAlertId: string; adminUserId: string; idempotencyKey: string },
  ) {
    const bonusRows = await tx.$queryRaw<Array<Record<string, any>>>(Prisma.sql`
      SELECT * FROM "bonus_ledgers"
      WHERE "source_risk_alert_id" = ${input.sourceRiskAlertId}::uuid
      FOR UPDATE
    `);
    const bonus = bonusRows[0];
    if (!bonus) throw new NotFoundException('Bonus ledger not found');
    if (bonus.status === 'REVOKED') return { ...bonus, reversed: true, duplicate: true };
    if (bonus.status !== 'SETTLED' || !bonus.wallet_ledger_id) {
      throw new BadRequestException('Only settled bonuses can be reversed');
    }

    const originalRows = await tx.$queryRaw<Array<Record<string, any>>>(Prisma.sql`
      SELECT * FROM "wallet_ledgers" WHERE "id" = ${bonus.wallet_ledger_id}::uuid LIMIT 1
    `);
    const original = originalRows[0];
    if (!original) throw new BadRequestException('Settlement wallet ledger not found');

    const existingRows = await tx.$queryRaw<Array<Record<string, any>>>(Prisma.sql`
      SELECT * FROM "wallet_ledgers" WHERE "idempotency_key" = ${input.idempotencyKey} LIMIT 1
    `);
    if (existingRows[0]) {
      const reversedRows = await tx.$queryRaw<Array<Record<string, any>>>(Prisma.sql`
        UPDATE "bonus_ledgers"
        SET "status" = 'REVOKED', "updated_at" = CURRENT_TIMESTAMP
        WHERE "id" = ${bonus.id}::uuid
        RETURNING *
      `);
      return {
        ...reversedRows[0],
        reversal_wallet_ledger_id: existingRows[0].id,
        reversed: true,
        duplicate: true,
      };
    }

    const walletRows = await tx.$queryRaw<Array<Record<string, any>>>(Prisma.sql`
      SELECT * FROM "wallets" WHERE "id" = ${original.wallet_id}::uuid FOR UPDATE
    `);
    const wallet = walletRows[0];
    if (!wallet || wallet.status !== 'ACTIVE') throw new BadRequestException('Active wallet not found');

    const amount = new Prisma.Decimal(original.amount);
    const before = new Prisma.Decimal(wallet.balance);
    const after = before.sub(amount);
    if (after.isNegative()) throw new BadRequestException('Wallet balance is insufficient for settlement reversal');

    const ledgerIdRows = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`SELECT gen_random_uuid()::text AS id`);
    const ledgerId = ledgerIdRows[0].id;
    await tx.$executeRaw(Prisma.sql`
      UPDATE "wallets" SET "balance" = ${after}::numeric, "updated_at" = CURRENT_TIMESTAMP
      WHERE "id" = ${wallet.id}::uuid
    `);
    await tx.$executeRaw(Prisma.sql`
      INSERT INTO "wallet_ledgers" (
        "id", "wallet_id", "user_id", "type", "direction", "amount",
        "balance_before", "balance_after", "reference_type", "reference_id",
        "idempotency_key", "created_by_admin_id", "created_at"
      ) VALUES (
        ${ledgerId}::uuid, ${wallet.id}::uuid, ${bonus.member_id}::uuid, 'REVERSAL', 'DEBIT',
        ${amount}::numeric, ${before}::numeric, ${after}::numeric, 'BONUS_SETTLEMENT_REVERSAL', ${bonus.id}::text,
        ${input.idempotencyKey}, ${input.adminUserId}::uuid, CURRENT_TIMESTAMP
      )
    `);
    const reversedRows = await tx.$queryRaw<Array<Record<string, any>>>(Prisma.sql`
      UPDATE "bonus_ledgers"
      SET "status" = 'REVOKED', "updated_at" = CURRENT_TIMESTAMP
      WHERE "id" = ${bonus.id}::uuid
      RETURNING *
    `);
    return {
      ...reversedRows[0],
      reversal_wallet_ledger_id: ledgerId,
      reversed: true,
      duplicate: false,
    };
  }

  private async recordSettlementFailure(
    admin: Actor,
    id: string,
    idempotencyKey: string,
    error: unknown,
  ) {
    const message = error instanceof Error ? error.message : 'Settlement failed';
    await this.prisma.$transaction(async (tx) => {
      const lockedRows = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
        SELECT "id" FROM "risk_alerts" WHERE "id" = ${id}::uuid FOR UPDATE
      `);
      if (!lockedRows[0]) return;
      const item = await tx.riskAlert.findUnique({ where: { id } });
      if (!item) return;
      const metadata = promotionBonusMetadata(item.metadata);
      const rawMetadata = this.rawMetadata(item.metadata);
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
          {
            by: 'system',
            adminUserId: admin.id,
            action: 'BONUS_SETTLEMENT_FAILED',
            message,
            createdAt: new Date().toISOString(),
          },
        ],
      };
      const next = await tx.riskAlert.update({
        where: { id },
        data: { status: 'REVIEWING', resolvedAt: null, metadata: this.safeJson(failedMetadata) },
      });
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
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  private assertActionAllowed(metadataInput: unknown, action: SettlementAction, note: string) {
    const metadata = promotionBonusMetadata(metadataInput);
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
  }

  private rawMetadata(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object' && !Array.isArray(value)
      ? value as Record<string, unknown>
      : {};
  }

  private safeJson(value: unknown) {
    return JSON.parse(JSON.stringify(value ?? null)) as Prisma.InputJsonValue;
  }
}
