import { Injectable, NotFoundException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../../database/prisma.service';

export type WalletLedgerReconciliationResult = {
  userId: string;
  walletId: string;
  currency: string;
  walletBalance: string;
  latestLedgerBalance: string;
  totalCredits: string;
  totalDebits: string;
  netLedgerMovement: string;
  ledgerCount: number;
  difference: string;
  status: 'MATCHED' | 'MISMATCH' | 'NO_LEDGER';
};

@Injectable()
export class WalletLedgerReconciliationService {
  constructor(private readonly prisma: PrismaService) {}

  async reconcileUser(userId: string): Promise<WalletLedgerReconciliationResult> {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
      select: { id: true, userId: true, currency: true, balance: true },
    });
    if (!wallet) throw new NotFoundException('Wallet not found');

    const [credit, debit, latest, ledgerCount] = await Promise.all([
      this.prisma.walletLedger.aggregate({ where: { walletId: wallet.id, direction: 'CREDIT' }, _sum: { amount: true } }),
      this.prisma.walletLedger.aggregate({ where: { walletId: wallet.id, direction: 'DEBIT' }, _sum: { amount: true } }),
      this.prisma.walletLedger.findFirst({ where: { walletId: wallet.id }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], select: { balanceAfter: true } }),
      this.prisma.walletLedger.count({ where: { walletId: wallet.id } }),
    ]);

    const totalCredits = new Decimal(credit._sum.amount ?? 0);
    const totalDebits = new Decimal(debit._sum.amount ?? 0);
    const latestLedgerBalance = latest?.balanceAfter ?? new Decimal(0);
    const difference = wallet.balance.minus(latestLedgerBalance);
    const status = ledgerCount === 0 ? 'NO_LEDGER' : difference.isZero() ? 'MATCHED' : 'MISMATCH';

    return {
      userId: wallet.userId,
      walletId: wallet.id,
      currency: wallet.currency,
      walletBalance: wallet.balance.toString(),
      latestLedgerBalance: latestLedgerBalance.toString(),
      totalCredits: totalCredits.toString(),
      totalDebits: totalDebits.toString(),
      netLedgerMovement: totalCredits.minus(totalDebits).toString(),
      ledgerCount,
      difference: difference.toString(),
      status,
    };
  }
}
