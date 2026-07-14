import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

export type WalletMutationInput = {
  userId: string;
  type: 'TRANSFER' | 'REVERSAL';
  direction: 'CREDIT' | 'DEBIT';
  amount: number;
  referenceType: string;
  referenceId: string;
  idempotencyKey: string;
  metadata: Record<string, unknown>;
};

@Injectable()
export class WalletMutationService {
  constructor(private readonly prisma: PrismaService) {}

  async apply(input: WalletMutationInput) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.walletLedger.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
      if (existing) {
        const wallet = await tx.wallet.findUnique({ where: { id: existing.walletId } });
        if (!wallet) throw new BadRequestException('Wallet not found for existing ledger');
        return { ledger: existing, wallet, idempotent: true };
      }

      const wallet = await tx.wallet.findUnique({ where: { userId: input.userId } });
      if (!wallet) throw new BadRequestException('Wallet not found');
      if (wallet.status !== 'ACTIVE') throw new BadRequestException('Wallet is not active');

      const balanceBefore = Number(wallet.balance);
      const balanceAfter = input.direction === 'CREDIT' ? balanceBefore + input.amount : balanceBefore - input.amount;
      if (balanceAfter < 0) throw new BadRequestException('ยอดคงเหลือไม่พอสำหรับโยกเงินเข้าเกม');

      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: balanceAfter.toFixed(2) },
      });
      const ledger = await tx.walletLedger.create({
        data: {
          walletId: wallet.id,
          userId: input.userId,
          type: input.type,
          direction: input.direction,
          amount: input.amount.toFixed(2),
          balanceBefore: balanceBefore.toFixed(2),
          balanceAfter: balanceAfter.toFixed(2),
          referenceType: input.referenceType,
          referenceId: input.referenceId,
          idempotencyKey: input.idempotencyKey,
          metadata: this.safeJson(input.metadata),
        },
      });
      return { ledger, wallet: updatedWallet, idempotent: false };
    });
  }

  private safeJson(value: unknown) {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  }
}
