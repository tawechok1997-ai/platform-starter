import { Injectable } from '@nestjs/common';
import type { ReportQuery } from './report.mapper';
import { ReportsQueryService } from './reports-query.service';

@Injectable()
export class ReportsService {
  constructor(private readonly queryService: ReportsQueryService) {}

  getDailySummary(query: ReportQuery = {}) {
    return this.queryService.getDailySummary(query);
  }

  getTrends(query: ReportQuery = {}) {
    return this.queryService.getTrends(query);
  }

  getQueueAging() {
    return this.queryService.getQueueAging();
  }

  getReconciliation(query: ReportQuery = {}) {
    return this.queryService.getReconciliation(query);
  }
}
