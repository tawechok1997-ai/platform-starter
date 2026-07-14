import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { PromotionDomainRepository } from './promotion-domain.repository';

@Injectable()
export class PromotionSettlementRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly domain: PromotionDomainRepository,
  ) {}

  settle(input: { sourceRiskAlertId: string; adminUserId: string; idempotencyKey: string }) {
    return this.domain.settleBonus(input);
  }

  async reverse(input: { sourceRiskAlertId: string; adminUserId: string; idempotencyKey: string }) {
    return this.prisma.$transaction(async (tx) => {
      const bonusRows = await tx.$queryRaw<Array<any>>(Prisma.sql`
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

      const originalRows = await tx.$queryRaw<Array<any>>(Prisma.sql`
        SELECT * FROM "wallet_ledgers" WHERE "id" = ${bonus.wallet_ledger_id}::uuid LIMIT 1
      `);
      const original = originalRows[0];
      if (!original) throw new BadRequestException('Settlement wallet ledger not found');

      const existingRows = await tx.$queryRaw<Array<any>>(Prisma.sql`
        SELECT * FROM "wallet_ledgers" WHERE "idempotency_key" = ${input.idempotencyKey} LIMIT 1
      `);
      if (existingRows[0]) {
        await tx.$executeRaw(Prisma.sql`
          UPDATE "bonus_ledgers"
          SET "status" = 'REVOKED', "updated_at" = CURRENT_TIMESTAMP
          WHERE "id" = ${bonus.id}::uuid
        `);
        return { ...bonus, status: 'REVOKED', reversal_wallet_ledger_id: existingRows[0].id, reversed: true, duplicate: true };
      }

      const walletRows = await tx.$queryRaw<Array<any>>(Prisma.sql`
        SELECT * FROM "wallets" WHERE "id" = ${original.wallet_id}::uuid FOR UPDATE
      `);
      const wallet = walletRows[0];
      if (!wallet || wallet.status !== 'ACTIVE') throw new BadRequestException('Active wallet not found');

      const amount = new Prisma.Decimal(original.amount);
      const before = new Prisma.Decimal(wallet.balance);
      const after = before.sub(amount);
      if (after.isNegative()) throw new BadRequestException('Wallet balance is insufficient for settlement reversal');

      const ledgerRows = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`SELECT gen_random_uuid()::text AS id`);
      const ledgerId = ledgerRows[0].id;
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
      const reversedRows = await tx.$queryRaw<Array<Record<string, unknown>>>(Prisma.sql`
        UPDATE "bonus_ledgers"
        SET "status" = 'REVOKED', "updated_at" = CURRENT_TIMESTAMP
        WHERE "id" = ${bonus.id}::uuid
        RETURNING *
      `);
      return { ...reversedRows[0], reversal_wallet_ledger_id: ledgerId, reversed: true, duplicate: false };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }
}
