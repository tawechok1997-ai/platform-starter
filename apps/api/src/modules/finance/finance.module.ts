import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '../../database/database.module';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';
import { QueuesController } from '../queues/queues.controller';
import { QueuesService } from '../queues/queues.service';
import { OperationsController } from '../activity/operations.controller';
import { ActivityService } from '../activity/activity.service';
import { RiskController } from '../risk/risk.controller';
import { RiskService } from '../risk/risk.service';
import { AdminMembersController } from '../admin-members/admin-members.controller';
import { AdminMembersService } from '../admin-members/admin-members.service';

@Module({
  imports: [DatabaseModule, JwtModule.register({})],
  controllers: [FinanceController, QueuesController, OperationsController, RiskController, AdminMembersController],
  providers: [FinanceService, QueuesService, ActivityService, RiskService, AdminMembersService],
})
export class FinanceModule {}
