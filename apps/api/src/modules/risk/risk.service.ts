import { Injectable } from '@nestjs/common';
import { FinanceRiskSummaryQueryService } from '../risk-alerts/finance-risk-summary-query.service';

@Injectable()
export class RiskService {
  constructor(private readonly summaryQuery: FinanceRiskSummaryQueryService) {}

  getSummary() {
    return this.summaryQuery.execute();
  }
}
