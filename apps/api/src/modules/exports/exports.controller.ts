import { Controller, Get, Header, Query, UseGuards } from '@nestjs/common';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { ExportsService } from './exports.service';

@UseGuards(AdminAuthGuard, PermissionsGuard)
@RequirePermission('admin.reports.view')
@Controller('admin/exports')
export class ExportsController {
  constructor(private readonly exportsService: ExportsService) {}

  @Get('topups.csv')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  topUps(@Query() query: ExportQuery) {
    return this.exportsService.exportTopUps(query);
  }

  @Get('withdrawals.csv')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  withdrawals(@Query() query: ExportQuery) {
    return this.exportsService.exportWithdrawals(query);
  }

  @Get('ledgers.csv')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  ledgers(@Query() query: ExportQuery) {
    return this.exportsService.exportLedgers(query);
  }

  @Get('report-trends.csv')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  reportTrends(@Query() query: ExportQuery) {
    return this.exportsService.exportReportTrends(query);
  }

  @Get('reconciliation.csv')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  reconciliation(@Query() query: ExportQuery) {
    return this.exportsService.exportReconciliation(query);
  }
}

type ExportQuery = { status?: string; from?: string; to?: string; limit?: string; days?: string };
