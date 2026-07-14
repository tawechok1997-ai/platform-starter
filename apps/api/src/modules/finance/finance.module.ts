import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '../../database/database.module';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';
import { FinanceSummaryQueryService } from './finance-summary-query.service';
import { FinanceReportsQueryService } from './finance-reports-query.service';
import { QueuesModule } from '../queues/queues.module';
import { ActivityModule } from '../activity/activity.module';
import { RiskModule } from '../risk/risk.module';
import { AdminMembersModule } from '../admin-members/admin-members.module';

@Module({
  imports: [
    DatabaseModule,
    JwtModule.register({}),
    QueuesModule,
    ActivityModule,
    RiskModule,
    AdminMembersModule,
  ],
  controllers: [FinanceController],
  providers: [FinanceService, FinanceSummaryQueryService, FinanceReportsQueryService],
})
export class FinanceModule {}
