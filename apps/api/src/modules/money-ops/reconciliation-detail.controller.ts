import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { ReconciliationDetailService } from './reconciliation-detail.service';

@UseGuards(AdminAuthGuard, PermissionsGuard)
@Controller('admin/money-ops/provider-wallet-snapshots')
export class ReconciliationDetailController {
  constructor(private readonly service: ReconciliationDetailService) {}

  @RequirePermission('game.providers.view')
  @Get(':id/investigation')
  getInvestigation(@Param('id') id: string) {
    return this.service.getInvestigation(id);
  }
}
