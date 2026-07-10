import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { FinanceService } from './finance.service';

@UseGuards(AdminAuthGuard, PermissionsGuard)
@Controller('admin/finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @RequirePermission('reports.view')
  @Get('summary')
  getSummary() {
    return this.financeService.getSummary();
  }

  @RequirePermission('reports.view')
  @Get('reports')
  getReports(@Query('days') days?: string) {
    return this.financeService.getReports(days);
  }
}
