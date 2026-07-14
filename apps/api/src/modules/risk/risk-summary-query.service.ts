import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class RiskSummaryQueryService {
  constructor(private readonly prisma: PrismaService) {}

  async execute() {
    const now = new Date();
    const staleSince = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [wallets, staleTopUps, staleWithdrawals, lockedWallets] = await Promise.all([
      this.prisma.wallet.findMany({
        orderBy: { updatedAt: 'desc' },
        take: 200,
        include: { user: { select: { id: true, username: true, phone: true, email: true, status: true } } },
      }),
      this.prisma.topUpRequest.findMany({
        where: { status: 'PENDING', createdAt: { lt: staleSince } },
        orderBy: { createdAt: 'asc' },
        take: 20,
        include: { user: { select: { id: true, username: true, phone: true, email: true } } },
      }),
      this.prisma.withdrawalRequest.findMany({
        where: { status: 'PENDING', createdAt: { lt: staleSince } },
        orderBy: { createdAt: 'asc' },
        take: 20,
        include: { user: { select: { id: true, username: true, phone: true, email: true } } },
      }),
      this.prisma.wallet.findMany({
        where: { lockedBalance: { gt: 0 } },
        orderBy: { lockedBalance: 'desc' },
        take: 20,
        include: { user: { select: { id: true, username: true, phone: true, email: true } } },
      }),
    ]);

    const checkedWallets = await Promise.all(
      wallets.map(async (wallet) => {
        const latestLedger = await this.prisma.walletLedger.findFirst({
          where: { walletId: wallet.id },
          orderBy: { createdAt: 'desc' },
        });
        const mismatch = latestLedger ? wallet.balance.toString() !== latestLedger.balanceAfter.toString() : false;
        const negativeAvailable = wallet.balance.minus(wallet.lockedBalance).lt(0);
        return { wallet, latestLedger, mismatch, negativeAvailable };
      }),
    );

    const walletMismatch = checkedWallets
      .filter((item) => item.mismatch)
      .slice(0, 20)
      .map((item) => ({
        type: 'WALLET_LEDGER_MISMATCH',
        severity: 'HIGH',
        userId: item.wallet.userId,
        username: item.wallet.user?.username ?? null,
        walletId: item.wallet.id,
        actualBalance: item.wallet.balance.toString(),
        latestLedgerBalance: item.latestLedger?.balanceAfter.toString() ?? '0',
        message: 'Wallet balance does not match latest ledger balance',
      }));

    const negativeAvailable = checkedWallets
      .filter((item) => item.negativeAvailable)
      .slice(0, 20)
      .map((item) => ({
        type: 'NEGATIVE_AVAILABLE_BALANCE',
        severity: 'HIGH',
        userId: item.wallet.userId,
        username: item.wallet.user?.username ?? null,
        walletId: item.wallet.id,
        balance: item.wallet.balance.toString(),
        lockedBalance: item.wallet.lockedBalance.toString(),
        message: 'Locked balance is greater than balance',
      }));

    const staleAlerts = [
      ...staleTopUps.map((item) => ({
        type: 'STALE_TOPUP_PENDING',
        severity: 'MEDIUM',
        targetId: item.id,
        userId: item.userId,
        username: item.user?.username ?? null,
        amount: item.amount.toString(),
        createdAt: item.createdAt,
        message: 'Top-up request pending for more than 24 hours',
      })),
      ...staleWithdrawals.map((item) => ({
        type: 'STALE_WITHDRAWAL_PENDING',
        severity: 'MEDIUM',
        targetId: item.id,
        userId: item.userId,
        username: item.user?.username ?? null,
        amount: item.amount.toString(),
        createdAt: item.createdAt,
        message: 'Withdrawal request pending for more than 24 hours',
      })),
    ];

    const lockedAlerts = lockedWallets.map((wallet) => ({
      type: 'LOCKED_BALANCE_PRESENT',
      severity: 'LOW',
      userId: wallet.userId,
      username: wallet.user?.username ?? null,
      walletId: wallet.id,
      lockedBalance: wallet.lockedBalance.toString(),
      message: 'Wallet has locked balance',
    }));

    const alerts = [...walletMismatch, ...negativeAvailable, ...staleAlerts, ...lockedAlerts];
    return {
      counts: {
        high: alerts.filter((item) => item.severity === 'HIGH').length,
        medium: alerts.filter((item) => item.severity === 'MEDIUM').length,
        low: alerts.filter((item) => item.severity === 'LOW').length,
        total: alerts.length,
      },
      alerts: alerts.slice(0, 80),
      checkedWallets: wallets.length,
      generatedAt: new Date().toISOString(),
    };
  }
}
