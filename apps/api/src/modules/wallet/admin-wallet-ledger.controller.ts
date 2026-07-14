import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { AdminWalletLedgerQueryService } from './admin-wallet-ledger-query.service';

@UseGuards(AdminAuthGuard, PermissionsGuard)
@Controller('admin/wallet-ledgers')
export class AdminWalletLedgerController {
  constructor(private readonly ledgerQueries: AdminWalletLedgerQueryService) {}

  @RequirePermission('wallet.view')
  @Get(':id')
  getLedger(@Param('id') id: string) {
    return this.ledgerQueries.getLedger(id);
  }
}
