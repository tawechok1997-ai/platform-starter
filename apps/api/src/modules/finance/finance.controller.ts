import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { FinanceService } from './finance.service';

@UseGuards(AdminAuthGuard)
@Controller('admin/finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('summary')
  getSummary() {
    return this.financeService.getSummary();
  }

  @Get('reports')
  getReports(@Query('days') days?: string) {
    return this.financeService.getReports(days);
  }
}
