import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { ReportsQueryService } from './reports-query.service';

@UseGuards(AdminAuthGuard, PermissionsGuard)
@RequirePermission('admin.reports.view')
@Controller('admin/reports')
export class ReportsController {
  constructor(private readonly reportsQuery: ReportsQueryService) {}

  @Get('daily')
  getDaily(@Query() query: { from?: string; to?: string }) {
    return this.reportsQuery.getDailySummary(query);
  }

  @Get('trends')
  getTrends(@Query() query: { days?: string }) {
    return this.reportsQuery.getTrends(query);
  }

  @Get('queue-aging')
  getQueueAging() {
    return this.reportsQuery.getQueueAging();
  }

  @Get('reconciliation')
  getReconciliation(@Query() query: { limit?: string }) {
    return this.reportsQuery.getReconciliation(query);
  }
}
