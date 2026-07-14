import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { FinanceReportsQueryService } from './finance-reports-query.service';
import { FinanceSummaryQueryService } from './finance-summary-query.service';

@UseGuards(AdminAuthGuard, PermissionsGuard)
@Controller('admin/finance')
export class FinanceController {
  constructor(
    private readonly summaryQuery: FinanceSummaryQueryService,
    private readonly reportsQuery: FinanceReportsQueryService,
  ) {}

  @RequirePermission('reports.view')
  @Get('summary')
  getSummary() {
    return this.summaryQuery.execute();
  }

  @RequirePermission('reports.view')
  @Get('reports')
  getReports(@Query('days') days?: string) {
    return this.reportsQuery.execute(days);
  }
}
