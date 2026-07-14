import { Controller, Get, UseGuards } from '@nestjs/common';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RiskSummaryQueryService } from './risk-summary-query.service';

@UseGuards(AdminAuthGuard, PermissionsGuard)
@Controller('admin/risk')
export class RiskController {
  constructor(private readonly summaryQuery: RiskSummaryQueryService) {}

  @RequirePermission('risk.view')
  @Get('summary')
  getSummary() {
    return this.summaryQuery.execute();
  }
}
