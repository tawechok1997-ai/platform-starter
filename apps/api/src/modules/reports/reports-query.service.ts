import { Injectable } from '@nestjs/common';
import { AdminDashboardReadModel } from './admin-dashboard-read.model';
import { AdminReportReadModel } from './admin-report-read.model';
import type { ReportQuery } from './report.mapper';

@Injectable()
export class ReportsQueryService {
  constructor(
    private readonly dashboardReadModel: AdminDashboardReadModel,
    private readonly reportReadModel: AdminReportReadModel,
  ) {}

  getDailySummary(query: ReportQuery = {}) {
    return this.dashboardReadModel.load(query);
  }

  getTrends(query: ReportQuery = {}) {
    return this.reportReadModel.loadTrends(query);
  }

  getQueueAging() {
    return this.reportReadModel.loadQueueAging();
  }

  getReconciliation(query: ReportQuery = {}) {
    return this.reportReadModel.loadReconciliation(query);
  }
}
