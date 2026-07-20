import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { JwtAuthModule } from '../../common/security/jwt-auth.module';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';
import { FinanceSummaryQueryService } from './finance-summary-query.service';
import { FinanceReportsQueryService } from './finance-reports-query.service';

@Module({
  imports: [DatabaseModule, JwtAuthModule],
  controllers: [FinanceController],
  providers: [FinanceService, FinanceSummaryQueryService, FinanceReportsQueryService],
})
export class FinanceModule {}
