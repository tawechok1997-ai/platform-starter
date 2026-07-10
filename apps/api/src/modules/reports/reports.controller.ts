import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { ReportsService } from './reports.service';

@UseGuards(AdminAuthGuard, PermissionsGuard)
@RequirePermission('admin.reports.view')
@Controller('admin/reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('daily')
  getDaily(@Query() query: { from?: string; to?: string }) {
    return this.reportsService.getDailySummary(query);
  }

  @Get('trends')
  getTrends(@Query() query: { days?: string }) {
    return this.reportsService.getTrends(query);
  }

  @Get('queue-aging')
  getQueueAging() {
    return this.reportsService.getQueueAging();
  }

  @Get('reconciliation')
  getReconciliation(@Query() query: { limit?: string }) {
    return this.reportsService.getReconciliation(query);
  }
}
