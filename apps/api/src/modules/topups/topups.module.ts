import { Module } from '@nestjs/common';
import { JwtAuthModule } from '../../common/security/jwt-auth.module';
import { DatabaseModule } from '../../database/database.module';
import { StorageModule } from '../storage/storage.module';
import { DepositWorkflowController } from './deposit-workflow.controller';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { BatchDepositWorkflowService } from './batch-deposit-workflow.service';
import { DepositWorkflowService } from './deposit-workflow.service';
import { TopUpsController } from './topups.controller';
import { TopUpsService } from './topups.service';

@Module({
  imports: [DatabaseModule, JwtAuthModule, StorageModule, AdminAuthModule],
  controllers: [TopUpsController, DepositWorkflowController],
  providers: [TopUpsService, DepositWorkflowService, BatchDepositWorkflowService],
  exports: [TopUpsService, DepositWorkflowService],
})
export class TopUpsModule {}
