import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { GameSessionLifecycleService } from './game-session-lifecycle.service';
import { WalletLedgerReconciliationService } from './wallet-ledger-reconciliation.service';

@UseGuards(AdminAuthGuard, PermissionsGuard)
@Controller('admin/game-finance-diagnostics')
export class WalletLedgerReconciliationController {
  constructor(
    private readonly reconciliation: WalletLedgerReconciliationService,
    private readonly sessions: GameSessionLifecycleService,
  ) {}

  @RequirePermission('game.providers.view')
  @Get('wallets/:userId/reconcile')
  reconcileWallet(@Param('userId') userId: string) {
    return this.reconciliation.reconcileUser(userId);
  }

  @RequirePermission('game.providers.manage')
  @Post('sessions/expire-stale')
  expireStaleSessions() {
    return this.sessions.expireStale();
  }
}
