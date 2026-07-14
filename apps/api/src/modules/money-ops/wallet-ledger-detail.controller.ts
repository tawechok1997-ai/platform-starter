import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { WalletLedgerDetailService } from './wallet-ledger-detail.service';

@UseGuards(AdminAuthGuard, PermissionsGuard)
@Controller('admin/money-ops/ledger')
export class WalletLedgerDetailController {
  constructor(private readonly ledgerDetails: WalletLedgerDetailService) {}

  @RequirePermission('game.providers.view')
  @Get(':id')
  detail(@Param('id') id: string) {
    return this.ledgerDetails.detail(id);
  }
}
