import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { RequireAnyPermission } from '../../common/decorators/require-any-permission.decorator';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import type { ReportQuery } from './report.mapper';
import { ReportsQueryService } from './reports-query.service';

@UseGuards(AdminAuthGuard, PermissionsGuard)
@Controller('admin/dashboard')
export class AdminDashboardReportsController {
  constructor(private readonly reportsQuery: ReportsQueryService) {}

  @RequireAnyPermission(
    'reports.view',
    'admin.reports.view',
    'wallet.view',
    'topups.view',
    'deposit.view',
    'withdraw.view',
  )
  @Get('finance-trends')
  getFinanceTrends(@Query() query: ReportQuery) {
    return this.reportsQuery.getTrends(query);
  }
}
