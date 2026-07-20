import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { Prisma, WalletLedgerDirection } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { buildAdminAuditData } from '../../common/audit/admin-audit.builder';
import type { AdminActor } from '../../common/actors';
import { PrismaService } from '../../database/prisma.service';

export type AdminLedgerMutationInput = {
  userId: string;
  amount: string | number | Decimal;
  direction: WalletLedgerDirection;
  referenceType: string;
  referenceId: string | null;
  idempotencyKey: string;
  note: string | null;
};

type RequestMeta = { ipAddress?: string; userAgent?: string };

@Injectable()
export class AdminLedgerMutationService {
  constructor(private readonly prisma: PrismaService) {}

  async execute(actor: AdminActor, meta: RequestMeta, input: AdminLedgerMutationInput) {
    const amount = new Decimal(input.amount);

    const item = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.walletLedger.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
      if (existing) throw new ConflictException('Idempotency key was already used');

      const wallet = await tx.wallet.findUnique({ where: { userId: input.userId } });
      if (!wallet) throw new BadRequestException('Wallet not found');
      if (wallet.status !== 'ACTIVE') throw new BadRequestException('Wallet is not active');

      const balanceBefore = wallet.balance;
      const balanceAfter = input.direction === 'CREDIT' ? balanceBefore.plus(amount) : balanceBefore.minus(amount);
      if (balanceAfter.lt(0)) throw new BadRequestException('Insufficient balance');
      if (input.direction === 'DEBIT' && balanceAfter.lt(wallet.lockedBalance)) {
        throw new BadRequestException('Insufficient available wallet balance');
      }

      const updatedWallet = await tx.wallet.update({ where: { id: wallet.id }, data: { balance: balanceAfter } });
      const ledger = await tx.walletLedger.create({
        data: {
          walletId: wallet.id,
          userId: input.userId,
          type: 'ADJUSTMENT',
          direction: input.direction,
          amount,
          balanceBefore,
          balanceAfter,
          referenceType: input.referenceType,
          referenceId: input.referenceId,
          idempotencyKey: input.idempotencyKey,
          metadata: {
            note: input.note,
            featureFlag: 'REAL_LEDGER_MUTATION_ENABLED',
            updatedWalletId: updatedWallet.id,
          },
          createdByAdminId: actor.id,
        },
      });

      await tx.adminAuditLog.create({
        data: buildAdminAuditData({
          adminUserId: actor.id,
          action: 'ledger.mutate',
          module: 'money_ops',
          targetId: ledger.id,
          newData: ledger,
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
        }),
      });

      return ledger;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    return item;
  }
}
