import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '../../database/database.module';
import { RiskAlertsModule } from '../risk-alerts/risk-alerts.module';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { BatchWithdrawalWorkflowService } from './batch-withdrawal-workflow.service';
import { StorageModule } from '../storage/storage.module';
import { WithdrawalRiskEnforcementService } from './withdrawal-risk-enforcement.service';
import { WithdrawalWorkflowController } from './withdrawal-workflow.controller';
import { WithdrawalWorkflowService } from './withdrawal-workflow.service';
import { WithdrawalsController } from './withdrawals.controller';
import { WithdrawalsService } from './withdrawals.service';

@Module({
  imports: [DatabaseModule, JwtModule.register({}), StorageModule, RiskAlertsModule, AdminAuthModule],
  controllers: [WithdrawalsController, WithdrawalWorkflowController],
  providers: [WithdrawalsService, WithdrawalWorkflowService, WithdrawalRiskEnforcementService, BatchWithdrawalWorkflowService],
  exports: [WithdrawalsService, WithdrawalWorkflowService],
})
export class WithdrawalsModule {}
