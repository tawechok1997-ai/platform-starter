import { Injectable } from '@nestjs/common';
import { RiskSummaryQueryService } from './risk-summary-query.service';

@Injectable()
export class RiskService {
  constructor(private readonly summaryQuery: RiskSummaryQueryService) {}

  getSummary() {
    return this.summaryQuery.execute();
  }
}
