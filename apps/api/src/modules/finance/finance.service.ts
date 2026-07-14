import { Injectable } from '@nestjs/common';
import { FinanceReportsQueryService } from './finance-reports-query.service';
import { FinanceSummaryQueryService } from './finance-summary-query.service';

@Injectable()
export class FinanceService {
  constructor(
    private readonly summaryQuery: FinanceSummaryQueryService,
    private readonly reportsQuery: FinanceReportsQueryService,
  ) {}

  getSummary() {
    return this.summaryQuery.execute();
  }

  getReports(daysInput?: string | number) {
    return this.reportsQuery.execute(daysInput);
  }
}
